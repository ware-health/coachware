import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const marklMono = localFont({
  src: [
    { path: "../public/fonts/MarklMono-Light.woff2", weight: "300", style: "normal" },
    { path: "../public/fonts/MarklMono-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/MarklMono-Medium.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/MarklMono-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/MarklMono-Bold.woff2", weight: "700", style: "normal" },
    { path: "../public/fonts/MarklMono-ExtraBold.woff2", weight: "800", style: "normal" },
    { path: "../public/fonts/MarklMono-Heavy.woff2", weight: "900", style: "normal" }
  ],
  variable: "--font-sans",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Coachware Admin",
  description: "Minimal fitness admin MVP"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={marklMono.variable}>{children}</body>
    </html>
  );
}


