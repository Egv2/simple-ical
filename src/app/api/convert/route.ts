import { NextRequest, NextResponse } from "next/server";
import { parse } from "csv-parse";
import icalToolkit from "ical-toolkit";
import dayjs from "dayjs";

// Add console.log for debugging
console.log("API route initialized");

// CSV Record interface
interface CsvRecord {
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
}

// CSV validasyonu
const validateCSV = (records: CsvRecord[]) => {
  const requiredColumns = ["title", "start", "end"];
  const firstRecord = records[0];

  const missingColumns = requiredColumns.filter(
    (col) => !Object.keys(firstRecord).includes(col)
  );

  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(", ")}`);
  }
};

export async function POST(request: NextRequest) {
  try {
    console.log("Received POST request");
    const data = await request.formData();
    const file = data.get("file") as File;

    if (!file) {
      console.error("No file provided");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log("File received:", file.name, file.type);
    const csvText = await file.text();
    console.log("CSV content sample:", csvText.substring(0, 100));

    // CSV parsing
    const records = await new Promise<CsvRecord[]>((resolve, reject) => {
      parse(
        csvText,
        {
          columns: true,
          trim: true,
          skip_empty_lines: true,
        },
        (err, records) => {
          if (err) {
            console.error("CSV parse error:", err);
            reject(err);
          }
          console.log("Parsed records:", records);
          resolve(records);
        }
      );
    });

    validateCSV(records);

    // ICS builder
    const builder = icalToolkit.createIcsFileBuilder();

    builder.calname = "My Calendar";
    builder.timezone = "Europe/Istanbul";
    builder.method = "PUBLISH";

    // Events oluştur
    (records as CsvRecord[]).forEach((record, index) => {
      const start = dayjs(record.start);
      const end = dayjs(record.end);

      if (!start.isValid() || !end.isValid()) {
        throw new Error(`Invalid date format in record ${index}`);
      }

      builder.events.push({
        start: start.toDate(),
        end: end.toDate(),
        summary: record.title || `Event ${index + 1}`,
        description: record.description || "",
        location: record.location || "",
        uid: `event-${index}-${Date.now()}@csvtoics.app`,
        stamp: new Date(),
      });
    });

    // ICS dosyası oluştur
    const icsString = builder.toString();

    if (!icsString) {
      throw new Error("Failed to generate ICS content");
    }

    return new NextResponse(icsString, {
      headers: {
        "Content-Type": "text/calendar",
        "Content-Disposition": 'attachment; filename="events.ics"',
      },
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
