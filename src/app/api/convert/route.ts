import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { marked } from "marked";
import type {
  SupportedFormat,
  ConversionOptions,
  TabularData,
} from "@/lib/converters/types";

// ─── Server-side Parsers (for PDF generation) ────────────────────────────────

async function parseCSVServer(text: string): Promise<TabularData> {
  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as Record<string, string>[];
        if (data.length === 0) {
          reject(new Error("CSV file is empty."));
          return;
        }
        const headers = results.meta.fields ?? Object.keys(data[0]);
        const rows = data.map((r) => headers.map((h) => String(r[h] ?? "")));
        resolve({ headers, rows });
      },
      error: (err: Error) =>
        reject(new Error(`CSV parse error: ${err.message}`)),
    });
  });
}

async function parseJSONServer(text: string): Promise<TabularData> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON file.");
  }

  if (Array.isArray(parsed)) {
    if (parsed.length === 0) throw new Error("JSON array is empty.");

    const flatRows = parsed.map((item) =>
      typeof item === "object" && item !== null
        ? flattenObject(item as Record<string, unknown>)
        : { value: String(item) },
    );

    const headerSet = new Set<string>();
    flatRows.forEach((row) =>
      Object.keys(row).forEach((k) => headerSet.add(k)),
    );
    const headers = Array.from(headerSet);
    const rows = flatRows.map((row) => headers.map((h) => row[h] ?? ""));
    return { headers, rows };
  }

  if (typeof parsed === "object" && parsed !== null) {
    const flat = flattenObject(parsed as Record<string, unknown>);
    return {
      headers: ["Key", "Value"],
      rows: Object.entries(flat).map(([k, v]) => [k, v]),
    };
  }

  return { headers: ["Value"], rows: [[String(parsed)]] };
}

function flattenObject(
  obj: Record<string, unknown>,
  prefix = "",
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value === null || value === undefined) {
      result[fullKey] = "";
    } else if (typeof value === "object" && !Array.isArray(value)) {
      Object.assign(
        result,
        flattenObject(value as Record<string, unknown>, fullKey),
      );
    } else if (Array.isArray(value)) {
      result[fullKey] = JSON.stringify(value);
    } else {
      result[fullKey] = String(value);
    }
  }
  return result;
}

async function parseICSServer(text: string): Promise<TabularData> {
  const ICAL = await import("ical.js");
  const jcalData = ICAL.default.parse(text);
  const comp = new ICAL.default.Component(jcalData);
  const vevents = comp.getAllSubcomponents("vevent");

  if (vevents.length === 0) {
    throw new Error("ICS file contains no events.");
  }

  const headers = ["title", "start", "end", "description", "location"];
  const rows: string[][] = vevents.map(
    (vevent: InstanceType<typeof ICAL.default.Component>) => {
      const event = new ICAL.default.Event(vevent);
      return [
        event.summary ?? "",
        event.startDate?.toString() ?? "",
        event.endDate?.toString() ?? "",
        event.description ?? "",
        event.location ?? "",
      ];
    },
  );

  return { headers, rows };
}

async function parseXLSXServer(buffer: ArrayBuffer): Promise<TabularData> {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet || worksheet.rowCount === 0) {
    throw new Error("Excel file is empty.");
  }

  const headers: string[] = [];
  const rows: string[][] = [];

  worksheet.eachRow((row, rowNumber) => {
    const values = row.values as (string | number | null)[];
    const cells = values
      .slice(1)
      .map((v) => (v === null || v === undefined ? "" : String(v)));

    if (rowNumber === 1) {
      headers.push(...cells);
    } else {
      while (cells.length < headers.length) cells.push("");
      rows.push(cells.slice(0, headers.length));
    }
  });

  if (headers.length === 0) throw new Error("Excel file has no data.");
  return { headers, rows };
}

// ─── PDF Generation ──────────────────────────────────────────────────────────

