import type {
  SupportedFormat,
  ConversionOptions,
  ConversionResult,
} from "./types";
import { isValidPair, FORMAT_META } from "./registry";
import {
  parseCSV,
  parseJSON,
  parseXLSX,
  parseICS,
  parseMDTabular,
  normalizeForICS,
} from "./parsers";
import { toCSV, toJSON, toXLSX, toICS, toMarkdown } from "./generators";

function deriveFilename(
  sourceFilename: string,
  target: SupportedFormat,
): string {
  const dotIdx = sourceFilename.lastIndexOf(".");
  const baseName =
    dotIdx > 0 ? sourceFilename.slice(0, dotIdx) : sourceFilename;
  const ext = FORMAT_META[target].extensions[0];
  return `${baseName}${ext}`;
}

export async function convertFile(
  file: File,
  source: SupportedFormat,
  target: SupportedFormat,
  options?: ConversionOptions,
): Promise<ConversionResult> {
  // Validation
  if (!isValidPair(source, target)) {
    throw new Error(
      `Conversion from ${source.toUpperCase()} to ${target.toUpperCase()} is not supported.`,
    );
  }

  const filename = deriveFilename(file.name, target);
  const mimeType = FORMAT_META[target].mimeType;

  // server-side
  if (target === "pdf") {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("sourceFormat", source);
    formData.append("targetFormat", target);
    if (options) {
      formData.append("options", JSON.stringify(options));
    }

    const response = await fetch("/api/convert", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "PDF conversion failed.");
    }

    const blob = await response.blob();
    return { blob, filename, mimeType };
  }

  // Client side conversion

  const parsedData = await (async () => {
    switch (source) {
      case "csv":
        return parseCSV(file);
      case "json":
        return parseJSON(file);
      case "xlsx":
        return parseXLSX(file);
      case "ics":
        return parseICS(file);
      case "md":
        return parseMDTabular(file);
      default:
        throw new Error(`Unsupported source format: ${source}`);
    }
  })();

  const blob = await (async () => {
    switch (target) {
      case "csv":
        return toCSV(parsedData);
      case "json":
        return toJSON(parsedData);
      case "xlsx":
        return toXLSX(parsedData);
      case "ics": {
        // Normalize columns
        const icsData = normalizeForICS(parsedData, options?.icsPreset);
        return toICS(icsData, options);
      }
      case "md":
        return toMarkdown(parsedData);
      default:
        throw new Error(`Unsupported target format: ${target}`);
    }
  })();

  return { blob, filename, mimeType };
}
