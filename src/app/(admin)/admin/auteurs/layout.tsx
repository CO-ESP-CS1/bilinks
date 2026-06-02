import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Auteurs — B LINKS Admin",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
