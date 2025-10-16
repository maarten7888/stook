import { getSession } from "@/lib/supabase/server";
import AppLayout from "./app-layout";
import PublicLayout from "./public-layout";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stook — elke sessie beter",
  description: "Je ultieme BBQ companion. Deel recepten, track je kooksessies en word een betere pitmaster.",
  keywords: ["BBQ", "kamado", "recepten", "kooksessies", "temperatuur", "grill"],
  authors: [{ name: "Stook" }],
  creator: "Stook",
  publisher: "Stook",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Stook — elke sessie beter",
    description: "Je ultieme BBQ companion. Deel recepten, track je kooksessies en word een betere pitmaster.",
    url: "/",
    siteName: "Stook",
    locale: "nl_NL",
    type: "website",
    images: [
      {
        url: "/images/logo.png",
        width: 1200,
        height: 630,
        alt: "Stook - BBQ App Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Stook — elke sessie beter",
    description: "Je ultieme BBQ companion. Deel recepten, track je kooksessies en word een betere pitmaster.",
    images: ["/images/logo.png"],
  },
  robots: {
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
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
        color: "#FF6A2A",
      },
    ],
  },
  manifest: "/site.webmanifest",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <html lang="nl">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/png" />
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#FF6A2A" />
        <meta name="theme-color" content="#111315" />
        <meta name="msapplication-TileColor" content="#111315" />
      </head>
      <body className="font-sans antialiased">
        {session ? (
          <AppLayout session={session}>{children}</AppLayout>
        ) : (
          <PublicLayout>{children}</PublicLayout>
        )}
        <Toaster />
      </body>
    </html>
  );
}
