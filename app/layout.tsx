import type { Metadata } from "next";
import { Italianno, Open_Sans } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  display: "swap",
});

const italianno = Italianno({
  variable: "--font-italianno",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const title = "Mindlix.ai — Research, decisions, and growth";
const description =
  "Mindlix.ai connects business R&D, lead generation, decision intelligence, analytics, and growth around the questions that matter.";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "mindlix.ai";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.includes("localhost") ? "http" : "https");
  const baseUrl = new URL(`${protocol}://${host}`);
  const shareImage = new URL("/og.png", baseUrl);

  return {
    metadataBase: baseUrl,
    title,
    description,
    openGraph: {
      title,
      description,
      url: baseUrl,
      siteName: "Mindlix.ai",
      type: "website",
      images: [
        {
          url: shareImage,
          width: 1731,
          height: 909,
          alt: "Mindlix.ai — Understand what matters. Decide what moves.",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [shareImage],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${openSans.variable} ${italianno.variable}`}>{children}</body>
    </html>
  );
}
