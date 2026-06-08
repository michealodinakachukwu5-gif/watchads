import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "WatchAds — Get paid to watch video ads",
  description:
    "Watch full-length video ads from real brands and earn real cash. MP4, YouTube & ad-network ads. Withdraw to PayPal, crypto, bank or gift card. Available in 190+ countries.",
  keywords: "watch ads earn money, get paid to watch videos, earn online, rewarded ads",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
