import React, { useCallback, useState } from "react";
import {
  FolderOpen,
  Image as ImageIcon,
  Upload,
  X,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Service } from "@/types/service.types";
import { ServiceStatus } from "@/types/base.types";
import { FileReference } from "@/lib/api/categories/categoryImage.api";
import { useUserService } from "@/hooks/public/services/use-service";

interface ServiceImageUploadProps {
  serviceId?: string;
  service?: Service | null;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  shape?: "circle" | "square" | "rounded";
  showLabel?: boolean;
  allowRemove?: boolean;
  onSuccess?: (imageData: FileReference | null) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  imageIndex?: number;
  allowMultiple?: boolean;
}

export default function ServiceImageUpload({
  serviceId,
  service,
  className = "",
  size = "lg",
  shape = "rounded",
  showLabel = true,
  allowRemove = true,
  onSuccess,
  onError,
  disabled = false,
  imageIndex = 0,
  allowMultiple = false,
}: ServiceImageUploadProps) {
  const {
    isSubmitting,
    currentService,
    error: serviceError,
  } = useUserService();
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const serviceToUse = service || currentService;
  const currentImageUrl =
    previewImage || serviceToUse?.images?.[imageIndex]?.url;
  const hasImages = serviceToUse?.images && serviceToUse.images.length > 0;

  const compressImage = useCallback(
    (file: File, maxWidth = 1200, quality = 0.8): Promise<File> => {
      return new Promise((resolve) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new window.Image();

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

  const validateFile = useCallback((file: File): Promise<string | null> => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (file.size > maxSize) {
      return Promise.resolve("File size must be less than 10MB");
    }

    if (!allowedTypes.includes(file.type)) {
      return Promise.resolve("Only JPEG, PNG, and WebP images are allowed");
    }

    if (!file.type.startsWith("image/")) {
      return Promise.resolve("Please select a valid image file");
    }

    return Promise.resolve(null);
  }, []);

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (disabled || uploading || isSubmitting) return;

      const validationError = await validateFile(file);
      if (validationError) {
        onError?.(validationError);
        toast.error(validationError);
        return;
      }

      try {
        setUploading(true);
        const fileUrl = URL.createObjectURL(file);
        setPreviewImage(fileUrl);

        let processedFile = file;
        if (file.size > 2 * 1024 * 1024) {
          processedFile = await compressImage(file);
        }

        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(processedFile);
        });

        const imageData: FileReference = {
          url: base64,
          fileName: processedFile.name,
          fileSize: processedFile.size,
          mimeType: processedFile.type,
          uploadedAt: new Date(),
        };

        onSuccess?.(imageData);
        URL.revokeObjectURL(fileUrl);
        setPreviewImage(base64);
        toast.success("Image selected successfully!");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to process image";
        onError?.(errorMessage);
        toast.error(errorMessage);
        console.error("Image processing error:", error);
        setPreviewImage(null);
      } finally {
        setUploading(false);
      }
    },
    [
      disabled,
      uploading,
      isSubmitting,
      validateFile,
      compressImage,
      onSuccess,
      onError,
    ]
  );

  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
      event.target.value = "";
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled && !uploading && !isSubmitting) {
        setDragActive(true);
      }
    },
    [disabled, uploading, isSubmitting]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);

      if (disabled || uploading || isSubmitting) return;

      const files = Array.from(e.dataTransfer.files);
      const imageFile = files.find((file) => file.type.startsWith("image/"));

      if (imageFile) {
        handleFileSelect(imageFile);
      } else {
        onError?.("Please drop an image file");
        toast.error("Please drop an image file");
      }
    },
    [disabled, uploading, isSubmitting, handleFileSelect, onError]
  );

  const handleRemoveImage = useCallback(async () => {
    if (disabled || uploading || isSubmitting || !allowRemove) return;

    try {
      setUploading(true);
      setPreviewImage(null);
      onSuccess?.(null);
      toast.success("Image removed successfully!");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to remove image";
      onError?.(errorMessage);
      toast.error(errorMessage);
      console.error("Image removal error:", error);
    } finally {
      setUploading(false);
    }
  }, [disabled, uploading, isSubmitting, allowRemove, onSuccess, onError]);

  const sizeClasses = {
    sm: "w-24 h-24",
    md: "w-32 h-32",
    lg: "w-48 h-48",
    xl: "w-64 h-64",
  };

  const shapeClasses = {
    circle: "rounded-full",
    square: "rounded-none",
    rounded: "rounded-xl",
  };

  const getImageLabel = () => {
    if (imageIndex === 0) {
      return "Primary Service Image";
    }
    return `Service Image ${imageIndex + 1}`;
  };

  const getTotalImageCount = () => {
    return serviceToUse?.images?.length || 0;
  };

  const isLoadingState = isSubmitting || uploading;

  return (
    <div className={`space-y-4 ${className}`}>
      {showLabel && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            {getImageLabel()}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {imageIndex === 0
              ? "Add a high-quality primary image to showcase your service"
              : "Add an additional image to showcase your service"}
          </p>
        </div>
      )}

      {serviceError && (
        <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-xs text-red-700 dark:text-red-300">
            {serviceError}
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
        } ${shapeClasses[shape]} overflow-hidden ${
          disabled || isLoadingState ? "opacity-75" : ""
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {currentImageUrl ? (
          <div className="w-full h-full relative">
            <Image
              src={currentImageUrl}
              alt={`Service Image ${imageIndex + 1}`}
              className="w-full h-full object-cover"
              fill
              unoptimized={currentImageUrl.startsWith("data:")}
              priority={imageIndex === 0}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100">
              <div className="flex gap-2">
                <label
                  className={`cursor-pointer ${
                    isLoadingState ? "pointer-events-none" : ""
                  }`}
                >
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
                    className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </Button>
                )}
              </div>
            </div>
            {isLoadingState && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {uploading ? "Processing..." : "Loading..."}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <label
            className={`cursor-pointer w-full h-full flex flex-col items-center justify-center p-4 ${
              isLoadingState ? "pointer-events-none" : ""
            }`}
          >
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
                <span className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  {uploading ? "Processing image..." : "Loading..."}
                </span>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-3">
                  <FolderOpen className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-center">
                  Upload {imageIndex === 0 ? "Primary" : "Additional"} Image
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Click or drag & drop
                </span>
                <span className="text-xs text-gray-400 mt-1 text-center">
                  PNG, JPG, WebP up to 10MB
                </span>
              </>
            )}
          </label>
        )}
      </div>

      {allowMultiple && hasImages && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
          Image {imageIndex + 1} of {getTotalImageCount()}
          {getTotalImageCount() < 5 && " • You can add up to 5 images"}
        </div>
      )}

      {showLabel && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
            Image Guidelines
          </h4>
          <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <li>
              • Use high-quality, professional images that represent your
              service
            </li>
            <li>• Minimum resolution: 300x200 pixels</li>
            <li>• Supported formats: JPEG, PNG, WebP</li>
            <li>• Maximum file size: 10MB</li>
            <li>• Avoid images with excessive text or watermarks</li>
            {imageIndex === 0 && (
              <li>
                • The primary image will be featured prominently in search
                results
              </li>
            )}
          </ul>
        </div>
      )}

      {serviceId &&
        serviceToUse &&
        serviceToUse.status === ServiceStatus.APPROVED && (
          <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-700 dark:text-amber-300">
              <strong>Note:</strong> Changing the images of an approved service
              may require re-approval.
            </p>
          </div>
        )}
    </div>
  );
}
