import Papa from "papaparse";
import type { TabularData, ICSPreset } from "./types";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function validateFileSize(file: File): void {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds the 5MB limit.`,
    );
  }
}

async function readFileAsText(file: File): Promise<string> {
  return file.text();
}

async function readFileAsBuffer(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer();
}

//  CSV Parser

const ICS_COLUMN_MAPS: Record<string, Record<string, string>> = {
  simple: {
    title: "title",
    start: "start",
    end: "end",
    description: "description",
    location: "location",
  },
  google: {
    subject: "title",
    "start date": "startDate",
    "start time": "startTime",
    "end date": "endDate",
    "end time": "endTime",
    "all day event": "allDay",
    description: "description",
    location: "location",
  },
  outlook: {
    subject: "title",
    "start date": "startDate",
    "start time": "startTime",
    "end date": "endDate",
    "end time": "endTime",
    description: "description",
    location: "location",
    categories: "categories",
    "all day event": "allDay",
  },
};

/** Fuzzy column name matching for auto-detect */
const COLUMN_PATTERNS: Record<string, RegExp> = {
  title: /^(title|subject|summary|event\s*name|name)$/i,
  start: /^(start|start\s*date|begin|from|date)$/i,
  startTime: /^(start\s*time|begin\s*time|from\s*time)$/i,
  end: /^(end|end\s*date|finish|to|until)$/i,
  endTime: /^(end\s*time|finish\s*time|to\s*time)$/i,
  description: /^(description|details|notes|body|content)$/i,
  location: /^(location|place|venue|where|address)$/i,
  allDay: /^(all\s*day|all\s*day\s*event|whole\s*day)$/i,
};

/** Auto-detect column mapping from header names */
function autoDetectColumns(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const header of headers) {
    const normalized = header.trim().toLowerCase();
    for (const [standardKey, pattern] of Object.entries(COLUMN_PATTERNS)) {
      if (pattern.test(normalized)) {
        mapping[normalized] = standardKey;
        break;
      }
    }
  }
  return mapping;
}

/** Check if a string looks like a parseable date value */
function looksLikeDate(value: string): boolean {
  if (!value || value.trim().length < 4) return false;
  const trimmed = value.trim();
  // ISO-ish: 2024-03-20, 2024-03-20T14:30
  if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(trimmed)) return true;
  // US/EU date: 03/20/2024, 20.03.2024
  if (/^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}/.test(trimmed)) return true;
  // Try native parse as last resort
  const ts = Date.parse(trimmed);
  return !isNaN(ts) && ts > 0;
}

/** Find the column index that most likely contains date values by scanning rows */
function findDateColumnIndex(
  headers: string[],
  rows: string[][],
  excludeIndex?: number,
): number {
  // First: check header names for date-like hints
  const dateHeaderHints = /date|time|start|end|begin|from|when|dt|timestamp/i;
  for (let i = 0; i < headers.length; i++) {
    if (i === excludeIndex) continue;
    if (dateHeaderHints.test(headers[i]) && rows.some((r) => looksLikeDate(r[i] ?? ""))) {
      return i;
    }
  }
  // Second: scan cell values
  const sampleRows = rows.slice(0, Math.min(10, rows.length));
  for (let col = 0; col < headers.length; col++) {
    if (col === excludeIndex) continue;
    const dateCount = sampleRows.filter((r) => looksLikeDate(r[col] ?? "")).length;
    if (dateCount >= sampleRows.length * 0.5) return col;
  }
  return -1;
}

/** Detect which preset matches the CSV headers */
function detectPreset(headers: string[]): string {
  const normalizedHeaders = headers.map((h) => h.trim().toLowerCase());

  // Google Calendar format
  if (
    normalizedHeaders.includes("subject") &&
    normalizedHeaders.includes("start date")
  ) {
    return "google";
  }

  // Outlook format
  if (
    normalizedHeaders.includes("subject") &&
    normalizedHeaders.includes("categories")
  ) {
    return "outlook";
  }

  // simple format
  if (
    normalizedHeaders.includes("title") &&
    normalizedHeaders.includes("start")
  ) {
    return "simple";
  }

  return "auto";
}

/**
 * Normalize any TabularData to ICS-ready format.
 * If columns match a preset → use the preset mapping.
 * If columns don't match any preset → best-effort:
 *   - First text column → title
 *   - First date-like column → start, second → end
 *   - Remaining columns → concatenated description
 */
export function normalizeForICS(
  data: TabularData,
  preset: ICSPreset = "auto",
): TabularData {
  const resolvedPreset =
    preset === "auto" ? detectPreset(data.headers) : preset;

  const columnMap =
    resolvedPreset === "auto"
      ? autoDetectColumns(data.headers)
      : (() => {
          const presetMap = ICS_COLUMN_MAPS[resolvedPreset];
          const result: Record<string, string> = {};
          for (const header of data.headers) {
            const key = header.trim().toLowerCase();
            if (presetMap[key]) {
              result[key] = presetMap[key];
            }
          }
          return result;
        })();

  // Check if we actually matched any meaningful columns
  const hasTitleMapping = Object.values(columnMap).includes("title");
  const hasStartMapping =
    Object.values(columnMap).includes("start") ||
    Object.values(columnMap).includes("startDate");

  // ─── Best-effort fallback: no known column structure ──────────────────
  if (!hasTitleMapping || !hasStartMapping) {
    return bestEffortNormalize(data);
  }

  // ─── Preset / auto-detected mapping ──────────────────────────────────
  const normalizedHeaders = [
    "title",
    "start",
    "end",
    "description",
    "location",
  ];

  const normalizedRows = data.rows.map((row) => {
    const rowObj: Record<string, string> = {};
    data.headers.forEach((h, i) => {
      const key = h.trim().toLowerCase();
      const mappedKey = columnMap[key];
      if (mappedKey) {
        rowObj[mappedKey] = row[i] ?? "";
      }
    });

    let startStr = rowObj["start"] ?? "";
    let endStr = rowObj["end"] ?? "";

    if (rowObj["startDate"]) {
      startStr = rowObj["startTime"]
        ? `${rowObj["startDate"]} ${rowObj["startTime"]}`
        : rowObj["startDate"];
    }
    if (rowObj["endDate"]) {
      endStr = rowObj["endTime"]
        ? `${rowObj["endDate"]} ${rowObj["endTime"]}`
        : rowObj["endDate"];
    }

    return [
      rowObj["title"] ?? "",
      startStr,
      endStr,
      rowObj["description"] ?? "",
      rowObj["location"] ?? "",
    ];
  });

  return { headers: normalizedHeaders, rows: normalizedRows };
}

/**
 * Best-effort normalization when no known preset columns exist.
 * Scans data to find the best candidates for title, start, end.
 * Remaining columns become a concatenated description.
 */
function bestEffortNormalize(data: TabularData): TabularData {
  const { headers, rows } = data;

  // Find date-like columns by scanning actual cell values
  const startColIdx = findDateColumnIndex(headers, rows);
  const endColIdx =
    startColIdx >= 0
      ? findDateColumnIndex(headers, rows, startColIdx)
      : -1;

  // Title: first non-date column, preferring text-heavy columns
  let titleColIdx = -1;
  for (let i = 0; i < headers.length; i++) {
    if (i === startColIdx || i === endColIdx) continue;
    titleColIdx = i;
    break;
  }

  // Indices used for structured fields
  const usedIndices = new Set(
    [titleColIdx, startColIdx, endColIdx].filter((i) => i >= 0),
  );

  // All remaining columns → description
  const descIndices = headers
    .map((_, i) => i)
    .filter((i) => !usedIndices.has(i));

  const normalizedHeaders = [
    "title",
    "start",
    "end",
    "description",
    "location",
  ];

  const normalizedRows = rows.map((row, rowIdx) => {
    const title =
      titleColIdx >= 0 && row[titleColIdx]
        ? row[titleColIdx]
        : `Event ${rowIdx + 1}`;

    const start =
      startColIdx >= 0 && row[startColIdx] ? row[startColIdx] : "";
    const end =
      endColIdx >= 0 && row[endColIdx] ? row[endColIdx] : "";

    // Concatenate remaining columns as "Header: Value" pairs
    const descParts = descIndices
      .map((i) => {
        const val = (row[i] ?? "").trim();
        return val ? `${headers[i]}: ${val}` : "";
      })
      .filter(Boolean);
    const description = descParts.join(" | ");

    return [title, start, end, description, ""];
  });

  return { headers: normalizedHeaders, rows: normalizedRows };
}

export async function parseCSV(file: File): Promise<TabularData> {
  validateFileSize(file);
  const text = await readFileAsText(file);

  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results) => {
        if (results.errors.length > 0) {
          const firstError = results.errors[0];
          reject(
            new Error(
              `CSV parse error (row ${firstError.row}): ${firstError.message}`,
            ),
          );
          return;
        }

        const data = results.data as Record<string, string>[];
        if (data.length === 0) {
          reject(new Error("CSV file is empty or has no data rows."));
          return;
        }

        const headers = results.meta.fields ?? Object.keys(data[0]);
        const rows = data.map((record) =>
          headers.map((h) => String(record[h] ?? "")),
        );

        resolve({ headers, rows });
      },
      error: (error: Error) => {
        reject(new Error(`CSV parse error: ${error.message}`));
      },
    });
  });
}

//  JSON Parser

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

export async function parseJSON(file: File): Promise<TabularData> {
  validateFileSize(file);
  const text = await readFileAsText(file);

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON file. Please check the file format.");
  }

  // Array of objects → tabular
  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      throw new Error("JSON array is empty.");
    }

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
    const headers = ["Key", "Value"];
    const rows = Object.entries(flat).map(([k, v]) => [k, v]);
    return { headers, rows };
  }

  // Primitive
  return { headers: ["Value"], rows: [[String(parsed)]] };
}

//  XLSX Parser

export async function parseXLSX(file: File): Promise<TabularData> {
  validateFileSize(file);
  const buffer = await readFileAsBuffer(file);

  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet || worksheet.rowCount === 0) {
    throw new Error("Excel file is empty or has no worksheets.");
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

  if (headers.length === 0) {
    throw new Error("Excel file has no data.");
  }

  return { headers, rows };
}

//  ICS Parser

export async function parseICS(file: File): Promise<TabularData> {
  validateFileSize(file);
  const text = await readFileAsText(file);

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

//  Markdown Parser

/** Parse Markdown file returns raw text  */
export async function parseMD(file: File): Promise<string> {
  validateFileSize(file);
  return readFileAsText(file);
}

/**
 * Parse Markdown file to TabularData.
 * Strategy:
 * 1. If the markdown contains a pipe table → extract it as structured data
 * 2. Otherwise → each non-empty line becomes a row with a single "Content" column
 */
export async function parseMDTabular(file: File): Promise<TabularData> {
  validateFileSize(file);
  const text = await readFileAsText(file);
  const lines = text.split("\n");

  // Try to find a markdown pipe table
  const tableResult = extractMarkdownTable(lines);
  if (tableResult) return tableResult;

  // Fallback: line-by-line content
  const rows = lines
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      // Strip markdown heading markers
      const cleaned = line.replace(/^#{1,6}\s+/, "");
      return [cleaned];
    });

  if (rows.length === 0) {
    throw new Error("Markdown file is empty.");
  }

  return { headers: ["Content"], rows };
}

/** Extract a pipe-delimited table from markdown lines */
function extractMarkdownTable(lines: string[]): TabularData | null {
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i].trim();
    const nextLine = lines[i + 1]?.trim() ?? "";

    if (!line.includes("|") || !nextLine.includes("|")) continue;
    if (!/^[|\s:-]+$/.test(nextLine)) continue;

    const headers = line
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    if (headers.length === 0) continue;

    const rows: string[][] = [];
    for (let j = i + 2; j < lines.length; j++) {
      const rowLine = lines[j].trim();
      if (!rowLine.includes("|")) break;

      const cells = rowLine
        .split("|")
        .map((c) => c.trim())
        .filter((_, idx, arr) => {
          if (idx === 0 && arr[0] === "") return false;
          if (idx === arr.length - 1 && arr[arr.length - 1] === "") return false;
          return true;
        });

      while (cells.length < headers.length) cells.push("");
      rows.push(cells.slice(0, headers.length));
    }

    if (rows.length > 0) return { headers, rows };
  }

  return null;
}
