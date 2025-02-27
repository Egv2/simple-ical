import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

const geistMono = Geist_Mono({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CSV to ICS Converter",
  description: "Convert your CSV files to ICS calendar format easily",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistMono.className} min-h-screen bg-background font-mono antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <main className="dark:bg-gray-950 dark:text-white min-h-screen">
            {children}
          </main>
          <Toaster theme="system" />
        </ThemeProvider>
      </body>
    </html>
  );
}
