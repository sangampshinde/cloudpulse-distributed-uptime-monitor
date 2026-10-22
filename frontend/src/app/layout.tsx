import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CloudPulse | Real-time Uptime & DevOps Health Monitor",
  description:
    "Production-grade distributed uptime and service health monitoring platform built with Next.js, NestJS, PostgreSQL, and Docker.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#07090e" />
      </head>
      <body>{children}</body>
    </html>
  );
}
