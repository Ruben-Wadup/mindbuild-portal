import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MindBuild Portal",
  description: "MindBuild dashboard — leads en analytics",
  robots: "noindex, nofollow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl" className={`${geist.variable} h-full`}>
      <body className="min-h-full bg-[#0f2027] antialiased">{children}</body>
    </html>
  );
}
