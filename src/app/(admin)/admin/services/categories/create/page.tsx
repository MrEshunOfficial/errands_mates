// ===== Create Category Page =====
// @/app/admin/services/categories/create/page.tsx
import CategoryFormPage from "@/components/admin/categories/parent-form";
import Link from "next/link";
import React from "react";

export default function CreateCategoryPage() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link
            href="/admin"
            className="hover:text-foreground transition-colors"
          >
            Admin
          </Link>
          <span>/</span>
          <Link
            href="/admin/services"
            className="hover:text-foreground transition-colors"
          >
            Services
          </Link>
          <span>/</span>
          <Link
            href="/admin/services/categories"
            className="hover:text-foreground transition-colors"
          >
            Categories
          </Link>
          <span>/</span>
          <span className="text-foreground">create</span>
        </nav>
      </div>
      <CategoryFormPage mode="create" />;
    </div>
  );
}
