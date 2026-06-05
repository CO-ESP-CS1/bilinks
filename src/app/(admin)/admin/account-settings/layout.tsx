import { adminPageMetadata } from "@/config/metadata";

export const metadata = adminPageMetadata("Paramètres du compte");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
