"use client";

import React, { useState, useEffect } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";

import {
  CheckCircle,
  AlertCircle,
  User,
  Users,
  Eye,
  EyeOff,
  InfoIcon,
} from "lucide-react";
import { UserRole, ProfilePicture } from "@/types";
import {
  UpdateUserProfileFormData,
  userFormFieldConfigs as formFieldConfigs,
} from "@/lib/utils/schemas/profile.schemas";

// Define the expected form profile picture type based on the form schema
type FormProfilePicture = {
  url: string;
  fileName: string;
  fileSize?: number;
  mimeType?: "image/jpeg" | "image/png" | "image/webp" | "image/jpg";
  uploadedAt?: Date;
};

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ProfileRoleTips } from "./extras/show-tips";
import ProfilePictureUpload from "./avatar-upload";

interface BasicInfoFormStepProps {
  className?: string;
  onFieldChange?: (field: string, value: unknown) => void;
  onProfilePictureUpload?: (file: File) => Promise<ProfilePicture>;
  onProfilePictureRemove?: () => Promise<void>;
}

const roleOptions = [
  {
    value: UserRole.CUSTOMER,
    label: "Customer (or Client)",
    shortLabel: "Customer",
    description: "I'm looking for services and want to book appointments",

    detailedDescription:
      "Perfect for individuals who need services like cleaning, repairs, tutoring, etc.",
    icon: "🛒",
    iconComponent: User,
    benefits: [
      "Browse and contact service providers directly",
      "Rate and review service providers",
      "Track your request history (Premium)",
      "Get personalized recommendations (Premium)",
      "Make direct request and payment (Premium)",
    ],
    color: "blue",
  },
  {
    value: UserRole.PROVIDER,
    label: "Service Provider",
    shortLabel: "Provider",
    description: "I offer services to clients and want to expand my business.",
    detailedDescription:
      "Ideal for professionals offering services like cleaning, tutoring, repairs, etc.",
    icon: "🔧",
    iconComponent: Users,
    benefits: [
      "Create and manage service listings",
      "Build your reputation with reviews",
      "Accept request and payments (Premium)",
      "Access business analytics and insights (Premium)",
      "Client Recommendation and easy Matching (Premium)",
    ],
    color: "green",
  },
];

