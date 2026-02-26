"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SupportedFormat } from "@/lib/converters/types";
import { FORMAT_META, getAcceptString } from "@/lib/converters/registry";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  sourceFormat: SupportedFormat;
  file: File | null;
  disabled?: boolean;
}

/** Format-specific help text for the tooltip */
const FORMAT_HINTS: Partial<
  Record<
    SupportedFormat,
    {
      title: string;
      fields: { name: string; example: string; required?: boolean }[];
    }
  >
> = {
  csv: {
    title: "Sample CSV Format",
    fields: [
      { name: "title", example: "Team Meeting", required: true },
      { name: "start", example: "2024-03-20T14:30", required: true },
      { name: "end", example: "2024-03-20T15:30", required: true },
      { name: "description", example: "Weekly review" },
    ],
  },
};

export function FileUpload({
  onFileSelect,
  sourceFormat,
  file,
  disabled,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const acceptString = getAcceptString(sourceFormat);
  const formatLabel = FORMAT_META[sourceFormat].label;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const validateAndSelect = (selectedFile: File) => {
    if (selectedFile.size > MAX_FILE_SIZE) {
      onFileSelect(null);
      return;
    }
    onFileSelect(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      validateAndSelect(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSelect(selectedFile);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const hint = FORMAT_HINTS[sourceFormat];

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
        isDragging ? "border-blue-500 bg-blue-50/50" : "border-gray-300",
        disabled && "opacity-50 cursor-not-allowed",
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptString}
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />
      <div className="space-y-2">
        {file && (
          <p className="text-sm font-medium text-green-600">
            {file.name.length > 30
              ? `${file.name.substring(0, 27)}...`
              : file.name}
            <span className="text-muted-foreground ml-2">
              ({(file.size / 1024).toFixed(1)} KB)
            </span>
          </p>
        )}
        <p className="text-sm text-gray-500">
          Drag and drop your {formatLabel} file or{" "}
          <button
            type="button"
            className="text-blue-500 hover:text-blue-700 font-medium"
            onClick={handleButtonClick}
            disabled={disabled}
          >
            select
          </button>
        </p>
        <p className="text-xs text-muted-foreground">Max 5MB</p>
      </div>
      {hint && (
        <div className="mt-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 mx-auto"
                >
                  <Info className="w-4 h-4" />
                  <span>{hint.title}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-[320px]"
              >
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">{hint.title}</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-[13px]">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-2 text-left font-medium">Field</th>
                          <th className="p-2 text-left font-medium">Example</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hint.fields.map((field) => (
                          <tr key={field.name} className="border-t">
                            <td className="p-2">
                              {field.name}
                              {field.required && "*"}
                            </td>
                            <td className="p-2">{field.example}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    * Required fields
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
}
