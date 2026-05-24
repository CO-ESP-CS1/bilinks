import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profil — BiblioTech Admin",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