export default function BasicInfoFormStep({
  className = "",
  onFieldChange,
  onProfilePictureUpload,
  onProfilePictureRemove,
}: BasicInfoFormStepProps) {
  const {
    control,
    formState: { errors },
    watch,
    setValue,
    clearErrors,
  } = useFormContext<UpdateUserProfileFormData>();

  const selectedRole = watch("role");
  const bioValue = watch("bio") || "";
  const isActiveInMarketplace = watch("isActiveInMarketplace") || false;
  const currentProfilePicture = watch("profilePicture");

  const [showBioPreview, setShowBioPreview] = useState(false);
  const [bioFocused, setBioFocused] = useState(false);
  const [showRoleDetails, setShowRoleDetails] = useState<UserRole | null>(null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [profilePictureError, setProfilePictureError] = useState<string | null>(
    null
  );
  const [completionStatus, setCompletionStatus] = useState({
    role: false,
    bio: false,
    profilePicture: false,
  });

  // Update completion status
  useEffect(() => {
    setCompletionStatus({
      role: !!selectedRole,
      bio: !!bioValue && bioValue.trim().length >= 10,
      profilePicture: !!currentProfilePicture,
    });
  }, [selectedRole, bioValue, currentProfilePicture]);

  const handleRoleSelect = (role: UserRole) => {
    setValue("role", role, { shouldValidate: true, shouldDirty: true });
    clearErrors("role");
    onFieldChange?.("role", role);
    setShowRoleDetails(null);
  };

  const handleBioChange = (value: string) => {
    setValue("bio", value, { shouldValidate: true, shouldDirty: true });
    if (value.trim() && errors.bio) {
      clearErrors("bio");
    }
    onFieldChange?.("bio", value);
  };

  const handleMarketplaceToggle = (checked: boolean) => {
    setValue("isActiveInMarketplace", checked, {
      shouldValidate: true,
      shouldDirty: true,
    });
    onFieldChange?.("isActiveInMarketplace", checked);
  };

  // Helper function to convert ProfilePicture to FormProfilePicture
  const convertToFormProfilePicture = (
    profilePicture: ProfilePicture
  ): FormProfilePicture => {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg",
    ] as const;
    type AllowedMimeType = (typeof allowedMimeTypes)[number];

    const isValidMimeType = (
      mimeType: string | undefined
    ): mimeType is AllowedMimeType => {
      return (
        mimeType !== undefined &&
        allowedMimeTypes.includes(mimeType as AllowedMimeType)
      );
    };

    return {
      url: profilePicture.url,
      fileName: profilePicture.fileName,
      fileSize: profilePicture.fileSize,
      mimeType: isValidMimeType(profilePicture.mimeType)
        ? profilePicture.mimeType
        : undefined,
      uploadedAt: profilePicture.uploadedAt,
    };
  };

  const handleProfilePictureSelect = async (file: File) => {
    if (!onProfilePictureUpload) {
      setProfilePictureError("Profile picture upload not configured");
      return;
    }

    setIsUploadingPicture(true);
    setProfilePictureError(null);

    try {
      const uploadedPicture = await onProfilePictureUpload(file);

      // Convert to form-compatible type
      const formattedPicture = convertToFormProfilePicture(uploadedPicture);

      setValue("profilePicture", formattedPicture, {
        shouldValidate: true,
        shouldDirty: true,
      });
      onFieldChange?.("profilePicture", formattedPicture);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to upload profile picture";
      setProfilePictureError(errorMessage);
    } finally {
      setIsUploadingPicture(false);
    }
  };

  const handleProfilePictureRemove = async () => {
    if (!onProfilePictureRemove) {
      return;
    }

    setIsUploadingPicture(true);
    setProfilePictureError(null);

    try {
      await onProfilePictureRemove();
      setValue("profilePicture", undefined, {
        shouldValidate: true,
        shouldDirty: true,
      });
      onFieldChange?.("profilePicture", undefined);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to remove profile picture";
      setProfilePictureError(errorMessage);
    } finally {
      setIsUploadingPicture(false);
    }
  };

  const getBioStrength = (
    text: string
  ): { strength: string; color: string; percentage: number } => {
    const length = text.trim().length;
    if (length < 10)
      return { strength: "Too short", color: "red", percentage: 20 };
    if (length < 50)
      return { strength: "Basic", color: "yellow", percentage: 40 };
    if (length < 150)
      return { strength: "Good", color: "blue", percentage: 70 };
    return { strength: "Excellent", color: "green", percentage: 100 };
  };

  const selectedRoleOption = roleOptions.find(
    (option) => option.value === selectedRole
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Profile Picture Section */}
      <div className="flex justify-center">
        <ProfilePictureUpload
          currentPicture={currentProfilePicture}
          onImageSelect={handleProfilePictureSelect}
          onImageRemove={handleProfilePictureRemove}
          isUploading={isUploadingPicture}
          error={profilePictureError}
          size="xl"
          showPreview={true}
          className="w-full"
        />
      </div>

      {/* Role Selection */}
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between p-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
              How will you be using the platform?
              <span className="text-red-500">*</span>
            </h3>

            {/* Bio writing tips */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center justify-start gap-1"
                >
                  <InfoIcon className=" text-blue-600 dark:text-blue-400" />
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Check Out
                  </h4>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-3/4 bg-accent p-0 border-none">
                <ProfileRoleTips
                  selectedRoleOption={selectedRoleOption}
                  selectedRole={selectedRole}
                  completionStatus={completionStatus}
                />
              </PopoverContent>
            </Popover>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Choose your primary role. You can change this later in your
            settings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roleOptions.map((option) => (
            <motion.div
              key={option.value}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="relative"
            >
              <div
                onClick={() => handleRoleSelect(option.value)}
                onMouseEnter={() => setShowRoleDetails(option.value)}
                onMouseLeave={() => setShowRoleDetails(null)}
                className={`relative cursor-pointer rounded-xl border-2 p-6 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${
                  selectedRole === option.value
                    ? option.color === "blue"
                      ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-950 ring-2 ring-blue-200 dark:ring-blue-800 shadow-lg"
                      : "border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-950 ring-2 ring-green-200 dark:ring-green-800 shadow-lg"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-750"
                }`}
              >
                {/* Selection indicator */}
                <div className="absolute top-4 right-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedRole === option.value
                        ? option.color === "blue"
                          ? "border-blue-500 bg-blue-500"
                          : "border-green-500 bg-green-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {selectedRole === option.value && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2 h-2 bg-white rounded-full"
                      />
                    )}
                  </motion.div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${
                        selectedRole === option.value
                          ? option.color === "blue"
                            ? "bg-blue-100 dark:bg-blue-900/50"
                            : "bg-green-100 dark:bg-green-900/50"
                          : "bg-gray-100 dark:bg-gray-700"
                      }`}
                    >
                      {option.icon}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      {option.label}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
                      {option.description}
                    </p>

                    {/* Benefits preview */}
                    {showRoleDetails === option.value && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
                      >
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                          What you can do:
                        </p>
                        <ul className="space-y-1">
                          {option.benefits.map((benefit, index) => (
                            <li
                              key={index}
                              className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400"
                            >
                              <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {errors.role && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errors.role.message}</span>
          </motion.div>
        )}

        {/* Marketplace Participation Toggle (for providers) */}
        <AnimatePresence>
          {selectedRole === UserRole.PROVIDER && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 pt-1">
                  <input
                    type="checkbox"
                    id="marketplace-toggle"
                    checked={isActiveInMarketplace}
                    onChange={(e) => handleMarketplaceToggle(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="marketplace-toggle"
                    className="text-sm font-medium text-blue-900 dark:text-blue-100 cursor-pointer"
                  >
                    Join the Service Marketplace
                  </label>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Enable this to make your services discoverable by customers
                    and start accepting bookings immediately.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bio Section */}
      <div className="flex flex-col items-start justify-start gap-3 text-start">
        <div>
          <label
            htmlFor="bio"
            className="flex text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 items-center gap-2"
          >
            <InfoIcon className="w-5 h-5" />
            Tell us about yourself
          </label>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Share a brief description about yourself, your interests, or your
            expertise. This helps others understand who you are.
          </p>
        </div>

        <Controller
          name="bio"
          control={control}
          render={({ field }) => (
            <div className="space-y-3 w-full">
              <div className="relative">
                <textarea
                  {...field}
                  id="bio"
                  rows={formFieldConfigs.bio.rows}
                  maxLength={formFieldConfigs.bio.maxLength}
                  placeholder={
                    selectedRole === UserRole.PROVIDER
                      ? "e.g., I'm a professional cleaner with 5+ years of experience. I provide reliable and thorough cleaning services for homes and offices. I take pride in attention to detail and customer satisfaction..."
                      : "e.g., I'm a busy professional looking for reliable home services. I value quality work and good communication. I enjoy spending time with family when I'm not working..."
                  }
                  value={field.value || ""}
                  onChange={(e) => {
                    field.onChange(e);
                    handleBioChange(e.target.value);
                  }}
                  onFocus={() => setBioFocused(true)}
                  onBlur={() => setBioFocused(false)}
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 resize-none ${
                    errors.bio
                      ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-800 focus:border-red-400 dark:focus:border-red-600"
                      : bioFocused
                      ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-950 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800"
                      : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500"
                  } text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400`}
                />

                {/* Character counter and strength indicator */}
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  {bioValue.length > 0 && (
                    <div
                      className={`text-xs px-2 py-1 rounded-full ${
                        getBioStrength(bioValue).color === "red"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                          : getBioStrength(bioValue).color === "yellow"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                          : getBioStrength(bioValue).color === "blue"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                          : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                      }`}
                    >
                      {getBioStrength(bioValue).strength}
                    </div>
                  )}
                  <div className="text-xs text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-sm border border-gray-200 dark:border-gray-600">
                    {bioValue.length}/{formFieldConfigs.bio.maxLength}
                  </div>
                </div>

                {/* Preview toggle */}
                {bioValue.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowBioPreview(!showBioPreview)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                    title={showBioPreview ? "Hide preview" : "Show preview"}
                  >
                    {showBioPreview ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>

              {/* Bio strength progress bar */}
              {bioValue.length > 0 && (
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <motion.div
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      getBioStrength(bioValue).color === "red"
                        ? "bg-red-400"
                        : getBioStrength(bioValue).color === "yellow"
                        ? "bg-yellow-400"
                        : getBioStrength(bioValue).color === "blue"
                        ? "bg-blue-400"
                        : "bg-green-400"
                    }`}
                    initial={{ width: 0 }}
                    animate={{
                      width: `${getBioStrength(bioValue).percentage}%`,
                    }}
                  />
                </div>
              )}

              {/* Bio Preview */}
              <AnimatePresence>
                {showBioPreview && bioValue.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Preview:
                    </h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                      {bioValue}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {errors.bio && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errors.bio.message}</span>
                </motion.div>
              )}
            </div>
          )}
        />
      </div>
    </div>
  );
}

// Export types for better TypeScript integration
export type { BasicInfoFormStepProps };
