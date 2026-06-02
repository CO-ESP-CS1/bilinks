import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bibliothèques — B LINKS Admin",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