function generateTabularPDF(
  data: TabularData,
  options?: ConversionOptions,
): Buffer {
  const orientation = options?.pdfOrientation ?? "portrait";
  const theme = options?.pdfTheme ?? "grid";

  const doc = new jsPDF({ orientation, unit: "mm", format: "a4" });

  // Title
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Data Export", 14, 15);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(128);
  doc.text(
    `Generated by justconvert • ${new Date().toLocaleDateString()}`,
    14,
    21,
  );
  doc.setTextColor(0);

  // Table
  autoTable(doc, {
    startY: 28,
    head: [data.headers],
    body: data.rows,
    theme,
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [30, 30, 30],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    margin: { left: 14, right: 14 },
    didDrawPage: (hookData) => {
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(7);
      doc.setTextColor(160);
      doc.text(
        `Page ${hookData.pageNumber} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 8,
        { align: "center" },
      );
    },
  });

  return Buffer.from(doc.output("arraybuffer"));
}

function generateMarkdownPDF(
  mdText: string,
  options?: ConversionOptions,
): Buffer {
  const orientation = options?.pdfOrientation ?? "portrait";
  const doc = new jsPDF({ orientation, unit: "mm", format: "a4" });

  const pageWidth = doc.internal.pageSize.width;
  const margin = 14;
  const maxWidth = pageWidth - margin * 2;
  let y = 20;

  const tokens = marked.lexer(mdText);

  const addPageIfNeeded = (neededSpace: number) => {
    if (y + neededSpace > doc.internal.pageSize.height - 15) {
      doc.addPage();
      y = 15;
    }
  };

  for (const token of tokens) {
    switch (token.type) {
      case "heading": {
        const sizes: Record<number, number> = {
          1: 20,
          2: 16,
          3: 14,
          4: 12,
          5: 11,
          6: 10,
        };
        const fontSize = sizes[token.depth] ?? 10;
        addPageIfNeeded(fontSize * 0.8);
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", "bold");
        doc.text(token.text, margin, y);
        y += fontSize * 0.6 + 4;
        break;
      }
      case "paragraph": {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(token.text, maxWidth);
        addPageIfNeeded(lines.length * 5);
        doc.text(lines, margin, y);
        y += lines.length * 5 + 3;
        break;
      }
      case "code": {
        doc.setFontSize(8);
        doc.setFont("courier", "normal");
        const codeLines = doc.splitTextToSize(token.text, maxWidth - 8);
        addPageIfNeeded(codeLines.length * 4 + 6);
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, y - 3, maxWidth, codeLines.length * 4 + 6, "F");
        doc.text(codeLines, margin + 4, y + 1);
        y += codeLines.length * 4 + 8;
        doc.setFont("helvetica", "normal");
        break;
      }
      case "list": {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        for (const item of token.items) {
          const bullet = token.ordered ? `${token.start ?? 1}. ` : "• ";
          const text = item.text;
          const itemLines = doc.splitTextToSize(
            `${bullet}${text}`,
            maxWidth - 4,
          );
          addPageIfNeeded(itemLines.length * 5);
          doc.text(itemLines, margin + 4, y);
          y += itemLines.length * 5 + 2;
        }
        y += 2;
        break;
      }
      case "hr": {
        addPageIfNeeded(6);
        doc.setDrawColor(200);
        doc.line(margin, y, pageWidth - margin, y);
        y += 6;
        break;
      }
      case "blockquote": {
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(100);
        const bqText = token.text ?? "";
        const bqLines = doc.splitTextToSize(bqText, maxWidth - 10);
        addPageIfNeeded(bqLines.length * 5 + 4);
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, y - 2, maxWidth, bqLines.length * 5 + 4, "F");
        doc.setDrawColor(180);
        doc.setLineWidth(0.5);
        doc.line(margin, y - 2, margin, y + bqLines.length * 5 + 2);
        doc.text(bqLines, margin + 6, y + 2);
        y += bqLines.length * 5 + 8;
        doc.setTextColor(0);
        doc.setFont("helvetica", "normal");
        break;
      }
      case "table": {
        if (token.header && token.rows) {
          const head = token.header.map((cell: { text: string }) => cell.text);
          const body = token.rows.map((row: { text: string }[]) =>
            row.map((cell: { text: string }) => cell.text),
          );
          addPageIfNeeded(20);
          autoTable(doc, {
            startY: y,
            head: [head],
            body,
            theme: "grid",
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: {
              fillColor: [30, 30, 30],
              textColor: [255, 255, 255],
              fontStyle: "bold",
            },
            margin: { left: margin, right: margin },
          });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const lastTable = (doc as any).lastAutoTable;
          y = lastTable?.finalY ? lastTable.finalY + 6 : y + 20;
        }
        break;
      }
      case "space":
        y += 4;
        break;
      default:
        break;
    }
  }

  return Buffer.from(doc.output("arraybuffer"));
}

// ─── Route Handler ───────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file = data.get("file") as File;
    const sourceFormat = (data.get("sourceFormat") as SupportedFormat) ?? "csv";
    const optionsStr = data.get("options") as string | null;
    const options: ConversionOptions = optionsStr ? JSON.parse(optionsStr) : {};

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit." },
        { status: 400 },
      );
    }

    let pdfBuffer: Buffer;

    if (sourceFormat === "md") {
      const mdText = await file.text();
      pdfBuffer = generateMarkdownPDF(mdText, options);
    } else {
      let tabularData: TabularData;

      switch (sourceFormat) {
        case "csv": {
          const text = await file.text();
          tabularData = await parseCSVServer(text);
          break;
        }
        case "json": {
          const text = await file.text();
          tabularData = await parseJSONServer(text);
          break;
        }
        case "xlsx": {
          const buffer = await file.arrayBuffer();
          tabularData = await parseXLSXServer(buffer);
          break;
        }
        case "ics": {
          const icsText = await file.text();
          tabularData = await parseICSServer(icsText);
          break;
        }
        default:
          return NextResponse.json(
            { error: `PDF conversion from ${sourceFormat} is not supported.` },
            { status: 400 },
          );
      }

      pdfBuffer = generateTabularPDF(tabularData, options);
    }

    const filename = file.name.replace(/\.[^.]+$/, "") + ".pdf";

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("PDF conversion error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown error during conversion.",
      },
      { status: 500 },
    );
  }
}
