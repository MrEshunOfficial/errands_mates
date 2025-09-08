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
import { FileReference, ServiceStatus } from "@/types/base.types";
import { useService } from "@/hooks/services/use-service";

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
  const { updateService, isSubmitting } = useService();
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Get current image URL - works for both existing services and new ones
  const currentImageUrl = service?.images?.[imageIndex]?.url;
  const hasImages = service?.images && service.images.length > 0;

  // Image compression utility
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

  // Validate image file
  const validateFile = useCallback((file: File): Promise<string | null> => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    // Basic validation
    if (file.size > maxSize) {
      return Promise.resolve("File size must be less than 10MB");
    }

    if (!allowedTypes.includes(file.type)) {
      return Promise.resolve("Only JPEG, PNG, and WebP images are allowed");
    }

    if (!file.type.startsWith("image/")) {
      return Promise.resolve("Please select a valid image file");
    }

    // Check image dimensions
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const { width, height } = img;

        // Minimum dimensions check
        if (width < 300 || height < 200) {
          resolve("Image must be at least 300x200 pixels for good quality");
          return;
        }

        // Maximum dimensions check
        if (width > 8000 || height > 8000) {
          resolve("Image dimensions should not exceed 8000x8000 pixels");
          return;
        }

        // Aspect ratio check
        const aspectRatio = width / height;
        if (aspectRatio < 0.3 || aspectRatio > 4) {
          resolve("Please use an image with a reasonable aspect ratio");
          return;
        }

        resolve(null); // No validation errors
      };

      img.onerror = () => {
        resolve("Invalid image file");
      };

      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Handle file processing and upload
  const handleFileSelect = useCallback(
    async (file: File) => {
      if (disabled || uploading || isSubmitting) return;

      // Validate file
      const validationError = await validateFile(file);
      if (validationError) {
        onError?.(validationError);
        toast.error(validationError);
        return;
      }

      try {
        setUploading(true);

        // Compress if needed
        let processedFile = file;
        if (file.size > 2 * 1024 * 1024) {
          // If larger than 2MB
          processedFile = await compressImage(file);
        }

        // For new services (no serviceId), return base64 for temporary storage
        if (!serviceId && !service?._id) {
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
          toast.success("Image selected successfully!");
          return;
        }

        // For existing services, upload to server
        const id = serviceId || service?._id?.toString();
        if (!id) {
          throw new Error("Service ID is required to upload images");
        }

        // Create FormData for upload
        const formData = new FormData();
        formData.append("image", processedFile);
        formData.append("serviceId", id);
        formData.append("imageIndex", imageIndex.toString());

        const response = await fetch("/api/services/upload-image", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to upload image");
        }

        const { fileReference } = await response.json();

        const newFileReference: FileReference = {
          url: fileReference.url,
          fileName: processedFile.name,
          fileSize: processedFile.size,
          mimeType: processedFile.type,
          uploadedAt: new Date(),
        };

        // Update service images array using the hook
        const updatedImages = [...(service?.images || [])];

        if (imageIndex < updatedImages.length) {
          updatedImages[imageIndex] = newFileReference;
        } else {
          // Fill gaps if needed
          while (updatedImages.length < imageIndex) {
            updatedImages.push({
              url: "",
              fileName: "",
              fileSize: 0,
              mimeType: "",
              uploadedAt: new Date(),
            });
          }
          updatedImages[imageIndex] = newFileReference;
        }

        // Update service using the hook
        await updateService(id, { images: updatedImages });
        onSuccess?.(newFileReference);
        toast.success("Service image updated successfully!");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to upload image";
        onError?.(errorMessage);
        toast.error(errorMessage);
        console.error("Image upload error:", error);
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
      serviceId,
      service?._id,
      service?.images,
      imageIndex,
      updateService,
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

  // Handle image removal
  const handleRemoveImage = useCallback(async () => {
    if (disabled || uploading || isSubmitting || !allowRemove) return;

    try {
      setUploading(true);

      // For new services (no serviceId), just call success with null
      if (!serviceId && !service?._id) {
        onSuccess?.(null);
        toast.success("Image removed successfully!");
        return;
      }

      // For existing services, update on server
      const id = serviceId || service?._id?.toString();
      if (!id || !currentImageUrl) {
        throw new Error("Service ID and image are required to remove image");
      }

      const updatedImages =
        service?.images?.filter((_, index) => index !== imageIndex) || [];

      // Update service using the hook
      await updateService(id, { images: updatedImages });

      // Optionally delete the file from storage
      try {
        await fetch("/api/services/delete-image", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serviceId: id,
            imageUrl: currentImageUrl,
          }),
        });
      } catch (deleteError) {
        console.warn("Failed to delete image file:", deleteError);
      }

      onSuccess?.(null);
      toast.success("Service image removed successfully!");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to remove image";
      onError?.(errorMessage);
      toast.error(errorMessage);
      console.error("Image removal error:", error);
    } finally {
      setUploading(false);
    }
  }, [
    disabled,
    uploading,
    isSubmitting,
    allowRemove,
    serviceId,
    service?._id,
    service?.images,
    currentImageUrl,
    imageIndex,
    updateService,
    onSuccess,
    onError,
  ]);

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

  // Get appropriate label based on whether it's the primary image or additional
  const getImageLabel = () => {
    if (imageIndex === 0) {
      return "Primary Service Image";
    }
    return `Service Image ${imageIndex + 1}`;
  };

  // Get total image count
  const getTotalImageCount = () => {
    return service?.images?.length || 0;
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
        onDrop={handleDrop}>
        {currentImageUrl ? (
          // Show current image with overlay controls
          <div className="w-full h-full relative">
            <Image
              src={currentImageUrl}
              alt={`Service Image ${imageIndex + 1}`}
              className="w-full h-full object-cover"
              fill
              unoptimized={currentImageUrl.startsWith("data:")} // For base64 images
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
                    className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50">
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
                    {uploading ? "Processing..." : "Loading..."}
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
                  {uploading ? "Processing..." : "Loading..."}
                </span>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-3">
                  <FolderOpen className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Upload {imageIndex === 0 ? "Primary" : "Additional"} Image
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Click or drag & drop
                </span>
                <span className="text-xs text-gray-400 mt-1">
                  PNG, JPG, WebP up to 10MB
                </span>
              </>
            )}
          </label>
        )}
      </div>

      {/* Show image count info if managing multiple images */}
      {allowMultiple && hasImages && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
          Image {imageIndex + 1} of {getTotalImageCount()}
          {getTotalImageCount() < 5 && " • You can add up to 5 images"}
        </div>
      )}

      {/* Service Image Guidelines */}
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

      {/* Service Status Warning - only show for existing services */}
      {serviceId && service && service.status === ServiceStatus.APPROVED && (
        <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-700 dark:text-amber-300">
            <strong>Note:</strong> Changing the images of an approved service
            may require re-approval depending on your platform&apos;s policies.
          </p>
        </div>
      )}
    </div>
  );
}
