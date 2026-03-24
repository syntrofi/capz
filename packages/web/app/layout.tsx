import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Capz — Honor Your Values",
  description:
    "Set a limit on what you keep. Automatically share everything above it — with your customers, contributors, and the projects that support your work.",
  keywords: ["capz", "redistribution", "web3", "open source", "ethereum", "base"],
  openGraph: {
    title: "Capz — Honor Your Values",
    description:
      "Cap your profits. Share the rest. Built on Base, open source, non-custodial.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} dark`} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
