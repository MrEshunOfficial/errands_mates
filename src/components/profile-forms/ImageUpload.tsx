"use client";
import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Upload,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
  ImageIcon,
  RefreshCw,
} from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  currentImage?: string;
  userName: string;
  onImageUpdate: (imageFile: File) => Promise<void>;
  onImageRemove?: () => Promise<void>;
  disabled?: boolean;
  maxSizeInMB?: number;
  acceptedFormats?: string[];
  className?: string;
  showRemoveOption?: boolean;
  allowRetry?: boolean;
  compressionQuality?: number; // 0.1 to 1.0
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImage,
  userName,
  onImageUpdate,
  onImageRemove,
  disabled = false,
  maxSizeInMB = 5,
  acceptedFormats = ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  className = "",
  showRemoveOption = true,
  allowRetry = true,
  compressionQuality = 0.8,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentImage || null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Update preview when currentImage changes
  useEffect(() => {
    setPreviewUrl(currentImage || null);
  }, [currentImage]);

  // Auto-hide success message
  useEffect(() => {
    if (uploadSuccess) {
      const timer = setTimeout(() => setUploadSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [uploadSuccess]);

  const getInitials = (name: string): string => {
    if (!name) return "U";
    return name
      .trim()
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!acceptedFormats.includes(file.type)) {
        return `Please select a valid image format: ${acceptedFormats
          .map((format) => format.split("/")[1].toUpperCase())
          .join(", ")}`;
      }

      const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
      if (file.size > maxSizeInBytes) {
        return `File size must be less than ${maxSizeInMB}MB. Current size: ${(
          file.size /
          1024 /
          1024
        ).toFixed(1)}MB`;
      }

      // Check minimum dimensions for profile pictures
      return new Promise<string | null>((resolve) => {
        const img = new window.Image();
        img.onload = () => {
          if (img.width < 100 || img.height < 100) {
            resolve("Image must be at least 100x100 pixels");
          } else {
            resolve(null);
          }
        };
        img.onerror = () => resolve("Invalid image file");
        img.src = URL.createObjectURL(file);
      });
    },
    [acceptedFormats, maxSizeInMB]
  );

  const compressImage = useCallback(
    (file: File): Promise<File> => {
      return new Promise((resolve) => {
        const canvas = canvasRef.current || document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new window.Image();

        img.onload = () => {
          // Calculate dimensions maintaining aspect ratio
          const maxDimension = 800; // Max width/height for profile pictures
          let { width, height } = img;

          if (width > height) {
            if (width > maxDimension) {
              height = (height * maxDimension) / width;
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = (width * maxDimension) / height;
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx?.drawImage(img, 0, 0, width, height);
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
            compressionQuality
          );
        };

        img.onerror = () => resolve(file);
        img.src = URL.createObjectURL(file);
      });
    },
    [compressionQuality]
  );

  const handleFileSelect = useCallback(
    async (file: File) => {
      setUploadError(null);
      setUploadSuccess(false);
      setUploadProgress(0);
      setOriginalFile(file);

      // Validate file
      const validationError = await validateFile(file);
      if (validationError) {
        setUploadError(validationError);
        return;
      }

      // Compress image if needed
      let processedFile = file;
      if (file.size > 1024 * 1024) {
        // Only compress files larger than 1MB
        try {
          processedFile = await compressImage(file);
        } catch (error) {
          console.warn("Image compression failed, using original:", error);
        }
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(processedFile);

      // Upload file
      setIsUploading(true);
      try {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 200);

        await onImageUpdate(processedFile);

        clearInterval(progressInterval);
        setUploadProgress(100);
        setUploadSuccess(true);
        setOriginalFile(null);
      } catch (error) {
        setUploadError(
          error instanceof Error ? error.message : "Failed to upload image"
        );
        // Revert preview on error
        setPreviewUrl(currentImage || null);
        setUploadProgress(0);
      } finally {
        setIsUploading(false);
      }
    },
    [onImageUpdate, currentImage, validateFile, compressImage]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set drag over to false if we're leaving the main container
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragOver(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled || isUploading) return;

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find((file) => acceptedFormats.includes(file.type));

    if (imageFile) {
      await handleFileSelect(imageFile);
    } else if (files.length > 0) {
      setUploadError("Please drop a valid image file");
    }
  };

  const openFileDialog = () => {
    if (!disabled && !isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removeImage = async () => {
    if (disabled || isRemoving) return;

    setIsRemoving(true);
    try {
      if (onImageRemove) {
        await onImageRemove();
      }
      setPreviewUrl(null);
      setUploadError(null);
      setUploadSuccess(false);
      setOriginalFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Failed to remove image"
      );
    } finally {
      setIsRemoving(false);
    }
  };

  const retryUpload = () => {
    if (originalFile) {
      handleFileSelect(originalFile);
    } else {
      openFileDialog();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Hidden canvas for image compression */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Avatar Upload Area */}
      <div className="flex flex-col items-center space-y-4">
        <motion.div
          className="relative group"
          whileHover={{ scale: disabled ? 1 : 1.02 }}
          whileTap={{ scale: disabled ? 1 : 0.98 }}>
          <div
            className={`
              relative w-28 h-28 rounded-full border-3 transition-all duration-300 cursor-pointer overflow-hidden
              ${
                isDragOver
                  ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30 shadow-lg scale-105"
                  : uploadError
                  ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20"
                  : uploadSuccess
                  ? "border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/20"
                  : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-md"
              }
              ${
                disabled || isUploading || isRemoving
                  ? "opacity-70 cursor-not-allowed"
                  : ""
              }
            `}
            onClick={openFileDialog}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-label={
              previewUrl ? "Change profile picture" : "Upload profile picture"
            }
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && !disabled) {
                e.preventDefault();
                openFileDialog();
              }
            }}>
            {previewUrl ? (
              <div className="relative w-full h-full">
                <Image
                  src={previewUrl}
                  alt={`${userName} profile`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 128px) 100vw, 128px"
                  priority={false}
                />
                {/* Upload progress overlay */}
                {isUploading && uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin mx-auto mb-2" />
                      <div className="w-16 h-1 bg-white bg-opacity-30 rounded-full mx-auto">
                        <div
                          className="h-full bg-white rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-teal-500 dark:from-blue-400 dark:via-purple-400 dark:to-teal-400 flex items-center justify-center text-white text-xl font-semibold shadow-inner">
                {getInitials(userName)}
              </div>
            )}

            {/* Upload Overlay */}
            <AnimatePresence>
              {!disabled && !isUploading && !isRemoving && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-sm">
                  <div className="text-center">
                    {isDragOver ? (
                      <>
                        <Upload className="w-7 h-7 text-white mx-auto mb-1" />
                        <span className="text-white text-xs font-medium">
                          Drop here
                        </span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-7 h-7 text-white mx-auto mb-1" />
                        <span className="text-white text-xs font-medium">
                          {previewUrl ? "Change" : "Upload"}
                        </span>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading State */}
            {(isUploading || isRemoving) && (
              <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin mx-auto mb-2" />
                  <span className="text-white text-xs font-medium">
                    {isUploading ? "Uploading..." : "Removing..."}
                  </span>
                </div>
              </div>
            )}

            {/* Remove Button */}
            {previewUrl &&
              !disabled &&
              !isUploading &&
              !isRemoving &&
              showRemoveOption && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage();
                  }}
                  className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors duration-200 shadow-lg border-2 border-white dark:border-gray-800"
                  aria-label="Remove profile picture">
                  <X className="w-4 h-4" />
                </motion.button>
              )}

            {/* Success Indicator */}
            <AnimatePresence>
              {uploadSuccess && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute -bottom-2 -right-2 w-7 h-7 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-800">
                  <CheckCircle className="w-4 h-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Upload Instructions */}
        {!disabled && (
          <div className="text-center space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {previewUrl ? "Change Profile Picture" : "Add Profile Picture"}
            </h4>
            <div className="space-y-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Click to upload or drag & drop
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Max {maxSizeInMB}MB •{" "}
                {acceptedFormats
                  .map((f) => f.split("/")[1].toUpperCase())
                  .join(", ")}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Minimum 100x100 pixels recommended
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!disabled && (
          <div className="flex flex-wrap justify-center gap-2">
            {!previewUrl && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={openFileDialog}
                disabled={isUploading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ImageIcon className="w-4 h-4" />
                )}
                {isUploading ? "Uploading..." : "Choose Image"}
              </motion.button>
            )}

            {uploadError && allowRetry && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={retryUpload}
                disabled={isUploading}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors duration-200">
                <RefreshCw className="w-4 h-4" />
                Retry
              </motion.button>
            )}
          </div>
        )}
      </div>

      {/* Status Messages */}
      <AnimatePresence mode="wait">
        {uploadError && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                Upload Error
              </p>
              <p className="text-sm text-red-700 dark:text-red-300 break-words">
                {uploadError}
              </p>
            </div>
            <button
              onClick={() => setUploadError(null)}
              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex-shrink-0"
              aria-label="Dismiss error">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {uploadSuccess && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                Upload Successful
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Your profile picture has been updated successfully!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(",")}
        onChange={handleFileInputChange}
        className="sr-only"
        disabled={disabled || isUploading || isRemoving}
        aria-hidden="true"
      />
    </div>
  );
};

export default ImageUpload;
