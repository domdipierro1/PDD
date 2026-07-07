import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PDD Operator Portal",
  description: "Private operator app for PDD Cleaning Services",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
