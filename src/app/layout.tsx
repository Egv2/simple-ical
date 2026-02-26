import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";

const geistMono = Geist_Mono({
  subsets: ["latin"],
});

// TODO: Replace with your production URL
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://justconvert.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: "...just convert — Free File Format Converter",
    template: "%s | ...just convert",
  },

  description:
    "Convert CSV to iCalendar (ICS), JSON, Excel, and more — instantly in your browser. No uploads, no accounts. Fast, private, and open-source.",

  keywords: [
    "file converter",
    "CSV to ICS",
    "CSV to iCalendar",
    "icalendar converter",
    "calendar import",
    "ICS generator",
    "iCal converter",
    "CSV converter",
    "free file converter",
    "online file converter",
    "convert CSV to calendar",
    "Google Calendar import",
    "Outlook calendar import",
    "spreadsheet to calendar",
    "just convert",
  ],

  authors: [{ name: "Egv2", url: "https://github.com/egv2" }],
  creator: "Egv2",
  publisher: "...just convert",

  category: "technology",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [{ rel: "mask-icon", url: "/icon-192-maskable.png" }],
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "...just convert",
    title: "...just convert — Free File Format Converter",
    description:
      "Convert CSV to ICS (iCalendar), JSON, Excel and more — instantly in your browser. No uploads, no accounts. Free & open-source.",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "...just convert logo",
      },
    ],
  },

  twitter: {
    card: "summary",
    title: "...just convert — Free File Format Converter",
    description:
      "Convert CSV to ICS, JSON, Excel and more — instantly in your browser.",
    images: ["/icon-512.png"],
  },

  alternates: {
    canonical: BASE_URL,
  },
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
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
