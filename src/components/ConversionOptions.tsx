"use client";

type SupportedFormats = "csv" | "json" | "xlsx" | "ics" | "pdf" | "md";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight } from "lucide-react";

const FORMATS = [
  { value: "csv" as SupportedFormats, label: "CSV" },
  { value: "json" as SupportedFormats, label: "JSON" },
  { value: "xlsx" as SupportedFormats, label: "Excel" },
  { value: "ics" as SupportedFormats, label: "iCalendar" },
  { value: "pdf" as SupportedFormats, label: "PDF" },
  { value: "md" as SupportedFormats, label: "Markdown" },
];

interface ConversionOptionsProps {
  sourceFormat: SupportedFormats;
  targetFormat: SupportedFormats;
  onSourceChange: (format: SupportedFormats) => void;
  onTargetChange: (format: SupportedFormats) => void;
}

export function ConversionOptions({
  sourceFormat,
  targetFormat,
  onSourceChange,
  onTargetChange,
}: ConversionOptionsProps) {
  return (
    <div className="flex items-center gap-4 w-full">
      <Select value={sourceFormat} onValueChange={onSourceChange}>
        <SelectTrigger className="neo-brutal-box">
          <SelectValue placeholder="Source format" />
        </SelectTrigger>
        <SelectContent>
          {FORMATS.map((format) => (
            <SelectItem key={format.value} value={format.value}>
              {format.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <ArrowRight className="flex-shrink-0" />

      <Select value={targetFormat} onValueChange={onTargetChange}>
        <SelectTrigger className="neo-brutal-box">
          <SelectValue placeholder="Target format" />
        </SelectTrigger>
        <SelectContent>
          {FORMATS.map((format) => (
            <SelectItem key={format.value} value={format.value}>
              {format.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
