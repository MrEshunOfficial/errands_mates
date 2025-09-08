"use client";

import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import CategoryForm from "@/components/admin/categories/category-form";
import Link from "next/link";

const CreateCategoryPage: React.FC = () => {
  const router = useRouter();

  // Handle successful creation
  const handleCreateSuccess = useCallback(() => {
    toast.success("Category created successfully!");
    // Navigate back to categories list after a short delay
    setTimeout(() => {
      router.push("/admin/services/categories");
    }, 1000);
  }, [router]);

  // Handle cancel - go back to categories list
  const handleCancel = useCallback(() => {
    router.push("/admin/services/categories");
  }, [router]);

  return (
    <div className="w-full p-2 min-h-screen">
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
          <span className="text-foreground">create</span>
        </nav>
      </div>

      <div className="w-full p-2">
        {/* Header with back button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8">
          <Button
            onClick={() => router.back()}
            className="bg-white/80 dark:bg-gray-700/80 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 shadow-sm transition-all duration-300 hover:shadow-md">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Create Category
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Create a new category
            </p>
          </div>
        </motion.div>

        {/* Category Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}>
          <CategoryForm
            mode="create"
            onSuccess={handleCreateSuccess}
            onCancel={handleCancel}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
          />
        </motion.div>
      </div>
    </div>
  );
};

export default CreateCategoryPage;
