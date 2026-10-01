import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kurukh Unicode Explorer · Tolong Siki",
  description: "A private Tolong Siki character explorer and Unicode text playground, using the official Unicode 17.0.0 character database.",
  robots: { index: false, follow: false },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
