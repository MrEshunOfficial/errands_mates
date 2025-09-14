import React, { useCallback, useState, useEffect } from "react";
import {
  FolderOpen,
  Image as ImageIcon,
  Upload,
  X,
  Loader2,
} from "lucide-react";
import { Category } from "@/types/category.types";
import { useAdminCategory } from "@/hooks/admin/admin.category.hook";
import { FileReference } from "@/lib/api/categories/categoryImage.api";
import { useCategoryImage } from "@/hooks/public/categories/useCategoryImages";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CategoryImageUploadProps {
  categoryId: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  shape?: "circle" | "square" | "rounded";
  showLabel?: boolean;
  allowRemove?: boolean;
  onSuccess?: (imageData: FileReference | null) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export default function CategoryImageUpload({
  categoryId,
  className = "",
  size = "lg",
  shape = "rounded",
  showLabel = true,
  allowRemove = true,
  onSuccess,
  onError,
  disabled = false,
}: CategoryImageUploadProps) {
  const { category, updateLoading, isLoading } = useAdminCategory(categoryId, {
    autoFetch: true,
    autoFetchCategories: false,
  });

  // Use the category image hook for image operations
  const {
    loading: imageLoading,
    error: imageError,
    imageData,
    hasImage,
    fetchImage,
    uploadImage,
    replaceImage,
    deleteImage,
  } = useCategoryImage(categoryId);

  const [dragActive, setDragActive] = useState(false);

  // Fetch image on mount
  useEffect(() => {
    fetchImage();
  }, [fetchImage]);

  // Handle errors from the hook
  useEffect(() => {
    if (imageError) {
      onError?.(imageError);
    }
  }, [imageError, onError]);

  // Use imageData from hook or fallback to category data
  const currentImageUrl = imageData?.url || category?.image?.url;

  // Image compression utility
  const compressImage = useCallback(
    (file: File, maxWidth = 800, quality = 0.8): Promise<File> => {
      return new Promise((resolve) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new window.Image(); // ✅ use DOM Image

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

  // Handle file processing and upload
  const handleFileSelect = useCallback(
    async (file: File) => {
      if (disabled || imageLoading) return;

      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        onError?.(validationError);
        return;
      }

      try {
        // Compress if needed
        let processedFile = file;
        if (file.size > 1024 * 1024) {
          // If larger than 1MB
          processedFile = await compressImage(file);
        }

        // Convert file to base64 for upload
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(processedFile);
        });

        // Prepare upload data
        const uploadData = {
          image: {
            url: base64,
            fileName: processedFile.name,
            fileSize: processedFile.size,
            mimeType: processedFile.type,
            uploadedAt: new Date(),
          },
        };

        // Use hook method for upload or replace
        const result =
          hasImage || currentImageUrl
            ? await replaceImage(uploadData)
            : await uploadImage(uploadData);

        if (result) {
          const image = result.data?.newImage || result.data?.image;
          if (image) {
            onSuccess?.(image);
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to upload category image";
        onError?.(errorMessage);
      }
    },
    [
      disabled,
      imageLoading,
      validateFile,
      compressImage,
      hasImage,
      currentImageUrl,
      replaceImage,
      uploadImage,
      onSuccess,
      onError,
    ]
  );

  // Handle file input change
  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
      // Reset input to allow selecting the same file again
      event.target.value = "";
    },
    [handleFileSelect]
  );

  // Handle drag and drop
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled && !imageLoading) {
        setDragActive(true);
      }
    },
    [disabled, imageLoading]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);

      if (disabled || imageLoading) return;

      const files = Array.from(e.dataTransfer.files);
      const imageFile = files.find((file) => file.type.startsWith("image/"));

      if (imageFile) {
        handleFileSelect(imageFile);
      } else {
        onError?.("Please drop an image file");
      }
    },
    [disabled, imageLoading, handleFileSelect, onError]
  );

  // Handle image removal
  const handleRemoveImage = useCallback(async () => {
    if (disabled || imageLoading || !allowRemove) return;

    try {
      const result = await deleteImage();
      if (result) {
        onSuccess?.(null); // Indicate successful removal
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to remove category image";
      onError?.(errorMessage);
    }
  }, [disabled, imageLoading, allowRemove, deleteImage, onSuccess, onError]);

  // Size classes
  const sizeClasses = {
    sm: "w-24 h-24",
    md: "w-32 h-32",
    lg: "w-48 h-48",
    xl: "w-64 h-64",
  };

  // Shape classes
  const shapeClasses = {
    circle: "rounded-full",
    square: "rounded-none",
    rounded: "rounded-xl",
  };

  const isLoadingState = isLoading || updateLoading || imageLoading;

  return (
    <div className={`space-y-4 ${className}`}>
      {showLabel && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Category Image
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Upload a high-quality image that represents this category.
          </p>
        </div>
      )}

      <div
        className={`relative ${
          sizeClasses[size]
        } mx-auto border-2 border-dashed transition-all duration-300 ${
          dragActive
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : currentImageUrl
            ? "border-gray-300 dark:border-gray-600"
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
        } ${shapeClasses[shape]} overflow-hidden`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {currentImageUrl ? (
          // Show current image with overlay controls
          <div className="w-full h-28 relative">
            <Image
              src={currentImageUrl}
              alt="Category"
              className="w-full h-full object-cover"
              fill
            />

            {/* Overlay controls */}
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100">
              <div className="flex gap-2">
                <label className="cursor-pointer">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                    disabled={isLoadingState}
                  />
                  <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <Upload className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                  </div>
                </label>

                {allowRemove && (
                  <Button
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={isLoadingState}
                    className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </Button>
                )}
              </div>
            </div>

            {/* Loading overlay */}
            {isLoadingState && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {imageLoading ? "Processing..." : "Loading..."}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Show upload area
          <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center p-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
              disabled={isLoadingState}
            />

            {isLoadingState ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {imageLoading ? "Processing..." : "Loading..."}
                </span>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-3">
                  <FolderOpen className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Upload Image
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Click or drag & drop
                </span>
                <span className="text-xs text-gray-400 mt-1">
                  PNG, JPG, WebP up to 5MB
                </span>
              </>
            )}
          </label>
        )}
      </div>
    </div>
  );
}

