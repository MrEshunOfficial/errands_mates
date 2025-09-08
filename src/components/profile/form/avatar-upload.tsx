import React, { useState, useRef, useCallback } from "react";
import {
  Camera,
  Upload,
  X,
  Loader2,
  Check,
  AlertCircle,
  Edit3,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";

export interface ImageUploadData {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}

interface ImageUploadProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  shape?: "circle" | "square" | "rounded";
  showLabel?: boolean;
  label?: string;
  description?: string;
  allowRemove?: boolean;
  currentImageUrl?: string;
  placeholder?: string;
  maxSize?: number; // in bytes, default 5MB
  allowedTypes?: string[];
  isLoading?: boolean;
  onFileSelect?: (file: File) => Promise<void> | void;
  onRemove?: () => Promise<void> | void;
  onSuccess?: (data: ImageUploadData) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  uploadButtonText?: string;
  removeButtonText?: string;
  dragAndDropText?: string;
  emptyStateIcon?: React.ReactNode;
  customValidation?: (file: File) => string | null | Promise<string | null>;
}

const sizeClasses = {
  sm: "w-20 h-20",
  md: "w-28 h-28",
  lg: "w-36 h-36",
  xl: "w-44 h-44",
};

const shapeClasses = {
  circle: "rounded-full",
  square: "rounded-none",
  rounded: "rounded-xl",
};

const iconSizes = {
  sm: 18,
  md: 22,
  lg: 26,
  xl: 30,
};

