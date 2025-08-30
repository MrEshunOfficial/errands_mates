// app/(admin-dashboard)/layout.tsx
import AdminNavigation from "@/components/layout/admin-layout";
import type { ReactNode } from "react";

export default function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex gap-2">
      {/* Sidebar */}
      <AdminNavigation />
      {/* Main Content */}
      <main className="flex-1 p-2 min-h-screen border rounded-md flex items-center justify-center">
        {children}
      </main>
    </div>
  );
}
