import Papa from "papaparse";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import type { TabularData, ConversionOptions } from "./types";

dayjs.extend(utc);

//  CSV Generator

/** Convert TabularData to CSV Blob */
export function toCSV(data: TabularData): Blob {
  const csvString = Papa.unparse({
    fields: data.headers,
    data: data.rows,
  });
  return new Blob([csvString], { type: "text/csv;charset=utf-8" });
}

//  JSON Generator

/** Convert TabularData to JSON Blob (array of objects) */
export function toJSON(data: TabularData): Blob {
  const objects = data.rows.map((row) => {
    const obj: Record<string, string> = {};
    data.headers.forEach((h, i) => {
      obj[h] = row[i] ?? "";
    });
    return obj;
  });

  const jsonString = JSON.stringify(objects, null, 2);
  return new Blob([jsonString], { type: "application/json;charset=utf-8" });
}

// XLSX Generator

/** Convert TabularData to XLSX Blob */
export async function toXLSX(data: TabularData): Promise<Blob> {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sheet 1");

  worksheet.addRow(data.headers);
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE2E2E2" },
    };
    cell.border = {
      bottom: { style: "thin" },
    };
  });

  data.rows.forEach((row) => worksheet.addRow(row));

  worksheet.columns.forEach((col, i) => {
    const maxLen = Math.max(
      data.headers[i]?.length ?? 10,
      ...data.rows.map((r) => (r[i] ?? "").length),
    );
    col.width = Math.min(Math.max(maxLen + 2, 10), 50);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

//  ICS Generator

/** Escape special characters in text fields */
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/** Try to parse a date string with multiple strategies */
function formatICSDate(dateStr: string): string | null {
  if (!dateStr || !dateStr.trim()) return null;

  // Try dayjs default parsing first
  let d = dayjs(dateStr.trim());
  if (d.isValid()) return d.utc().format("YYYYMMDDTHHmmss") + "Z";

  // Try common non-ISO formats: DD/MM/YYYY, DD.MM.YYYY
  const euroMatch = dateStr
    .trim()
    .match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})(?:\s+(\d{1,2}[:.\d]*))?/);
  if (euroMatch) {
    const [, p1, p2, p3, time] = euroMatch;
    const year = p3.length === 2 ? `20${p3}` : p3;
    // Try DD/MM/YYYY first (European), then MM/DD/YYYY (US)
    const attempts = [
      `${year}-${p2.padStart(2, "0")}-${p1.padStart(2, "0")}`,
      `${year}-${p1.padStart(2, "0")}-${p2.padStart(2, "0")}`,
    ];
    for (const dateAttempt of attempts) {
      const full = time ? `${dateAttempt}T${time}` : dateAttempt;
      d = dayjs(full);
      if (d.isValid()) return d.utc().format("YYYYMMDDTHHmmss") + "Z";
    }
  }

  return null;
}

export function toICS(data: TabularData, options?: ConversionOptions): Blob {
  const calName = options?.calendarName ?? "My Calendar";
  const timezone = options?.timezone ?? "UTC";
  const now = new Date().toISOString();
  const dtstamp =
    formatICSDate(now) ?? dayjs().utc().format("YYYYMMDDTHHmmss") + "Z";

  const idx: Record<string, number> = {};
  data.headers.forEach((h, i) => {
    idx[h.toLowerCase()] = i;
  });

  // Flexible column lookup — no hard requirement
  const titleIdx =
    idx["title"] ?? idx["summary"] ?? idx["subject"] ?? idx["name"] ?? -1;
  const startIdx =
    idx["start"] ?? idx["date"] ?? idx["begin"] ?? idx["from"] ?? -1;
  const endIdx = idx["end"] ?? idx["finish"] ?? idx["to"] ?? idx["until"] ?? -1;
  const descIdx = idx["description"] ?? idx["details"] ?? idx["notes"] ?? -1;
  const locIdx = idx["location"] ?? idx["place"] ?? idx["venue"] ?? -1;

  const skippedRows: number[] = [];

  const events = data.rows
    .map((row, i) => {
      // Title: mapped column, or first non-empty cell, or fallback
      let title = titleIdx >= 0 ? (row[titleIdx] ?? "") : "";
      if (!title) {
        title =
          row.find((cell) => cell && cell.trim().length > 0) ??
          `Event ${i + 1}`;
      }

      // Start date: mapped column, or try to find any date-like cell in the row
      let startStr = startIdx >= 0 ? (row[startIdx] ?? "") : "";
      if (!startStr || !formatICSDate(startStr)) {
        // Scan row cells for something that parses as a date
        for (let c = 0; c < row.length; c++) {
          if (c === titleIdx || c === descIdx || c === locIdx) continue;
          if (row[c] && formatICSDate(row[c])) {
            startStr = row[c];
            break;
          }
        }
      }

      const startFormatted = formatICSDate(startStr);
      if (!startFormatted) {
        skippedRows.push(i + 1);
        return null; // gracefully skip rows without any parseable date
      }

      const endStr = endIdx >= 0 ? (row[endIdx] ?? "") : "";
      const endFormatted = formatICSDate(endStr) ?? startFormatted;

      const description = descIdx >= 0 ? (row[descIdx] ?? "") : "";
      const location = locIdx >= 0 ? (row[locIdx] ?? "") : "";

      const lines = [
        "BEGIN:VEVENT",
        `UID:event-${i}-${Date.now()}@justconvert.app`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART:${startFormatted}`,
        `DTEND:${endFormatted}`,
        `SUMMARY:${escapeICS(title)}`,
      ];

      if (description) lines.push(`DESCRIPTION:${escapeICS(description)}`);
      if (location) lines.push(`LOCATION:${escapeICS(location)}`);

      lines.push("END:VEVENT");
      return lines.join("\r\n");
    })
    .filter(Boolean);

  if (events.length === 0) {
    const hint =
      skippedRows.length > 0
        ? ` ${skippedRows.length} rows were skipped because no parseable date was found.`
        : "";
    throw new Error(
      `No valid events could be generated from the data.${hint} ` +
        `Columns found: ${data.headers.join(", ")}. ` +
        `Tip: Include a column with date values (e.g. 2024-03-20) for automatic detection.`,
    );
  }

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//JustConvert//EN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeICS(calName)}`,
    `X-WR-TIMEZONE:${timezone}`,
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");

  return new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
}

// Markdown Generator

export function toMarkdown(data: TabularData): Blob {
  const headerLine = `| ${data.headers.join(" | ")} |`;
  const separatorLine = `| ${data.headers.map(() => "---").join(" | ")} |`;

  const dataLines = data.rows.map(
    (row) =>
      `| ${data.headers.map((_, i) => (row[i] ?? "").replace(/\|/g, "\\|")).join(" | ")} |`,
  );

  const md = [headerLine, separatorLine, ...dataLines].join("\n");
  return new Blob([md], { type: "text/markdown;charset=utf-8" });
}
