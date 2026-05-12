import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BiblioTech Admin",
  description: "BiblioTech — Bibliothèque Numérique Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full scroll-smooth bg-secondary text-dark">
      <body className="min-h-full bg-secondary">{children}</body>
    </html>
  );
}