export default function ImageUpload({
  className = "",
  size = "lg",
  shape = "circle",
  showLabel = true,
  label = "Upload Image",
  description = "Add an image to enhance your content",
  allowRemove = true,
  currentImageUrl,
  placeholder = "Click or drag & drop to upload",
  maxSize = 5 * 1024 * 1024, // 5MB default
  allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ],
  isLoading = false,
  onFileSelect,
  onRemove,
  onSuccess,
  onError,
  disabled = false,
  uploadButtonText = "Change Image",
  removeButtonText = "Remove Image",
  dragAndDropText = "Drop here",
  emptyStateIcon,
  customValidation,
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get display URL - preview takes precedence over current image
  const displayUrl = previewUrl || currentImageUrl;
  const hasImage = !!displayUrl;
  const hasError = uploadError;
  const isProcessing = isUploading || isLoading;

  const validateFile = useCallback(
    async (file: File): Promise<string | null> => {
      // Custom validation first (sync or async)
      if (customValidation) {
        const customError = await customValidation(file);
        if (customError) return customError;
      }

      if (!allowedTypes.includes(file.type)) {
        const typesList = allowedTypes
          .map((type) => type.replace("image/", "").toUpperCase())
          .join(", ");
        return `Please select a valid image file (${typesList})`;
      }

      if (file.size > maxSize) {
        const sizeMB = Math.round(maxSize / (1024 * 1024));
        return `File size must be less than ${sizeMB}MB`;
      }

      return null;
    },
    [allowedTypes, maxSize, customValidation]
  );

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (disabled) return;

      const validationError = await validateFile(file); // ✅ await it
      if (validationError) {
        setUploadError(validationError);
        onError?.(validationError);
        return;
      }

      setUploadError(null);
      setUploadSuccess(false);

      // Create preview immediately
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Handle file upload
      if (onFileSelect) {
        setIsUploading(true);

        try {
          await onFileSelect(file);

          const imageData: ImageUploadData = {
            url: previewUrl || URL.createObjectURL(file),
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            uploadedAt: new Date(),
          };

          setUploadSuccess(true);
          setPreviewUrl(null); // Clear preview since upload is complete
          onSuccess?.(imageData);

          // Clear success message after 3 seconds
          setTimeout(() => setUploadSuccess(false), 3000);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to upload image";
          setUploadError(errorMessage);
          setPreviewUrl(null);
          onError?.(errorMessage);
        } finally {
          setIsUploading(false);
        }
      }
    },
    [disabled, validateFile, onFileSelect, onSuccess, onError, previewUrl]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
      // Reset input value to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (disabled) return;

      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect, disabled]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();
      setDragOver(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setDragOver(false);
      }
    },
    [disabled]
  );

  const handleRemoveImage = useCallback(async () => {
    if (!allowRemove || disabled) return;

    // If it's a preview (not yet saved), just clear the preview
    if (previewUrl) {
      setPreviewUrl(null);
      setUploadSuccess(false);
      setUploadError(null);
      return;
    }

    // If there's a remove handler, call it
    if (onRemove) {
      setIsUploading(true);
      setUploadError(null);

      try {
        await onRemove();
        setUploadSuccess(true);

        // Clear success message after 3 seconds
        setTimeout(() => setUploadSuccess(false), 3000);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to remove image";
        setUploadError(errorMessage);
        onError?.(errorMessage);
      } finally {
        setIsUploading(false);
      }
    }
  }, [allowRemove, disabled, previewUrl, onRemove, onError]);

  const handleUploadClick = useCallback(() => {
    if (disabled) return;
    fileInputRef.current?.click();
  }, [disabled]);

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            {label}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
        </div>
      )}

      <div className="flex flex-col items-center space-y-4">
        {/* Image Upload Container */}
        <div
          className="relative group"
          onMouseEnter={() => !disabled && setShowActions(true)}
          onMouseLeave={() => setShowActions(false)}
        >
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={!hasImage && !disabled ? handleUploadClick : undefined}
            className={`
              ${sizeClasses[size]} ${
              shapeClasses[shape]
            } overflow-hidden border-4 transition-all duration-300 relative
              ${
                hasImage
                  ? "cursor-default"
                  : disabled
                  ? "cursor-not-allowed"
                  : "cursor-pointer"
              }
              ${disabled ? "opacity-50" : ""}
              ${
                dragOver && !disabled
                  ? "border-blue-500 dark:border-blue-400 shadow-lg shadow-blue-200 dark:shadow-blue-900/50 scale-105"
                  : hasError
                  ? "border-red-400 dark:border-red-500 shadow-lg shadow-red-200 dark:shadow-red-900/50"
                  : hasImage
                  ? "border-gray-200 dark:border-gray-600 group-hover:border-gray-300 dark:group-hover:border-gray-500 shadow-lg"
                  : "border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg hover:shadow-blue-100 dark:hover:shadow-blue-900/30"
              }
              ${
                !hasImage
                  ? "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700"
                  : ""
              }
            `}
          >
            {/* Image Display */}
            {hasImage ? (
              <>
                <Image
                  src={displayUrl}
                  alt="Uploaded image"
                  className="w-full h-full object-cover"
                  fill
                />

                {/* Hover Overlay */}
                <AnimatePresence>
                  {showActions && !isProcessing && !disabled && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center"
                    >
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={handleUploadClick}
                          className="p-2 bg-white/90 hover:bg-white text-gray-700 rounded-full shadow-md transition-all duration-200 hover:scale-110"
                          title={uploadButtonText}
                        >
                          <Edit3 size={16} />
                        </button>
                        {allowRemove && (
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="p-2 bg-red-500/90 hover:bg-red-500 text-white rounded-full shadow-md transition-all duration-200 hover:scale-110"
                            title={removeButtonText}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              /* Empty State */
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                <div
                  className={`
                  p-3 rounded-full mb-2 transition-all duration-200
                  ${
                    dragOver && !disabled
                      ? "bg-blue-100 dark:bg-blue-900/50 scale-110"
                      : "bg-gray-200 dark:bg-gray-600 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50"
                  }
                `}
                >
                  {emptyStateIcon ||
                    (dragOver ? (
                      <Camera
                        size={iconSizes[size]}
                        className="text-blue-600 dark:text-blue-400"
                      />
                    ) : (
                      <Upload
                        size={iconSizes[size]}
                        className="text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                      />
                    ))}
                </div>
                <div className="space-y-1">
                  <p
                    className={`text-sm font-medium transition-colors ${
                      dragOver && !disabled
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                    }`}
                  >
                    {dragOver ? dragAndDropText : "Add Image"}
                  </p>
                  {!dragOver && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {placeholder}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Loading Overlay */}
            <AnimatePresence>
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 flex flex-col items-center justify-center backdrop-blur-sm"
                >
                  <Loader2
                    size={iconSizes[size]}
                    className="text-blue-600 dark:text-blue-400 animate-spin mb-2"
                  />
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {isUploading ? "Uploading..." : "Loading..."}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Overlay */}
            <AnimatePresence>
              {uploadSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 bg-green-500/90 flex flex-col items-center justify-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Check size={iconSizes[size]} className="text-white mb-2" />
                  </motion.div>
                  <p className="text-xs font-medium text-white">Updated!</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Remove Button (for mobile/touch devices) */}
          {hasImage && allowRemove && !isProcessing && !disabled && (
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute -top-1 -right-1 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110 lg:opacity-0 lg:group-hover:opacity-100"
              title={removeButtonText}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* File Format Info */}
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-xs">
          Supported formats:{" "}
          {allowedTypes
            .map((type) => type.replace("image/", "").toUpperCase())
            .join(", ")}{" "}
          • Max size: {Math.round(maxSize / (1024 * 1024))}MB
        </p>

        {/* Error Message */}
        <AnimatePresence>
          {hasError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg max-w-md w-full"
            >
              <AlertCircle
                size={16}
                className="text-red-500 dark:text-red-400 flex-shrink-0"
              />
              <p className="text-sm text-red-700 dark:text-red-300">
                {uploadError}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hidden File Input */}
      <Input
        ref={fileInputRef}
        type="file"
        accept={allowedTypes.join(",")}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}
