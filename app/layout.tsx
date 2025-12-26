import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const grift = localFont({
  src: [
    { path: "../public/fonts/Grift-Light.woff2", weight: "300", style: "normal" },
    { path: "../public/fonts/Grift-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/Grift-Medium.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/Grift-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/Grift-Bold.woff2", weight: "700", style: "normal" },
    { path: "../public/fonts/Grift-ExtraBold.woff2", weight: "800", style: "normal" },
    { path: "../public/fonts/Grift-Black.woff2", weight: "900", style: "normal" }
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
      <body className={grift.variable}>{children}</body>
    </html>
  );
}


