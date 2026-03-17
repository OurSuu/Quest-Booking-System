import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quest Calendar — Guild Booking",
  description: "Register your quests with the guild. A D&D-themed booking calendar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