// Enhanced Card variant for better UI integration
interface CategoryImageUploadCardProps
  extends Omit<CategoryImageUploadProps, "size" | "shape" | "showLabel"> {
  category?: Category;
  compact?: boolean;
}

export function CategoryImageUploadCard({
  categoryId,
  category,
  className = "",
  compact = false,
  allowRemove = true,
  onSuccess,
  onError,
  disabled = false,
}: CategoryImageUploadCardProps) {
  const [uploading, setUploading] = useState(false);

  // Enhanced success handler that includes loading state
  const handleSuccess = useCallback(
    (imageData: FileReference | null) => {
      setUploading(false);

      if (imageData) {
        // ✅ Upload or replace success
        onSuccess?.(imageData);
      } else {
        // ✅ Removal success
        onSuccess?.(null);
      }
    },
    [onSuccess]
  );

  // Enhanced error handler that includes loading state
  const handleError = useCallback(
    (error: string) => {
      setUploading(false);
      onError?.(error);
    },
    [onError]
  );

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 ${
        compact ? "p-4" : "p-6"
      } ${className}`}
    >
      {!compact && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Category Image
          </h3>
          {category && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span className="font-medium">Category:</span> {category.name}
            </p>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Upload a high-quality image that represents this category.
            Recommended size: 400x400px or larger.
          </p>
        </div>
      )}

      <CategoryImageUpload
        categoryId={categoryId}
        size={compact ? "md" : "lg"}
        shape="rounded"
        showLabel={false}
        allowRemove={allowRemove}
        onSuccess={handleSuccess}
        onError={handleError}
        disabled={disabled || uploading}
      />

      {!compact && (
        <div className="mt-4 text-xs text-gray-400 dark:text-gray-500 space-y-1">
          <p>• Use high contrast images for better visibility</p>
          <p>• Avoid text-heavy images as they may not scale well</p>
          <p>
            • Images will be automatically optimized for different display sizes
          </p>
        </div>
      )}
    </div>
  );
}

// Bulk category image upload component for admin
interface BulkCategoryImageUploadProps {
  categories: Category[];
  onSuccess?: (categoryId: string, imageData: FileReference) => void;
  onError?: (categoryId: string, error: string) => void;
  className?: string;
}

export function BulkCategoryImageUpload({
  categories,
  onError,
  className = "",
}: BulkCategoryImageUploadProps) {
  const [uploadingCategories, setUploadingCategories] = useState<Set<string>>(
    new Set()
  );

  const handleSuccess = useCallback(
    (categoryId: string) => (imageData: FileReference | null) => {
      setUploadingCategories((prev) => {
        const next = new Set(prev);
        next.delete(categoryId);
        return next;
      });

      if (imageData) {
        console.log("Uploaded/replaced for category:", categoryId, imageData);
      } else {
        console.log("Removed image for category:", categoryId);
      }
    },
    []
  );

  const handleError = useCallback(
    (categoryId: string) => (error: string) => {
      setUploadingCategories((prev) => {
        const newSet = new Set(prev);
        newSet.delete(categoryId);
        return newSet;
      });
      onError?.(categoryId, error);
    },
    [onError]
  );

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Bulk Category Image Upload
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Upload images for multiple categories. Each category can have its own
          image.
        </p>
        <div className="mt-2 text-sm text-gray-500">
          {uploadingCategories.size > 0 && (
            <span className="text-blue-600">
              {uploadingCategories.size} upload(s) in progress...
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <CategoryImageUploadCard
            key={category._id.toString()}
            categoryId={category._id.toString()}
            category={category}
            compact={true}
            onSuccess={handleSuccess(category._id.toString())}
            onError={handleError(category._id.toString())}
            disabled={uploadingCategories.has(category._id.toString())}
          />
        ))}
      </div>
    </div>
  );
}
