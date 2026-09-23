import type { Metadata } from "next";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/manrope";
import "./globals.css";
import "./site-design.css";
import "./editor-design.css";
import "./brand-design.css";
import "./store-design.css";
export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
  title: {
    default: "Omnyvox — Business websites. Fully managed.",
    template: "%s | Omnyvox",
  },
  description:
    "Create and manage your business website or online store. Your brand, your content, one managed platform by Nexoris Technologies.",
  icons: { icon: "/favicon.webp", apple: "/brand-icon.webp" },
  openGraph: {
    type: "website",
    siteName: "Omnyvox",
    title: "Business websites. Fully managed.",
    description: "Your business deserves a home online.",
    images: ["/social.webp"],
  },
  twitter: { card: "summary_large_image", images: ["/social.webp"] },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
