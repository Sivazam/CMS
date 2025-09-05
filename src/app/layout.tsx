import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "@/components/providers/session-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SCM System - Smart Cremation Management",
  description: "Comprehensive ash pot management system for Rotary Charitable Trust with automated renewals, real-time monitoring, and secure delivery processes.",
  keywords: ["SCM", "Cremation Management", "Ash Pot", "Rotary Charitable Trust", "Next.js", "TypeScript", "Tailwind CSS"],
  authors: [{ name: "SCM System Team" }],
  openGraph: {
    title: "SCM System - Smart Cremation Management",
    description: "Comprehensive ash pot management system for Rotary Charitable Trust",
    url: "https://scmsystem.com",
    siteName: "SCM System",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SCM System - Smart Cremation Management",
    description: "Comprehensive ash pot management system for Rotary Charitable Trust",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <SessionProvider>
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
