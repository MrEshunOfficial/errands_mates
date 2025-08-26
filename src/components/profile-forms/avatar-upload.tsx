"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Check,
  AlertCircle,
  User,
  Loader2,
  Image as ImageIcon,
  RefreshCw,
} from "lucide-react";
import { validateProfilePictureFile } from "@/lib/utils/schemas/profile.schemas";
import { ProfilePicture } from "@/types";
import Image from "next/image";

interface ProfilePictureUploadProps {
  currentPicture?: ProfilePicture | null;
  onImageSelect: (file: File) => void;
  onImageRemove: () => void;
  onUploadStart?: () => void;
  onUploadComplete?: (picture: ProfilePicture) => void;
  onUploadError?: (error: string) => void;
  isUploading?: boolean;
  error?: string | null;
  disabled?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showPreview?: boolean;
  allowedTypes?: string[];
  maxSizeInMB?: number;
}

const sizeClasses = {
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-32 h-32",
  xl: "w-40 h-40",
};

const iconSizes = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-8 h-8",
};

export default function ProfilePictureUpload({
  currentPicture,
  onImageSelect,
  onImageRemove,
  onUploadStart,
  onUploadError,
  isUploading = false,
  error,
  disabled = false,
  size = "lg",
  className = "",
  showPreview = true,
  allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  maxSizeInMB = 5,
}: ProfilePictureUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      setValidationError(null);

      // Validate file
      const validation = validateProfilePictureFile(file);
      if (!validation.isValid) {
        setValidationError(validation.error || "Invalid file");
        onUploadError?.(validation.error || "Invalid file");
        return;
      }

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Call parent handler
      onImageSelect(file);
      onUploadStart?.();
    },
    [onImageSelect, onUploadStart, onUploadError]
  );

  const handleDrag = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled || isUploading) return;

      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true);
      } else if (e.type === "dragleave") {
        setDragActive(false);
      }
    },
    [disabled, isUploading]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled || isUploading) return;

      const files = e.dataTransfer.files;
      if (files && files[0]) {
        handleFile(files[0]);
      }
    },
    [disabled, isUploading, handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled || isUploading) return;

      const files = e.target.files;
      if (files && files[0]) {
        handleFile(files[0]);
      }
    },
    [disabled, isUploading, handleFile]
  );

  const handleRemove = useCallback(() => {
    if (disabled || isUploading) return;

    setPreviewUrl(null);
    setValidationError(null);
    onImageRemove();

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [disabled, isUploading, onImageRemove]);

  const handleClick = useCallback(() => {
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  }, [disabled, isUploading]);

  const displayImage = previewUrl || currentPicture?.url;
  const hasImage = !!displayImage;
  const showError = validationError || error;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div className="flex flex-col items-center">
        <div
          className={`relative ${
            sizeClasses[size]
          } w-40 h-40  /* increased size */
    rounded-md overflow-hidden group cursor-pointer transition-all duration-300
    ${
      dragActive
        ? "ring-4 ring-blue-300 dark:ring-blue-600 ring-opacity-50 scale-105"
        : hasImage
        ? "ring-2 ring-gray-200 dark:ring-gray-700 hover:ring-blue-300 dark:hover:ring-blue-600"
        : "ring-2 ring-dashed ring-gray-300 dark:ring-gray-600 hover:ring-blue-400 dark:hover:ring-blue-500"
    } ${disabled || isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={handleClick}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {/* Image or placeholder */}
          {hasImage ? (
            <Image
              src={displayImage}
              alt="Profile picture"
              fill
              className="absolute inset-0 w-full h-full object-cover transition-all duration-300 group-hover:scale-110"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <User
                className={`${iconSizes[size]} text-gray-400 dark:text-gray-500`}
              />
            </div>
          )}

          {/* Upload status indicator */}
          <AnimatePresence>
            {isUploading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
              >
                <div className="bg-white dark:bg-gray-800 rounded-full p-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success indicator */}
          <AnimatePresence>
            {currentPicture && !previewUrl && !isUploading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute top-2 right-2"
              >
                <div className="bg-green-500 rounded-full p-1">
                  <Check className="w-3 h-3 text-white" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Remove button */}
          <AnimatePresence>
            {hasImage && !isUploading && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                disabled={disabled}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-colors z-10"
              >
                <X className="w-4 h-4" /> {/* slightly bigger */}
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={allowedTypes.join(",")}
          onChange={handleInputChange}
          disabled={disabled || isUploading}
          className="hidden"
          aria-label="Upload profile picture"
        />

        {/* Upload text */}
        <div className="text-center mt-3">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {isUploading
              ? "Uploading..."
              : hasImage
              ? "Change photo"
              : "Update your profile photo"}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {dragActive
              ? "Drop your photo here"
              : `Click to upload or drag & drop (Max ${maxSizeInMB}MB)`}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {allowedTypes
              .map((type) => type.split("/")[1].toUpperCase())
              .join(", ")}
          </p>
        </div>
      </div>

      {/* Error message */}
      <AnimatePresence>
        {showError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{showError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload preview details */}
      <AnimatePresence>
        {previewUrl && showPreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-blue-900 dark:text-blue-100 font-medium">
                  Photo ready to upload
                </span>
              </div>
              {!isUploading && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current image info */}
      <AnimatePresence>
        {currentPicture && !previewUrl && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm text-green-900 dark:text-green-100 font-medium">
                  Profile photo uploaded
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {currentPicture.fileName && (
                  <span className="text-xs text-green-700 dark:text-green-300">
                    {currentPicture.fileName}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleClick}
                  className="text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100 transition-colors"
                  title="Change photo"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Export types for better TypeScript integration
export type { ProfilePictureUploadProps };
