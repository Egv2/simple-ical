"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight } from "lucide-react";
import type { SupportedFormat } from "@/lib/converters/types";
import {
  FORMAT_META,
  getSourceFormats,
  getValidTargets,
  getDefaultTarget,
} from "@/lib/converters/registry";

interface ConversionOptionsProps {
  sourceFormat: SupportedFormat;
  targetFormat: SupportedFormat;
  onSourceChange: (format: SupportedFormat) => void;
  onTargetChange: (format: SupportedFormat) => void;
}

export function ConversionOptions({
  sourceFormat,
  targetFormat,
  onSourceChange,
  onTargetChange,
}: ConversionOptionsProps) {
  const sourceFormats = getSourceFormats();
  const validTargets = getValidTargets(sourceFormat);

  const handleSourceChange = (value: string) => {
    const newSource = value as SupportedFormat;
    onSourceChange(newSource);

    // Auto-switch target if current target is invalid for new source
    const newValidTargets = getValidTargets(newSource);
    if (!newValidTargets.includes(targetFormat)) {
      onTargetChange(getDefaultTarget(newSource));
    }
  };

  const handleTargetChange = (value: string) => {
    onTargetChange(value as SupportedFormat);
  };

  return (
    <div className="flex items-center gap-4 w-full">
      <Select value={sourceFormat} onValueChange={handleSourceChange}>
        <SelectTrigger className="neo-brutal-box">
          <SelectValue placeholder="Source format" />
        </SelectTrigger>
        <SelectContent>
          {sourceFormats.map((format) => (
            <SelectItem key={format} value={format}>
              {FORMAT_META[format].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <ArrowRight className="flex-shrink-0" />

      <Select value={targetFormat} onValueChange={handleTargetChange}>
        <SelectTrigger className="neo-brutal-box">
          <SelectValue placeholder="Target format" />
        </SelectTrigger>
        <SelectContent>
          {validTargets.map((format) => (
            <SelectItem key={format} value={format}>
              {FORMAT_META[format].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
