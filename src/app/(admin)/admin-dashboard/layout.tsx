// app/(admin-dashboard)/layout.tsx
import AdminNavigation from "@/components/layout/admin-layout";
import type { ReactNode } from "react";

export default function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-full flex">
      {/* Sidebar */}
      <AdminNavigation />
      {/* Main Content */}
      <main className="flex-1 p-2">{children}</main>
    </div>
  );
}
