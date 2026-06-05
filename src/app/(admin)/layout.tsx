import { adminPageMetadata } from "@/config/metadata";
import AdminLayoutClient from "./AdminLayoutClient";

export const metadata = adminPageMetadata("Tableau de bord");

export default function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
