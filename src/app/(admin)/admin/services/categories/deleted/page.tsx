import DeletedCategoriesPage from "@/components/admin/categories/DeletedCategory";
import Link from "next/link";
import React from "react";

export default function page() {
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
            className="hover:text-foreground transition-colors">
            Services
          </Link>
          <span>/</span>
          <Link
            href="/admin/services/categories"
            className="hover:text-foreground transition-colors">
            Categories
          </Link>
          <span>/</span>
          <span className="hover:text-foreground transition-colors cursor-alias">
            deleted
          </span>
        </nav>
      </div>
      <main className="min-h-screen w-full">
        <DeletedCategoriesPage />
      </main>
    </div>
  );
}
