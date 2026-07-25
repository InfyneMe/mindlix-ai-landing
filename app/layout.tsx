import type { Metadata } from "next";
import { Cormorant_Garamond, Open_Sans } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  display: "swap",
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-italianno",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const title = "mindlix.in — Research, decisions, and growth";
const description =
  "mindlix.in connects business R&D, lead generation, decision intelligence, analytics, and growth around the questions that matter.";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "mindlix.in";
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
      siteName: "mindlix.in",
      type: "website",
      images: [
        {
          url: shareImage,
          width: 1731,
          height: 909,
          alt: "mindlix.in — Understand what matters. Decide what moves.",
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
      <body className={`${openSans.variable} ${cormorantGaramond.variable}`}>{children}</body>
    </html>
  );
}
