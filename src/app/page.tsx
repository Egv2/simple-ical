"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { FileUpload } from "@/components/FileUpload";
import { ConversionOptions } from "@/components/ConversionOptions";
import { ConversionSettings } from "@/components/ConversionSettings";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { TypingAnimation } from "@/components/ui/typing-animation";
import type {
  SupportedFormat,
  ConversionOptions as ConversionOpts,
} from "@/lib/converters/types";
import { convertFile } from "@/lib/converters/convert";
import { getDefaultTarget } from "@/lib/converters/registry";

export default function Home() {
  const [sourceFormat, setSourceFormat] = useState<SupportedFormat>("csv");
  const [targetFormat, setTargetFormat] = useState<SupportedFormat>("ics");
  const [file, setFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionOptions, setConversionOptions] = useState<ConversionOpts>(
    {},
  );

  const handleSourceChange = useCallback((format: SupportedFormat) => {
    setSourceFormat(format);
    setFile(null);
  }, []);

  const handleTargetChange = useCallback((format: SupportedFormat) => {
    setTargetFormat(format);
  }, []);

  const handleFileSelect = useCallback((selectedFile: File | null) => {
    if (!selectedFile) {
      toast.error("File exceeds 5MB limit.");
      return;
    }
    setFile(selectedFile);
  }, []);

  const handleConvert = async () => {
    if (!file) return;

    try {
      setIsConverting(true);

      const result = await convertFile(
        file,
        sourceFormat,
        targetFormat,
        conversionOptions,
      );

      const url = window.URL.createObjectURL(result.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success("File converted successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "An error occurred during conversion!",
      );
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <main className="page-wrapper">
      {/* Left: Conversion Panel */}
      <section className="conversion-panel">
        {/* Neo-brutalist header */}
        <div className="w-full max-w-xl mb-8 md:mb-12 text-left px-2 sm:px-0">
          <h1 className="text-6xl font-black mb-4 tracking-tight neo-brutal-text">
            <TypingAnimation
              text="...just convert"
              className="font-mono text-6xl font-black tracking-tight"
              speed={100}
            />
          </h1>
          <p className="text-lg text-muted-foreground border-2 border-black dark:border-white inline-block px-4 py-1 neo-brutal-box font-mono">
            file format converter
          </p>
        </div>

        {/* Conversion interface */}
        <div className="w-full max-w-xl space-y-6 md:space-y-8 px-2 sm:px-0">
          <div className="flex items-center gap-3 bg-white dark:bg-black p-4 sm:p-6 neo-brutal-box">
            <div className="flex-1">
              <ConversionOptions
                sourceFormat={sourceFormat}
                targetFormat={targetFormat}
                onSourceChange={handleSourceChange}
                onTargetChange={handleTargetChange}
              />
            </div>
            <ConversionSettings
              sourceFormat={sourceFormat}
              targetFormat={targetFormat}
              options={conversionOptions}
              onOptionsChange={setConversionOptions}
            />
          </div>

          <div className="bg-white dark:bg-black p-4 sm:p-6 neo-brutal-box">
            <FileUpload
              onFileSelect={handleFileSelect}
              sourceFormat={sourceFormat}
              file={file}
            />
          </div>

          <Button
            onClick={handleConvert}
            disabled={!file || isConverting}
            className="w-full h-14 text-lg neo-brutal-button"
          >
            {isConverting ? (
              "Converting..."
            ) : (
              <>
                Convert <ArrowRight className="ml-2" />
              </>
            )}
          </Button>
        </div>
      </section>

      {/* Right: Mascot Panel */}
      <section className="mascot-panel">
        <div className="mascot-container">
          <div className="mascot-glow" />
          <Image
            src="/con-bunny.png"
            alt="Conversion Bunny — cute mascot"
            width={420}
            height={420}
            priority
            className="mascot-image"
          />
          <p className="mascot-caption">drop your file & let&apos;s go! ✦</p>
        </div>
      </section>
    </main>
  );
}
