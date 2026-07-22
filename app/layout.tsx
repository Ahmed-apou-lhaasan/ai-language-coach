import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Language Coach",
  description: "Practice languages with an AI tutor",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
