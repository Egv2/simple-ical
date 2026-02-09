import { NextRequest, NextResponse } from "next/server";
import { parse } from "csv-parse";
import icalToolkit from "ical-toolkit";
import dayjs from "dayjs";

// CSV Record interface
interface CsvRecord {
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
}

// CSV validation
const validateCSV = (records: CsvRecord[]) => {
  const requiredColumns = ["title", "start", "end"];
  const firstRecord = records[0];

  const missingColumns = requiredColumns.filter(
    (col) => !Object.keys(firstRecord).includes(col),
  );

  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(", ")}`);
  }
};

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file = data.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const csvText = await file.text();

    // Parse CSV
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
            reject(err);
          } else {
            resolve(records);
          }
        },
      );
    });

    validateCSV(records);

    // Create ICS builder
    const builder = icalToolkit.createIcsFileBuilder();

    builder.calname = "My Calendar";
    builder.timezone = "UTC";
    builder.method = "PUBLISH";

    // Create events
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

    // Generate ICS file
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
