import React from "react";
import AdminCategoryListPage from "@/components/admin/categories/CategoryList";
import Link from "next/link";

export default function CategoryPage() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          <a href="/admin" className="hover:text-foreground transition-colors">
            Admin
          </a>
          <span>/</span>
          <Link
            href="/admin/services"
            className="hover:text-foreground transition-colors"
          >
            Services
          </Link>
          <span>/</span>
          <span className="hover:text-foreground transition-colors cursor-alias">
            Category List
          </span>
        </nav>
      </div>
      <main className="min-h-screen w-full">
        <AdminCategoryListPage />
      </main>
    </div>
  );
}
