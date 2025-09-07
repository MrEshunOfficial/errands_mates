import React, { useCallback } from "react";
import { Camera } from "lucide-react";
import type { ProfilePicture } from "@/types/base.types";
import { useProfile } from "@/hooks/profiles/useProfile";
import ImageUpload, { type ImageUploadData } from "./avatar-upload";

interface ProfilePictureUpdateProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showLabel?: boolean;
  allowRemove?: boolean;
  onSuccess?: (profilePicture: ProfilePicture) => void;
  onError?: (error: string) => void;
}

export default function ProfilePictureUpdate({
  className = "",
  size = "lg",
  showLabel = true,
  allowRemove = true,
  onSuccess,
  onError,
}: ProfilePictureUpdateProps) {
  const { profile, updateProfilePicture, removeProfilePicture, isLoading } =
    useProfile();

  // Get current profile picture URL
  const currentProfilePicture = profile?.profilePicture?.url;

  const handleFileSelect = useCallback(
    async (file: File) => {
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
        onSuccess?.(profilePictureData);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to update profile picture";
        onError?.(errorMessage);
        throw error; // Re-throw to let ImageUpload handle the error state
      }
    },
    [updateProfilePicture, onSuccess, onError]
  );

  const handleRemove = useCallback(async () => {
    try {
      await removeProfilePicture();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to remove profile picture";
      onError?.(errorMessage);
      throw error; // Re-throw to let ImageUpload handle the error state
    }
  }, [removeProfilePicture, onError]);

  const handleUploadSuccess = useCallback(
    (data: ImageUploadData) => {
      const profilePictureData: ProfilePicture = {
        url: data.url,
        fileName: data.fileName,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        uploadedAt: data.uploadedAt,
      };
      onSuccess?.(profilePictureData);
    },
    [onSuccess]
  );

  return (
    <ImageUpload
      className={className}
      size={size}
      shape="circle"
      showLabel={showLabel}
      label="Profile Picture"
      description="Add a photo to help others recognize you. Your photo will be visible to other users."
      allowRemove={allowRemove}
      currentImageUrl={currentProfilePicture}
      placeholder="Click or drag & drop"
      maxSize={5 * 1024 * 1024} // 5MB
      allowedTypes={[
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ]}
      isLoading={isLoading}
      onFileSelect={handleFileSelect}
      onRemove={allowRemove ? handleRemove : undefined}
      onSuccess={handleUploadSuccess}
      onError={onError}
      uploadButtonText="Change picture"
      removeButtonText="Remove picture"
      dragAndDropText="Drop here"
      emptyStateIcon={
        <Camera className="w-6 h-6 text-gray-500 dark:text-gray-400" />
      }
    />
  );
}
