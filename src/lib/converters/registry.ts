import type { SupportedFormat } from "./types";

/** Format metadata: label, file extensions, MIME type */
export const FORMAT_META: Record<
  SupportedFormat,
  { label: string; extensions: string[]; mimeType: string }
> = {
  csv: { label: "CSV", extensions: [".csv"], mimeType: "text/csv" },
  json: { label: "JSON", extensions: [".json"], mimeType: "application/json" },
  xlsx: {
    label: "Excel",
    extensions: [".xlsx", ".xls"],
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
  ics: {
    label: "iCalendar",
    extensions: [".ics"],
    mimeType: "text/calendar",
  },
  pdf: { label: "PDF", extensions: [".pdf"], mimeType: "application/pdf" },
  md: {
    label: "Markdown",
    extensions: [".md", ".markdown"],
    mimeType: "text/markdown",
  },
};

/** Valid conversion pairs: source → allowed targets (full matrix) */
const VALID_PAIRS: Record<SupportedFormat, SupportedFormat[]> = {
  csv: ["json", "xlsx", "ics", "pdf", "md"],
  json: ["csv", "xlsx", "ics", "pdf", "md"],
  xlsx: ["csv", "json", "ics", "pdf", "md"],
  ics: ["csv", "json", "xlsx", "pdf", "md"],
  md: ["csv", "json", "xlsx", "ics", "pdf"],
  pdf: [], // PDF parsing requires OCR/complex extraction — not supported as source
};

/** Check if a source→target conversion pair is valid */
export function isValidPair(
  source: SupportedFormat,
  target: SupportedFormat,
): boolean {
  return VALID_PAIRS[source]?.includes(target) ?? false;
}

/** Get all valid target formats for a given source */
export function getValidTargets(source: SupportedFormat): SupportedFormat[] {
  return VALID_PAIRS[source] ?? [];
}

/** Get all formats that can be used as source (have at least one target) */
export function getSourceFormats(): SupportedFormat[] {
  return (Object.keys(VALID_PAIRS) as SupportedFormat[]).filter(
    (f) => VALID_PAIRS[f].length > 0,
  );
}

/** Get the file accept string for an input element */
export function getAcceptString(source: SupportedFormat): string {
  return FORMAT_META[source].extensions.join(",");
}

/** Get the default target format for a given source */
export function getDefaultTarget(source: SupportedFormat): SupportedFormat {
  const targets = getValidTargets(source);
  return targets[0] ?? "json";
}
