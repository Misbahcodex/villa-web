import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/data/site";
import { DemoRibbon } from "@/components/layout/DemoRibbon";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FloatingWhatsApp } from "@/components/layout/FloatingWhatsApp";
import { MobileBookingBar } from "@/components/layout/MobileBookingBar";
import { generateLodgingBusinessJsonLd } from "@/lib/jsonLd";
import { getImage } from "@/data/images";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const ogImage = getImage("og-share");

export const viewport = {
  themeColor: "#F6F4F5",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Rizq Luxurious Villa | Luxury Villa-Hostel & Coworking in Dubai",
    template: "%s | Rizq Luxurious Villa Dubai",
  },
  description:
    "Luxury villa-hostel on the Al Quoz / Business Bay border near Downtown Dubai and Burj Khalifa. Capsule pods, private suites, 500 Mbps Wi-Fi coworking space, outdoor pool, and social lounge.",
  keywords: [
    "Rizq Luxurious Villa",
    "Dubai villa hostel",
    "Dubai capsule hotel",
    "coworking villa Dubai",
    "digital nomad Dubai",
    "developer accommodation Dubai",
    "Business Bay luxury villa",
  ],
  authors: [{ name: siteConfig.name }],
  robots: isDemo
    ? {
        index: false,
        follow: false,
      }
    : {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      },
  openGraph: {
    type: "website",
    locale: "en_AE",
    url: siteUrl,
    title: "Rizq Luxurious Villa | Luxury Villa-Hostel & Coworking in Dubai",
    description:
      "A sanctuary for digital nomads and travelers in Dubai. Capsule pods, private suites, 500 Mbps Wi-Fi coworking space, and outdoor pool.",
    siteName: siteConfig.name,
    images: [
      {
        url: ogImage.src,
        width: ogImage.width,
        height: ogImage.height,
        alt: ogImage.alt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rizq Luxurious Villa Dubai",
    description: "Capsule pods, private suites, 500 Mbps Wi-Fi coworking space, and outdoor pool in Dubai.",
    images: [ogImage.src],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = generateLodgingBusinessJsonLd();

  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable} scroll-smooth`}>
      <head>
        {isDemo && <meta name="robots" content="noindex,nofollow" />}
        {jsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        )}
      </head>
      <body className="bg-base text-on-dark min-h-screen flex flex-col font-sans antialiased selection:bg-accent selection:text-umber-950">
        <DemoRibbon />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
