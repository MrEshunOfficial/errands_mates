"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import CategoryForm from "@/components/admin/categories/category-form";
import { useAdminCategory } from "@/hooks/admin/admin.category.hook";
import { Category } from "@/types";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { ErrorState } from "@/components/ui/ErrorState";
import Link from "next/link";

const EditCategoryPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const categoryId = params?.id as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    category: hookCategory,
    error: hookError,
    fetchCategoryWithFullDetails,
    clearError,
  } = useAdminCategory(categoryId, { autoFetch: false });

  // Fetch category data
  const fetchCategory = useCallback(async () => {
    if (!categoryId) {
      setError("Invalid category ID");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    clearError();

    try {
      await fetchCategoryWithFullDetails(categoryId);
      // The category will be set via the hook's state management
    } catch (err) {
      setError("Failed to load category");
      console.error("Error fetching category:", err);
    } finally {
      setIsLoading(false);
    }
  }, [categoryId, fetchCategoryWithFullDetails, clearError]);

  // Update local category state when hook category changes
  useEffect(() => {
    if (hookCategory) {
      setCategory(hookCategory);
      setIsLoading(false);
    } else if (hookError) {
      setError(hookError);
      setIsLoading(false);
    }
  }, [hookCategory, hookError]);

  useEffect(() => {
    fetchCategory();
  }, [categoryId, fetchCategory]);

  // Handle successful update
  const handleUpdateSuccess = (updatedCategory: Category) => {
    setCategory(updatedCategory);
    toast.success("Category updated successfully!");

    // Optional: Navigate back to categories list after a short delay
    setTimeout(() => {
      router.push(`/admin/services/categories/${categoryId}`);
    }, 1000);
  };

  // Handle cancel - go back to categories list
  const handleCancel = () => {
    router.push(`/admin/services/categories/${categoryId}`);
  };

  // Handle retry on error
  const handleRetry = () => {
    fetchCategory();
  };

  // Loading state
  if (isLoading) {
    return <LoadingOverlay message="wait a sec..." />;
  }

  // Error state
  if (error) {
    return (
      <ErrorState
        title="Failed to load category, please try again!"
        message={error}
        onRetry={handleRetry}
      />
    );
  }

  // Main content with CategoryForm
  return (
    <div className="w-full p-2 min-h-screen">
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
            href={`/admin/services/categories/${categoryId}`}
            className="hover:text-foreground transition-colors"
          >
            {categoryId}
          </Link>
          <span>/</span>
          <span className="text-foreground">edit</span>
        </nav>
      </div>

      <div className="w-full p-2">
        {/* Header with back button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Button
            onClick={() => router.back()}
            className="bg-white/80 dark:bg-gray-700/80 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 shadow-sm transition-all duration-300 hover:shadow-md"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Edit Category
            </h1>
            {category && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Editing: {category.name}
              </p>
            )}
          </div>
        </motion.div>

        {/* Category Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {category && (
            <CategoryForm
              mode="edit"
              initialCategory={category}
              onSuccess={handleUpdateSuccess}
              onCancel={handleCancel}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
            />
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default EditCategoryPage;
