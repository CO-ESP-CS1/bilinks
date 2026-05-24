import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Défis et badges — BiblioTech Admin",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
