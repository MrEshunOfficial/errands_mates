import React from "react";
import Link from "next/link";
import AdminServiceTable from "@/components/services/admin.service.list";

export default function ServiceListPage() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link
            href="/admin"
            className="hover:text-foreground transition-colors">
            Admin
          </Link>
          <span>/</span>
          <span className="hover:text-foreground transition-colors">
            Services
          </span>
        </nav>
      </div>
      <main className="min-h-[90vh] w-full">
        <AdminServiceTable
          limit={50}
          searchPlaceholder="Find services..."
          autoFetch={true}
        />
      </main>
    </div>
  );
}
