import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Giftly — Send a little love",
  description: "Order gifts from local stores and send them with love. Demo application - no real payments or deliveries.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      style={{
        ["--font-dm-sans" as string]: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
        ["--font-fraunces" as string]: "'Fraunces', ui-serif, Georgia, serif",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-page-custom-font -- App Router layout.tsx is the
          correct place for a global font link; this rule targets the legacy Pages Router _document.js. */}
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
