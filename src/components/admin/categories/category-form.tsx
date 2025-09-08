// Updated CategoryForm component with fixed image handling

"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  X,
  Tag,
  Loader2,
  Check,
  AlertCircle,
  Edit3,
  Upload,
} from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Category } from "@/types";
import { createCategorySchema } from "@/lib/utils/schemas/service.category.schema";
import { toast } from "sonner";
import { useAdminCategoryManager } from "@/hooks/categories/adminCategory.hook";
import { CategoryImageUploadCard } from "./UploadCategoryImage";
import Image from "next/image";
import { FileReference } from "@/lib/api/categories/categoryImage.api";

type FormData = z.infer<typeof createCategorySchema>;

interface CategoryFormProps {
  mode?: "create" | "edit";
  initialCategory?: Category;
  onSuccess?: (category: Category) => void;
  onCancel?: () => void;
  parentCategoryId?: string;
  className?: string;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  mode = "create",
  initialCategory,
  onSuccess,
  onCancel,
  parentCategoryId,
  className = "",
}) => {
  const isEdit = mode === "edit";

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    tags: [],
    isActive: true,
    parentCategoryId,
  });

  const [currentTag, setCurrentTag] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  // Image handling state
  const [imageData, setImageData] = useState<FileReference | null>(null);
  const [, setPendingImageFile] = useState<File | null>(null);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  const {
    categories: parentCategories,
    createCategory,
    createLoading,
    createError,
    updateCategory,
    updateLoading,
    updateError,
    clearCreateState,
    clearUpdateState,
    fetchAllParentCategories,
  } = useAdminCategoryManager({ autoFetchOnMount: false });

  // Initialize form data for edit mode
  useEffect(() => {
    if (isEdit && initialCategory) {
      setFormData({
        name: initialCategory.name || "",
        description: initialCategory.description || "",
        tags: [...(initialCategory.tags || [])],
        isActive: initialCategory.isActive ?? true,
        parentCategoryId:
          initialCategory.parentCategoryId?.toString() || parentCategoryId,
      });

      if (initialCategory.image) {
        setImageData(initialCategory.image);
      }
    }
  }, [isEdit, initialCategory, parentCategoryId]);

  // Fetch parent categories
  useEffect(() => {
    fetchAllParentCategories();
  }, [fetchAllParentCategories]);

  // Reset states on mode change
  useEffect(() => {
    clearCreateState();
    clearUpdateState();
    setErrors({});
    setShowSuccess(false);
  }, [mode, clearCreateState, clearUpdateState]);

  // Handle escape key for modal
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && showImageModal) {
        setShowImageModal(false);
      }
    };

    if (showImageModal) {
      document.addEventListener("keydown", handleEscapeKey);
      // Prevent background scrolling
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "unset";
    };
  }, [showImageModal]);

  // Utility functions
  const updateField = useCallback(
    (field: keyof FormData, value: unknown) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    },
    [errors]
  );

  const addTag = useCallback(() => {
    const tag = currentTag.trim();
    if (!tag) {
      setErrors((prev) => ({ ...prev, tags: "Tag cannot be empty" }));
      return;
    }

    if (formData.tags.includes(tag)) {
      setErrors((prev) => ({ ...prev, tags: "Tag already exists" }));
      return;
    }

    if (formData.tags.length >= 20) {
      setErrors((prev) => ({ ...prev, tags: "Maximum 20 tags allowed" }));
      return;
    }

    setErrors((prev) => ({ ...prev, tags: "" }));
    setFormData((prev) => ({
      ...prev,
      tags: [...prev.tags, tag],
    }));
    setCurrentTag("");
  }, [currentTag, formData.tags]);

  const removeTag = useCallback((tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
    setErrors((prev) => ({ ...prev, tags: "" }));
  }, []);

  // Image compression utility
  const compressImage = useCallback(
    (file: File, maxWidth = 800, quality = 0.8): Promise<File> => {
      return new Promise((resolve) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new window.Image(); // Use window.Image to avoid conflict

        img.onload = () => {
          const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
          const newWidth = img.width * ratio;
          const newHeight = img.height * ratio;

          canvas.width = newWidth;
          canvas.height = newHeight;

          ctx?.drawImage(img, 0, 0, newWidth, newHeight);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            file.type,
            quality
          );
        };

        img.src = URL.createObjectURL(file);
      });
    },
    []
  );

  // Convert file to FileReference
  const convertFileToFileReference = useCallback(
    async (file: File): Promise<FileReference> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            url: reader.result as string,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            uploadedAt: new Date(),
          });
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
    },
    []
  );

  // Validate image file
  const validateFile = useCallback((file: File): string | null => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (file.size > maxSize) {
      return "File size must be less than 5MB";
    }

    if (!allowedTypes.includes(file.type)) {
      return "Only JPEG, PNG, and WebP images are allowed";
    }

    return null;
  }, []);

  // Handle image file selection for create mode
  const handleImageFileSelect = useCallback(
    async (file: File) => {
      if (!file) return;

      setImageUploadLoading(true);
      setErrors((prev) => ({ ...prev, image: "" }));

      try {
        // Validate file
        const validationError = validateFile(file);
        if (validationError) {
          throw new Error(validationError);
        }

        // Compress if needed
        let processedFile = file;
        if (file.size > 1024 * 1024) {
          // If larger than 1MB
          toast.info("Compressing image...");
          processedFile = await compressImage(file);
        }

        // Convert to FileReference
        const fileReference = await convertFileToFileReference(processedFile);

        setImageData(fileReference);
        setPendingImageFile(processedFile);

        toast.success(
          `Image prepared for upload (${Math.round(
            processedFile.size / 1024
          )}KB)`
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to process image";
        setErrors((prev) => ({ ...prev, image: errorMessage }));
        toast.error(errorMessage);
      } finally {
        setImageUploadLoading(false);
      }
    },
    [compressImage, convertFileToFileReference, validateFile]
  );

  // Handle image removal for create mode
  const handleImageRemove = useCallback(() => {
    setImageData(null);
    setPendingImageFile(null);
    setErrors((prev) => ({ ...prev, image: "" }));
    toast.success("Image removed");
  }, []);

  // Handle image upload success from edit mode component
  const handleImageUploadSuccess = useCallback(
    (uploadedImageData: FileReference | null) => {
      if (!uploadedImageData) {
        setImageData(null);
        return;
      }
      setImageData(uploadedImageData);
      setErrors((prev) => ({ ...prev, image: "" }));
      toast.success("Category image uploaded successfully");
    },
    []
  );

  // Handle image upload error from edit mode component
  const handleImageUploadError = useCallback((error: string) => {
    setErrors((prev) => ({ ...prev, image: error }));
    toast.error(`Image upload failed: ${error}`);
  }, []);

  // Handle drag and drop
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!imageUploadLoading && !isEdit) {
        setIsDragActive(true);
      }
    },
    [imageUploadLoading, isEdit]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragActive(false);

      if (imageUploadLoading || isEdit) return;

      const files = Array.from(e.dataTransfer.files);
      const imageFile = files.find((file) => file.type.startsWith("image/"));

      if (imageFile) {
        handleImageFileSelect(imageFile);
      } else {
        toast.error("Please drop an image file");
      }
    },
    [imageUploadLoading, isEdit, handleImageFileSelect]
  );

  const handleTagKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addTag();
      }
    },
    [addTag]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      try {
        const validatedData = createCategorySchema.parse(formData);

        const apiData = {
          ...validatedData,
          parentCategoryId: validatedData.parentCategoryId || undefined,
          image: imageData
            ? {
                ...imageData,
                uploadedAt: imageData.uploadedAt
                  ? new Date(imageData.uploadedAt)
                  : undefined,
              }
            : undefined,
        };

        const result =
          isEdit && initialCategory
            ? await updateCategory(initialCategory._id.toString(), apiData)
            : await createCategory(apiData);

        if (result) {
          toast.success(
            `Category ${isEdit ? "updated" : "created"} successfully`
          );
          setShowSuccess(true);
          onSuccess?.(result);

          // Auto-reset for create mode
          if (!isEdit || !onSuccess) {
            setTimeout(() => {
              if (!isEdit) {
                setFormData({
                  name: "",
                  description: "",
                  tags: [],
                  isActive: true,
                  parentCategoryId,
                });
                setImageData(null);
                setPendingImageFile(null);
                setCurrentTag("");
              }
              setShowSuccess(false);
              clearCreateState();
              clearUpdateState();
            }, 2000);
          }
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldErrors: Record<string, string> = {};
          error.issues.forEach((issue) => {
            if (issue.path[0])
              fieldErrors[issue.path[0] as string] = issue.message;
          });
          setErrors(fieldErrors);
        }
      }
    },
    [
      formData,
      imageData,
      isEdit,
      initialCategory,
      createCategory,
      updateCategory,
      onSuccess,
      parentCategoryId,
      clearCreateState,
      clearUpdateState,
    ]
  );

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else if (isEdit && initialCategory) {
      setFormData({
        name: initialCategory.name || "",
        description: initialCategory.description || "",
        tags: [...(initialCategory.tags || [])],
        isActive: initialCategory.isActive ?? true,
        parentCategoryId:
          initialCategory.parentCategoryId?.toString() || parentCategoryId,
      });
      setImageData(initialCategory.image || null);
      setPendingImageFile(null);
      setCurrentTag("");
      setErrors({});
    }
  }, [onCancel, isEdit, initialCategory, parentCategoryId]);

  const currentError = isEdit ? updateError : createError;
  const isLoading = isEdit ? updateLoading : createLoading;

  return (
    <div className={`container mx-auto max-w-5xl rounded-md p-2 ${className}`}>
      <div className="w-full">
        {/* Success/Error Messages */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200 dark:border-green-700 rounded-2xl flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
              <span className="text-green-800 dark:text-green-200 font-medium">
                Category {isEdit ? "updated" : "created"} successfully!
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {currentError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 border border-red-200 dark:border-red-700 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-white" />
            </div>
            <span className="text-red-800 dark:text-red-200 font-medium">
              {currentError}
            </span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 p-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Column - Form Fields */}
            <div className="space-y-6">
              {/* Category Name */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                  Category Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="Enter category name"
                    className={`w-full px-4 py-4 bg-white/50 dark:bg-gray-700/50 border-2 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 ${
                      errors.name
                        ? "border-red-300 bg-red-50/50"
                        : "border-gray-200 hover:border-gray-300"
                    } text-gray-900 dark:text-gray-100 placeholder-gray-500`}
                    maxLength={100}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                    {formData.name.length}/100
                  </div>
                </div>
                {errors.name && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.name}
                  </motion.p>
                )}
              </motion.div>

              {/* Description */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                  Description
                </label>
                <div className="relative">
                  <textarea
                    value={formData.description || ""}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="Brief description of the category..."
                    rows={4}
                    className={`w-full px-4 py-4 bg-white/50 dark:bg-gray-700/50 border-2 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 resize-none ${
                      errors.description
                        ? "border-red-300 bg-red-50/50"
                        : "border-gray-200 hover:border-gray-300"
                    } text-gray-900 dark:text-gray-100 placeholder-gray-500`}
                    maxLength={500}
                  />
                  <div className="absolute right-3 bottom-3 text-xs text-gray-400">
                    {(formData.description || "").length}/500
                  </div>
                </div>
                {errors.description && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.description}
                  </motion.p>
                )}
              </motion.div>

              {/* Parent Category */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                  Parent Category
                </label>
                <select
                  value={formData.parentCategoryId || ""}
                  onChange={(e) =>
                    updateField("parentCategoryId", e.target.value || undefined)
                  }
                  className="w-full px-4 py-4 bg-white/50 dark:bg-gray-700/50 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-gray-900 dark:text-gray-100">
                  <option value="">Select parent category (optional)</option>
                  {parentCategories
                    .filter(
                      (cat) =>
                        !isEdit ||
                        cat._id.toString() !== initialCategory?._id.toString()
                    )
                    .map((cat) => (
                      <option
                        key={cat._id.toString()}
                        value={cat._id.toString()}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </motion.div>
            </div>

            {/* Right Column - Image Upload & Status */}
            <div className="space-y-6">
              {/* Category Image Upload */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                  Category Image
                </label>

                {isEdit && initialCategory ? (
                  // Edit mode - use existing image upload component
                  <CategoryImageUploadCard
                    categoryId={initialCategory._id.toString()}
                    category={initialCategory}
                    compact={true}
                    onSuccess={handleImageUploadSuccess}
                    onError={handleImageUploadError}
                    className="border-0 p-0 bg-transparent"
                  />
                ) : (
                  // Create mode - custom image selector with drag and drop
                  <div
                    className={`border-2 border-dashed rounded-2xl overflow-hidden transition-all duration-300 ${
                      isDragActive
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}>
                    {imageData ? (
                      // Show selected image
                      <div className="relative">
                        <div className="h-48 w-full bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden relative">
                          <Image
                            src={imageData.url}
                            alt="Category preview"
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 50vw"
                          />
                        </div>
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                              {imageData.fileName}
                            </span>
                            <span className="text-xs text-gray-500">
                              {Math.round((imageData.fileSize || 0) / 1024)}KB
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <label className="flex-1 cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleImageFileSelect(file);
                                  // Reset input value
                                  e.target.value = "";
                                }}
                                className="hidden"
                                disabled={imageUploadLoading}
                              />
                              <div className="w-full px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-700 rounded-lg text-blue-700 dark:text-blue-300 text-sm font-medium transition-colors flex items-center justify-center gap-2">
                                <Upload className="w-4 h-4" />
                                Replace
                              </div>
                            </label>
                            <button
                              type="button"
                              onClick={handleImageRemove}
                              disabled={imageUploadLoading}
                              className="px-3 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 text-sm font-medium transition-colors flex items-center justify-center gap-2">
                              <X className="w-4 h-4" />
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Show upload area
                      <label className="cursor-pointer block">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageFileSelect(file);
                            // Reset input value
                            e.target.value = "";
                          }}
                          className="hidden"
                          disabled={imageUploadLoading}
                        />
                        <div className="p-8 text-center">
                          {imageUploadLoading ? (
                            <div className="flex flex-col items-center">
                              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                              <p className="text-gray-600 dark:text-gray-400">
                                Processing image...
                              </p>
                            </div>
                          ) : (
                            <>
                              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Upload className="w-6 h-6 text-white" />
                              </div>
                              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                                Upload Category Image
                              </h3>
                              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                                Click to select or drag and drop an image
                              </p>
                              <p className="text-xs text-gray-400">
                                PNG, JPG, WebP up to 5MB
                              </p>
                            </>
                          )}
                        </div>
                      </label>
                    )}
                  </div>
                )}

                {errors.image && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.image}
                  </motion.p>
                )}
              </motion.div>

              {/* Status Toggle */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-2xl border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Status Settings
                </h3>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        updateField("isActive", e.target.checked)
                      }
                      className="sr-only"
                    />
                    <div
                      className={`w-12 h-6 rounded-full transition-all duration-300 ${
                        formData.isActive
                          ? "bg-blue-500"
                          : "bg-gray-300 dark:bg-gray-600"
                      }`}>
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 mt-0.5 ${
                          formData.isActive
                            ? "translate-x-6"
                            : "translate-x-0.5"
                        }`}
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Active Category
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Make this category visible immediately
                    </p>
                  </div>
                </label>
              </motion.div>
            </div>
          </div>

          {/* Tags Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
              Tags
            </label>

            <div className="flex gap-3 items-center">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={handleTagKeyPress}
                  placeholder="Add a tag"
                  className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-gray-900 dark:text-gray-100 placeholder-gray-500"
                />
                <Tag className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              <Button
                type="button"
                onClick={addTag}
                disabled={!currentTag.trim()}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-medium shadow-lg transition-all duration-300 flex items-center gap-2">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {formData.tags.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <AnimatePresence>
                    {formData.tags.map((tag, index) => (
                      <motion.span
                        key={`${tag}-${index}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ delay: index * 0.05 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 text-blue-800 dark:text-blue-200 rounded-xl text-sm font-medium border border-blue-200 dark:border-blue-700 shadow-sm">
                        {tag}
                        <Button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-1 transition-colors">
                          <X className="w-3 h-3" />
                        </Button>
                      </motion.span>
                    ))}
                  </AnimatePresence>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 dark:text-gray-400">
                    {formData.tags.length}/20 tags
                  </span>
                  {formData.tags.length >= 18 && (
                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                      Approaching limit
                    </span>
                  )}
                </div>
              </div>
            )}

            {errors.tags && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.tags}
              </motion.p>
            )}
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="pt-4 flex gap-4">
            {(isEdit || onCancel) && (
              <Button
                type="button"
                onClick={handleCancel}
                className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 py-4 px-8 rounded-2xl font-semibold text-lg shadow-lg transition-all duration-300 flex items-center justify-center gap-3">
                <X className="w-5 h-5" />
                Cancel
              </Button>
            )}

            <Button
              type="submit"
              disabled={isLoading || imageUploadLoading}
              className={`${
                isEdit || onCancel ? "flex-1" : "w-full"
              } bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 px-8 rounded-2xl font-semibold text-lg shadow-2xl focus:ring-4 focus:ring-blue-500/30 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3 group`}>
              {isLoading || imageUploadLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {imageUploadLoading
                    ? "Processing..."
                    : isEdit
                    ? "Updating..."
                    : "Creating..."}
                </>
              ) : (
                <>
                  {isEdit ? (
                    <Edit3 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  ) : (
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                  )}
                  {isEdit ? "Update Category" : "Create Category"}
                </>
              )}
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center mt-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              All fields marked with * are required
            </p>
            {!isEdit && imageData && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Image ready for upload with new category
              </p>
            )}
          </motion.div>
        </form>
      </div>
    </div>
  );
};

export default CategoryForm;
