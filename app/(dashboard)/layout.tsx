import Sidebar from "../../components/layout/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-secondary text-dark">
      <div className="grid min-h-screen grid-cols-[auto_1fr]">
        <Sidebar />
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
