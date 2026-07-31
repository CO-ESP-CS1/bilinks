import { adminPageMetadata } from "@/config/metadata";

export const metadata = adminPageMetadata("Performance");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
