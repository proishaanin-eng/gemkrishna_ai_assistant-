import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GemKrishna India Product Automation",
  description: "Secure AI-powered Shopify draft product dashboard for GemKrishna India."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
