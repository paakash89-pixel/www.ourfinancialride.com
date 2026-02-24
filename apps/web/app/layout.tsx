import type { Metadata } from "next";
import "./globals.css";
import { RegionProvider } from "../components/region-provider";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.ourfinancialride.com";
const ogImage = `${siteUrl}/og-default.svg`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "OFR — Our Financial Ride",
    template: "%s | OFR"
  },
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    shortcut: ["/icon.png"],
    apple: [{ url: "/icon.png" }]
  },
  description:
    "Financial Independence. Work Optional. Live Intentional. OFR helps high-earning families build time freedom with calm, disciplined investing systems.",
  openGraph: {
    title: "OFR — Our Financial Ride",
    description:
      "Build time freedom without noise through disciplined, index-based systems for high-earning families.",
    type: "website",
    images: [{ url: ogImage, width: 1200, height: 630, alt: "OFR" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "OFR — Our Financial Ride",
    description:
      "Financial Independence. Work Optional. Live Intentional.",
    images: [ogImage]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <RegionProvider>
          <SiteHeader />
          <div className="min-h-[calc(100vh-160px)]">{children}</div>
          <SiteFooter />
        </RegionProvider>
      </body>
    </html>
  );
}
