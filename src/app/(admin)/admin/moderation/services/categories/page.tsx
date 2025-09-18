"use client";

import { ErrorState } from "@/components/ui/ErrorState";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { useAdminCategoryManager } from "@/hooks/admin/admin.category.hook";
import Link from "next/link";
import { CategoryModerationBulk } from "@/components/admin/categories/bulk-moderation";

export default function CategoryModerationPage() {
  const { isLoading, error } = useAdminCategoryManager({
    includeInactive: true,
  });

  // Loading state
  if (isLoading) {
    return <LoadingOverlay message="wait a sec..." />;
  }

  if (error)
    return <ErrorState title="Failed to load categories" message={error} />;

  // Main content with CategoryForm
  return (
    <div className="h-screen container mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link
            href="/admin"
            className="hover:text-foreground transition-colors">
            Admin
          </Link>
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
          <span className="text-foreground">moderate</span>
        </nav>
      </div>
      <CategoryModerationBulk />
    </div>
  );
}
