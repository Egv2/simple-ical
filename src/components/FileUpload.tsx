"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  acceptedFormats: string[];
  file: File | null;
  disabled?: boolean;
}

export function FileUpload({
  onFileSelect,
  acceptedFormats,
  file,
  disabled,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && acceptedFormats.includes(droppedFile.type)) {
      onFileSelect(droppedFile);
    }
  };

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
        isDragging ? "border-blue-500 bg-blue-50/50" : "border-gray-300",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])}
        disabled={disabled}
      />
      <div className="space-y-2">
        {file && (
          <p className="text-sm font-medium text-green-600">
            {file.name.length > 30
              ? `${file.name.substring(0, 27)}...`
              : file.name}
          </p>
        )}
        <p className="text-sm text-gray-500">
          CSV dosyanızı sürükleyip bırakın veya{" "}
          <button
            className="text-blue-500 hover:text-blue-700 font-medium"
            onClick={() => {
              console.log("Dosya seçim tetiklendi");
              document.querySelector("input")?.click();
            }}
            disabled={disabled}
          >
            seçin
          </button>
        </p>
      </div>
      <div className="mt-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 mx-auto">
                <Info className="w-4 h-4" />
                <span>CSV format detayları</span>
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-[320px]"
            >
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Örnek CSV Formatı</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-[13px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-2 text-left font-medium">Başlık</th>
                        <th className="p-2 text-left font-medium">Örnek</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t">
                        <td className="p-2">title*</td>
                        <td className="p-2">Takım Toplantısı</td>
                      </tr>
                      <tr className="border-t">
                        <td className="p-2">start*</td>
                        <td className="p-2">2024-03-20T14:30</td>
                      </tr>
                      <tr className="border-t">
                        <td className="p-2">end*</td>
                        <td className="p-2">2024-03-20T15:30</td>
                      </tr>
                      <tr className="border-t">
                        <td className="p-2">description</td>
                        <td className="p-2">Haftalık değerlendirme</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-500 mt-2">* Zorunlu alanlar</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
