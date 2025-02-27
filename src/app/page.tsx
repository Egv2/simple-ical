"use client";

import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { ConversionOptions } from "@/components/ConversionOptions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { TypingAnimation } from "@/components/ui/typing-animation";

type SupportedFormats = "csv" | "json" | "xlsx" | "ics" | "pdf" | "md";

export default function Home() {
  const [sourceFormat, setSourceFormat] = useState<SupportedFormats>("csv");
  const [targetFormat, setTargetFormat] = useState<SupportedFormats>("ics");
  const [file, setFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  console.log("Render: Home component");

  const handleConvert = async () => {
    if (!file) return;

    try {
      console.log("Starting conversion:", {
        sourceFormat,
        targetFormat,
        fileName: file.name,
      });
      setIsConverting(true);

      // API call will be implemented here
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Temporary simulation

      toast.success("Dosya başarıyla dönüştürüldü!");
    } catch (error) {
      console.error("Conversion error:", error);
      toast.error("Dönüştürme sırasında bir hata oluştu!");
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#FCFCFC] dark:bg-[#0A0A0A]">
      {/* Neo-brutalist header */}
      <div className="w-full max-w-xl mb-12 text-center">
        <h1 className="text-6xl font-black mb-4 tracking-tight neo-brutal-text">
          <TypingAnimation
            text="...just convert"
            className="font-mono text-6xl font-black tracking-tight"
            speed={100}
          />
        </h1>
        <p className="text-lg text-muted-foreground border-2 border-black dark:border-white inline-block px-4 py-1 neo-brutal-box font-mono">
          dosya formatı dönüştürücü
        </p>
      </div>

      {/* Conversion interface */}
      <div className="w-full max-w-xl space-y-8">
        <div className="flex items-center gap-4 justify-between bg-white dark:bg-black p-6 neo-brutal-box">
          <ConversionOptions
            sourceFormat={sourceFormat}
            targetFormat={targetFormat}
            onSourceChange={setSourceFormat}
            onTargetChange={setTargetFormat}
          />
        </div>

        <div className="bg-white dark:bg-black p-6 neo-brutal-box">
          <FileUpload
            onFileSelect={setFile}
            acceptedFormats={[sourceFormat]}
            file={file}
          />
        </div>

        <Button
          onClick={handleConvert}
          disabled={!file || isConverting}
          className="w-full h-14 text-lg neo-brutal-button"
        >
          {isConverting ? (
            "Dönüştürülüyor..."
          ) : (
            <>
              Dönüştür <ArrowRight className="ml-2" />
            </>
          )}
        </Button>
      </div>
    </main>
  );
}
