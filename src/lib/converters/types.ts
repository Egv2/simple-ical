/** Supported file formats for conversion */
export type SupportedFormat = "csv" | "json" | "xlsx" | "ics" | "pdf" | "md";

/** Tabular data: universal intermediate representation for conversions */
export interface TabularData {
  headers: string[];
  rows: string[][];
}

/** CSV → ICS preset formats */
export type ICSPreset = "simple" | "google" | "outlook" | "auto";

/** Conversion options passed from UI settings */
export interface ConversionOptions {
  /** CSV → ICS: which CSV column mapping to use */
  icsPreset?: ICSPreset;
  /** CSV → ICS: timezone for calendar events */
  timezone?: string;
  /** CSV → ICS: calendar display name */
  calendarName?: string;
  /** → PDF: page orientation */
  pdfOrientation?: "portrait" | "landscape";
  /** → PDF: table theme */
  pdfTheme?: "grid" | "striped" | "plain";
}

/** Result of a file conversion */
export interface ConversionResult {
  blob: Blob;
  filename: string;
  mimeType: string;
}
