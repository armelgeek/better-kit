import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Better Query Demo - Drizzle & Prisma Relationships",
  description: "Demonstration of Better Query with Drizzle and Prisma showing various relationship types",
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
