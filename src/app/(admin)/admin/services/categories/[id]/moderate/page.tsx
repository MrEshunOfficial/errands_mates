"use client";

import { CategoryModerationDetail } from "@/components/admin/categories/category-moderation";
import { ErrorState } from "@/components/ui/ErrorState";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { useAdminCategoryManager } from "@/hooks/admin/admin.category.hook";
import Link from "next/link";
import { use } from "react";

// File: /app/admin/categories/moderate/[id]/page.tsx

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CategoryModerationDetailPage({ params }: PageProps) {
  // Unwrap the params Promise using React.use()
  const { id } = use(params);

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
          <Link
            href={`/admin/services/categories/${id}`}
            className="hover:text-foreground transition-colors"
          >
            {id}
          </Link>
          <span>/</span>
          <span className="text-foreground">moderate</span>
        </nav>
      </div>
      <CategoryModerationDetail categoryId={id} />
    </div>
  );
}
