// ===== Main Category Form Page Component =====
// @/components/admin/categories/CategoryFormPage.tsx
"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CategoryForm from "@/components/categories/category-form";
import { Category } from "@/types";

interface CategoryFormPageProps {
  selectedCategory?: Category;
  parentCategoryId?: string;
  mode?: "create" | "edit";
  onSuccess?: (category: Category) => void;
  onCancel?: () => void;
  className?: string;
}

export default function CategoryFormPage({
  selectedCategory,
  parentCategoryId,
  mode,
  onSuccess,
  onCancel,
  className,
}: CategoryFormPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Auto-determine mode and parent from URL params if not provided
  const effectiveMode = mode || (selectedCategory ? "edit" : "create");
  const effectiveParentId =
    parentCategoryId || searchParams?.get("parent") || undefined;

  const handleSuccess = (category: Category) => {
    if (onSuccess) {
      onSuccess(category);
    } else {
      // Navigate to category detail or categories list
      router.push(`/admin/services/categories/${category._id}`);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      // Navigate back to appropriate page
      if (effectiveParentId) {
        router.push(`/admin/services/categories/${effectiveParentId}`);
      } else {
        router.push("/admin/services/categories");
      }
    }
  };

  return (
    <CategoryForm
      mode={effectiveMode}
      initialCategory={selectedCategory}
      parentCategoryId={effectiveParentId}
      onSuccess={handleSuccess}
      onCancel={handleCancel}
      className={className}
    />
  );
}
