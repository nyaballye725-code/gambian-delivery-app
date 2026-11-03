import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { site } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Jotna — The Gambia, delivered",
    template: "%s · Jotna",
  },
  description: site.description,
  applicationName: "Jotna",
  category: "delivery",
  keywords: [
    "Jotna",
    "delivery Gambia",
    "food delivery Banjul",
    "grocery delivery Serekunda",
    "parcel delivery Gambia",
    "Banjul delivery service",
    "QMoney",
    "Wave delivery",
  ],
  authors: [{ name: site.legalName, url: site.url }],
  creator: site.legalName,
  publisher: site.legalName,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Jotna",
    locale: "en_GM",
    url: site.url,
    title: "Jotna — The Gambia, delivered",
    description: site.description,
    images: [
      {
        url: "/photos/hero-rider.jpg",
        width: 1408,
        height: 768,
        alt: "A Jotna delivery rider in the Greater Banjul Area",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jotna — The Gambia, delivered",
    description: site.description,
    images: ["/photos/hero-rider.jpg"],
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg" }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  formatDetection: { telephone: true, address: true, email: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f2d1e",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-GM">
      <body>{children}</body>
    </html>
  );
}
