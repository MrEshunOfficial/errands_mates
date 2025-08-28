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
import type { ProfilePicture } from "@/types/base.types";
import { useProfile } from "@/hooks/profiles/useProfile";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface ProfilePictureUpdateProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showLabel?: boolean;
  allowRemove?: boolean;
  onSuccess?: (profilePicture: ProfilePicture) => void;
  onError?: (error: string) => void;
}

const sizeClasses = {
  sm: "w-20 h-20",
  md: "w-28 h-28",
  lg: "w-36 h-36",
  xl: "w-44 h-44",
};

const iconSizes = {
  sm: 18,
  md: 22,
  lg: 26,
  xl: 30,
};

export default function ProfilePictureUpdate({
  className = "",
  size = "lg",
  showLabel = true,
  allowRemove = true,
  onSuccess,
  onError,
}: ProfilePictureUpdateProps) {
  const {
    profile,
    updateProfilePicture,
    removeProfilePicture,
    isLoading,
    error,
  } = useProfile();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get current profile picture URL
  const currentProfilePicture = profile?.profilePicture?.url;
  const displayUrl = previewUrl || currentProfilePicture;
  const hasImage = !!displayUrl;
  const hasError = uploadError || error;

  const validateFile = useCallback((file: File): string | null => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      return "Please select a valid image file (JPEG, PNG, GIF, or WebP)";
    }

    if (file.size > maxSize) {
      return "File size must be less than 5MB";
    }

    return null;
  }, []);

  const handleFileSelect = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
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

      // Upload file
      setIsUploading(true);

      try {
        // Convert file to base64 or handle upload logic based on your API requirements
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        const profilePictureData: ProfilePicture = {
          url: base64,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          uploadedAt: new Date(),
        };

        await updateProfilePicture(profilePictureData);

        setUploadSuccess(true);
        setPreviewUrl(null); // Clear preview since it's now the actual profile picture
        onSuccess?.(profilePictureData);

        // Clear success message after 3 seconds
        setTimeout(() => setUploadSuccess(false), 3000);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to update profile picture";
        setUploadError(errorMessage);
        setPreviewUrl(null);
        onError?.(errorMessage);
      } finally {
        setIsUploading(false);
      }
    },
    [validateFile, updateProfilePicture, onSuccess, onError]
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
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragOver to false if we're actually leaving the drop zone
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOver(false);
    }
  }, []);

  const handleRemovePicture = useCallback(async () => {
    if (!allowRemove) return;

    // If it's a preview (not yet saved), just clear the preview
    if (previewUrl) {
      setPreviewUrl(null);
      setUploadSuccess(false);
      setUploadError(null);
      return;
    }

    // If it's a saved profile picture, remove it from the server
    setIsUploading(true);
    setUploadError(null);

    try {
      await removeProfilePicture();
      setUploadSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to remove profile picture";
      setUploadError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  }, [allowRemove, removeProfilePicture, onError, previewUrl]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Profile Picture
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Add a photo to help others recognize you. Your photo will be visible
            to other users.
          </p>
        </div>
      )}

      <div className="flex flex-col items-center space-y-4">
        {/* Profile Picture Container */}
        <div
          className="relative group"
          onMouseEnter={() => setShowActions(true)}
          onMouseLeave={() => setShowActions(false)}
        >
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={!hasImage ? handleUploadClick : undefined}
            className={`
              ${
                sizeClasses[size]
              } rounded-full overflow-hidden border-4 transition-all duration-300 relative
              ${hasImage ? "cursor-default" : "cursor-pointer"}
              ${
                dragOver
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
                  alt="Profile"
                  className="w-full h-full object-cover"
                  fill
                />

                {/* Hover Overlay */}
                <AnimatePresence>
                  {showActions && !isUploading && !isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center"
                    >
                      <div className="flex space-x-2">
                        <button
                          onClick={handleUploadClick}
                          className="p-2 bg-white/90 hover:bg-white text-gray-700 rounded-full shadow-md transition-all duration-200 hover:scale-110"
                          title="Change picture"
                        >
                          <Edit3 size={16} />
                        </button>
                        {allowRemove && (
                          <button
                            onClick={handleRemovePicture}
                            className="p-2 bg-red-500/90 hover:bg-red-500 text-white rounded-full shadow-md transition-all duration-200 hover:scale-110"
                            title="Remove picture"
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
                    dragOver
                      ? "bg-blue-100 dark:bg-blue-900/50 scale-110"
                      : "bg-gray-200 dark:bg-gray-600 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50"
                  }
                `}
                >
                  {dragOver ? (
                    <Camera
                      size={iconSizes[size]}
                      className="text-blue-600 dark:text-blue-400"
                    />
                  ) : (
                    <Upload
                      size={iconSizes[size]}
                      className="text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                    />
                  )}
                </div>
                <div className="space-y-1">
                  <p
                    className={`text-sm font-medium transition-colors ${
                      dragOver
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                    }`}
                  >
                    {dragOver ? "Drop here" : "Add Photo"}
                  </p>
                  {!dragOver && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Click or drag & drop
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Loading Overlay */}
            <AnimatePresence>
              {(isUploading || isLoading) && (
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
          {hasImage && allowRemove && !isUploading && !isLoading && (
            <button
              onClick={handleRemovePicture}
              className="absolute -top-1 -right-1 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110 lg:opacity-0 lg:group-hover:opacity-100"
              title="Remove picture"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* File Format Info */}
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-xs">
          Supported formats: JPEG, PNG, GIF, WebP • Max size: 5MB
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
                {uploadError || error}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  );
}
