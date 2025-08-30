"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Tag, Loader2, Check, AlertCircle } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import useCategories, {
  useCategoryMutations,
} from "@/hooks/categories/use-categories";
import { FileReference } from "@/types";
import { createCategorySchema } from "@/lib/utils/schemas/service.category.schema";

type CreateCategoryFormData = z.infer<typeof createCategorySchema>;

// Additional interface for API submission data
interface CreateCategoryAPIData {
  name: string;
  description?: string;
  image?: FileReference;
  tags: string[];
  isActive: boolean;
  parentCategoryId?: string;
  createdBy?: string;
}

const CategoryForm = () => {
  const [formData, setFormData] = useState<CreateCategoryFormData>({
    name: "",
    description: "",
    tags: [],
    isActive: true,
  });

  const [currentTag, setCurrentTag] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const { createCategory, createLoading, createError, clearCreateState } =
    useCategoryMutations();

  const { categories: parentCategories, fetchParentCategories } =
    useCategories();

  React.useEffect(() => {
    fetchParentCategories(false, false);
  }, [fetchParentCategories]); // Empty dependency array - only run once on mount

  // Handle form field changes
  const handleInputChange = useCallback(
    (field: keyof CreateCategoryFormData, value: unknown) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      // Clear field error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    },
    [errors]
  );

  // Handle tag addition
  const handleAddTag = useCallback(() => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      if (formData.tags.length >= 20) {
        setErrors((prev) => ({ ...prev, tags: "Maximum 20 tags allowed" }));
        return;
      }
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()],
      }));
      setCurrentTag("");
      setErrors((prev) => ({ ...prev, tags: "" }));
    }
  }, [currentTag, formData.tags]);

  // Handle tag removal
  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  }, []);

  // Handle image upload simulation
  const handleImageUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        // Simulate uploaded image data
        const imageData = {
          url: URL.createObjectURL(file),
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          uploadedAt: new Date(),
        };

        setFormData((prev) => ({ ...prev, image: imageData }));
      }
    },
    []
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      try {
        // Validate form data
        const validatedData = createCategorySchema.parse(formData);

        // Convert to API format
        const apiData: CreateCategoryAPIData = {
          ...validatedData,
          parentCategoryId: validatedData.parentCategoryId || undefined,
          createdBy: validatedData.createdBy?.toString(),
        };

        // Submit form
        const result = await createCategory(apiData);

        if (result) {
          setShowSuccess(true);
          // Reset form after successful submission
          setTimeout(() => {
            setFormData({
              name: "",
              description: "",
              tags: [],
              isActive: true,
            });
            setImagePreview(null);
            setShowSuccess(false);
            clearCreateState();
          }, 2000);
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldErrors: Record<string, string> = {};
          error.issues.forEach((issue) => {
            if (issue.path[0]) {
              fieldErrors[issue.path[0] as string] = issue.message;
            }
          });
          setErrors(fieldErrors);
        }
      }
    },
    [formData, createCategory, clearCreateState]
  );

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible">
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Create New Category
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Add a new category to organize your services
          </p>
        </motion.div>

        {/* Success Message */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg flex items-center gap-3">
              <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-green-800 dark:text-green-200 font-medium">
                Category created successfully!
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        {createError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-red-800 dark:text-red-200">
              {createError}
            </span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Name */}
          <motion.div variants={itemVariants}>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Category Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter category name"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.name
                  ? "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/30"
                  : "border-gray-300 dark:border-gray-600 dark:bg-gray-700"
              } text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500`}
              maxLength={100}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.name}
              </p>
            )}
          </motion.div>

          {/* Description */}
          <motion.div variants={itemVariants}>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Description
            </label>
            <textarea
              value={formData.description || ""}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Brief description of the category (optional)"
              rows={3}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none ${
                errors.description
                  ? "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/30"
                  : "border-gray-300 dark:border-gray-600 dark:bg-gray-700"
              } text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500`}
              maxLength={500}
            />
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {(formData.description || "").length}/500 characters
            </div>
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.description}
              </p>
            )}
          </motion.div>

          {/* Parent Category */}
          <motion.div variants={itemVariants}>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Parent Category
            </label>
            <select
              value={formData.parentCategoryId || ""}
              onChange={(e) =>
                handleInputChange(
                  "parentCategoryId",
                  e.target.value || undefined
                )
              }
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 dark:text-gray-100">
              <option value="">Select parent category (optional)</option>
              {parentCategories.map((category) => (
                <option
                  key={category._id.toString()}
                  value={category._id.toString()}>
                  {category.name}
                </option>
              ))}
            </select>
          </motion.div>

          {/* Image Upload */}
          <motion.div variants={itemVariants}>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Category Image
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:border-blue-400 dark:hover:border-blue-600 transition-colors">
              {imagePreview ? (
                <div className="relative h-32">
                  <Image
                    src={imagePreview}
                    alt="Category preview"
                    className="w-full h-full object-cover rounded-lg"
                    fill
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setFormData((prev) => ({ ...prev, image: undefined }));
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-500 dark:bg-red-600 text-white rounded-full hover:bg-red-600 dark:hover:bg-red-700">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="relative w-12 h-12 mx-auto mb-4">
                    <Image
                      src="/icons/service.svg"
                      alt=""
                      className="text-gray-400 dark:text-gray-500"
                      fill
                    />
                  </div>
                  <div className="flex text-sm text-gray-600 dark:text-gray-300">
                    <label className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 focus-within:outline-none">
                      <span>Upload an image</span>
                      <input
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Tags */}
          <motion.div variants={itemVariants}>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), handleAddTag())
                }
                placeholder="Add a tag"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Add
              </button>
            </div>

            {/* Tag List */}
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag) => (
                  <motion.span
                    key={tag}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                    {tag}
                    <Button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5">
                      <X className="w-3 h-3" />
                    </Button>
                  </motion.span>
                ))}
              </div>
            )}

            <div className="text-xs text-gray-500 dark:text-gray-400">
              {formData.tags.length}/20 tags
            </div>
            {errors.tags && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.tags}
              </p>
            )}
          </motion.div>

          {/* Active Status */}
          <motion.div variants={itemVariants}>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  handleInputChange("isActive", e.target.checked)
                }
                className="w-4 h-4 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400"
              />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Make this category active immediately
              </span>
            </label>
          </motion.div>

          {/* Submit Button */}
          <motion.div variants={itemVariants} className="pt-6">
            <button
              type="submit"
              disabled={createLoading}
              className="w-full bg-blue-600 dark:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-800 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {createLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Plus className="w-5 h-5" />
              )}
              {createLoading ? "Creating Category..." : "Create Category"}
            </button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
};

export default CategoryForm;
