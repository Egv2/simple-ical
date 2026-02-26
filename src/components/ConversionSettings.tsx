"use client";

import { Settings2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  SupportedFormat,
  ConversionOptions,
  ICSPreset,
} from "@/lib/converters/types";

interface ConversionSettingsProps {
  sourceFormat: SupportedFormat;
  targetFormat: SupportedFormat;
  options: ConversionOptions;
  onOptionsChange: (options: ConversionOptions) => void;
}

const TIMEZONES = [
  "UTC",
  "Europe/Istanbul",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
];

const ICS_PRESETS: { value: ICSPreset; label: string; description: string }[] =
  [
    {
      value: "auto",
      label: "Auto-detect",
      description: "Detect CSV column format automatically",
    },
    {
      value: "simple",
      label: "Simple",
      description: "title, start, end, description, location",
    },
    {
      value: "google",
      label: "Google Calendar",
      description: "Subject, Start Date, Start Time...",
    },
    {
      value: "outlook",
      label: "Outlook",
      description: "Subject, Start Date, Categories...",
    },
  ];

const PDF_THEMES: { value: string; label: string }[] = [
  { value: "grid", label: "Grid" },
  { value: "striped", label: "Striped" },
  { value: "plain", label: "Plain" },
];

/** Check if settings are available for a given conversion pair */
function hasSettings(
  source: SupportedFormat,
  target: SupportedFormat,
): boolean {
  if (target === "ics") return true; // ICS settings available for any source
  if (target === "pdf") return true;
  return false;
}

export function ConversionSettings({
  sourceFormat,
  targetFormat,
  options,
  onOptionsChange,
}: ConversionSettingsProps) {
  if (!hasSettings(sourceFormat, targetFormat)) return null;

  const update = (patch: Partial<ConversionOptions>) => {
    onOptionsChange({ ...options, ...patch });
  };

  const isICS = targetFormat === "ics";
  const showPresets =
    isICS && (sourceFormat === "csv" || sourceFormat === "xlsx");
  const isPDF = targetFormat === "pdf";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="p-2 rounded-md border-2 border-black dark:border-white neo-brutal-box hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px] transition-all duration-200"
          aria-label="Conversion settings"
        >
          <Settings2 className="w-5 h-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        className="w-80 neo-brutal-box bg-white dark:bg-black p-4 space-y-4"
      >
        <h4 className="font-mono font-bold text-sm border-b-2 border-black dark:border-white pb-2">
          Settings
        </h4>

        {/* CSV → ICS Settings */}
        {isICS && (
          <>
            {showPresets && (
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">
                  Column Format
                </label>
                <Select
                  value={options.icsPreset ?? "auto"}
                  onValueChange={(v) => update({ icsPreset: v as ICSPreset })}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICS_PRESETS.map((preset) => (
                      <SelectItem key={preset.value} value={preset.value}>
                        <div>
                          <span className="font-medium">{preset.label}</span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {preset.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">
                Timezone
              </label>
              <Select
                value={options.timezone ?? "UTC"}
                onValueChange={(v) => update({ timezone: v })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">
                Calendar Name
              </label>
              <input
                type="text"
                value={options.calendarName ?? "My Calendar"}
                onChange={(e) => update({ calendarName: e.target.value })}
                className="w-full h-8 px-2 text-sm border-2 border-input rounded-md bg-transparent font-mono focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="My Calendar"
              />
            </div>
          </>
        )}

        {/* PDF Settings */}
        {isPDF && (
          <>
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">
                Orientation
              </label>
              <Select
                value={options.pdfOrientation ?? "portrait"}
                onValueChange={(v) =>
                  update({ pdfOrientation: v as "portrait" | "landscape" })
                }
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portrait">Portrait</SelectItem>
                  <SelectItem value="landscape">Landscape</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">
                Table Theme
              </label>
              <Select
                value={options.pdfTheme ?? "grid"}
                onValueChange={(v) =>
                  update({ pdfTheme: v as "grid" | "striped" | "plain" })
                }
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PDF_THEMES.map((theme) => (
                    <SelectItem key={theme.value} value={theme.value}>
                      {theme.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
