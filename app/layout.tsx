import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "Spotify Ratings",
  description: "Rate songs in je gedeelde Spotify playlist",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body className="min-h-screen bg-[#121212] text-white">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
