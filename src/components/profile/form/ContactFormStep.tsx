"use client";

import React, { useState } from "react";
import { useFormContext, Controller, useFieldArray } from "react-hook-form";
import { UpdateUserProfileFormData } from "@/lib/utils/schemas/profile.schemas";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { InfoIcon } from "lucide-react";
import { ProfileContactTips } from "./extras/ProfileContactTips";
import { Button } from "../../ui/button";
interface ContactFormStepProps {
  className?: string;
  onFieldChange?: (field: string, value: unknown) => void;
}

// Popular social media platforms
const socialPlatforms = [
  { name: "WhatsApp", icon: "💬", placeholder: "+233XXXXXXXXX" },
  { name: "Facebook", icon: "👥", placeholder: "facebook.com/username" },
  { name: "Instagram", icon: "📸", placeholder: "@username" },
  { name: "Twitter/X", icon: "🐦", placeholder: "@username" },
  { name: "LinkedIn", icon: "💼", placeholder: "linkedin.com/in/username" },
  { name: "TikTok", icon: "🎵", placeholder: "@username" },
  { name: "YouTube", icon: "📺", placeholder: "@channelname" },
  { name: "Telegram", icon: "📱", placeholder: "@username" },
  { name: "Snapchat", icon: "👻", placeholder: "username" },
  { name: "Other", icon: "🔗", placeholder: "Platform name" },
];

// Form field configurations
const formFieldConfigs = {
  primaryContact: {
    placeholder: "+233XXXXXXXXX or 0XXXXXXXXX",
    maxLength: 15,
  },
  secondaryContact: {
    placeholder: "+233XXXXXXXXX or 0XXXXXXXXX (optional)",
    maxLength: 15,
  },
  businessEmail: {
    placeholder: "business@example.com (optional)",
    maxLength: 100,
  },
  socialMediaUsername: {
    maxLength: 100,
  },
};

// Ghana phone validation function
const validateGhanaPhone = (phone: string): boolean => {
  if (!phone) return false;
  const ghanaPhoneRegex = /^\+233[0-9]{9}$|^0[0-9]{9}$/;
  return ghanaPhoneRegex.test(phone.trim());
};

export default function ContactFormStep({
  className = "",
  onFieldChange,
}: ContactFormStepProps) {
  const {
    control,
    formState: { errors },
    watch,
  } = useFormContext<UpdateUserProfileFormData>();

  const [showPhoneHelper, setShowPhoneHelper] = useState(false);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "socialMediaHandles",
  });

  const primaryContact = watch("primaryContact") || "";
  const secondaryContact = watch("secondaryContact") || "";
  const businessEmail = watch("businessEmail") || "";
  const socialHandles = watch("socialMediaHandles") || [];

  // Add new social media handle
  const addSocialHandle = () => {
    if (fields.length < 5) {
      append({ nameOfSocial: "", userName: "" });
    }
  };

  // Format phone number for display
  const formatPhoneDisplay = (phone: string): string => {
    if (!phone) return "";
    if (phone.startsWith("+233")) {
      return phone.replace("+233", "+233 ");
    }
    if (phone.startsWith("0") && phone.length === 10) {
      return phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3");
    }
    return phone;
  };

  // Calculate completion percentage
  const getCompletionPercentage = (): number => {
    const primaryPhoneScore = validateGhanaPhone(primaryContact) ? 1 : 0;
    const secondaryPhoneScore = secondaryContact ? 0.3 : 0;
    const businessEmailScore = businessEmail ? 0.2 : 0;
    const socialCount = socialHandles.filter(
      (handle) => handle.nameOfSocial && handle.userName
    ).length;
    const socialScore = Math.min(socialCount * 0.1, 0.5);

    return (
      ((primaryPhoneScore +
        secondaryPhoneScore +
        businessEmailScore +
        socialScore) /
        2) *
      100
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Section Header */}
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Provide your contact details so customers can reach you easily. Your
          phone number is required for account verification.
        </p>
      </div>

      {/* Phone Numbers Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="text-md font-medium text-gray-900 dark:text-gray-100">
            Phone Numbers
          </h4>
          <button
            type="button"
            onClick={() => setShowPhoneHelper(!showPhoneHelper)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            {showPhoneHelper ? "Hide" : "Show"} format guide
          </button>
        </div>

        {showPhoneHelper && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              📞 Ghana Phone Number Formats
            </h5>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <p>
                <strong>International format:</strong> +233XXXXXXXXX (e.g.,
                +233244123456)
              </p>
              <p>
                <strong>Local format:</strong> 0XXXXXXXXX (e.g., 0244123456)
              </p>
              <p>
                <strong>Supported networks:</strong> MTN, Vodafone, AirtelTigo,
                Glo
              </p>
            </div>
          </div>
        )}

        {/* Primary Contact */}
        <Controller
          name="primaryContact"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Primary Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                {...field}
                type="tel"
                placeholder={formFieldConfigs.primaryContact.placeholder}
                value={field.value || ""}
                onChange={(e) => {
                  field.onChange(e);
                  onFieldChange?.("primaryContact", e.target.value);
                }}
                className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                  errors.primaryContact
                    ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-800"
                    : validateGhanaPhone(field.value || "") && field.value
                    ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-800"
                    : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800"
                } text-gray-900 dark:text-gray-100`}
              />

              {/* Validation feedback */}
              {field.value && (
                <div className="mt-2 text-sm">
                  {validateGhanaPhone(field.value) ? (
                    <div className="flex items-center text-green-600 dark:text-green-400">
                      <span className="mr-2">✅</span>
                      Valid Ghana phone number:{" "}
                      {formatPhoneDisplay(field.value)}
                    </div>
                  ) : (
                    <div className="flex items-center text-orange-600 dark:text-orange-400">
                      <span className="mr-2">⚠️</span>
                      Please use Ghana phone format
                    </div>
                  )}
                </div>
              )}

              {errors.primaryContact && (
                <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm mt-2">
                  <span>⚠️</span>
                  <span>{errors.primaryContact.message}</span>
                </div>
              )}

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                This will be your main contact number for customers
              </p>
            </div>
          )}
        />

        {/* Secondary Contact */}
        <Controller
          name="secondaryContact"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Secondary Phone Number (Optional)
              </label>
              <input
                {...field}
                type="tel"
                placeholder={formFieldConfigs.secondaryContact.placeholder}
                value={field.value || ""}
                onChange={(e) => {
                  field.onChange(e);
                  onFieldChange?.("secondaryContact", e.target.value);
                }}
                className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                  errors.secondaryContact
                    ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-800"
                    : field.value && validateGhanaPhone(field.value)
                    ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-800"
                    : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800"
                } text-gray-900 dark:text-gray-100`}
              />

              {/* Validation feedback */}
              {field.value && (
                <div className="mt-2 text-sm">
                  {validateGhanaPhone(field.value) ? (
                    <div className="flex items-center text-green-600 dark:text-green-400">
                      <span className="mr-2">✅</span>
                      Valid Ghana phone number:{" "}
                      {formatPhoneDisplay(field.value)}
                    </div>
                  ) : (
                    <div className="flex items-center text-orange-600 dark:text-orange-400">
                      <span className="mr-2">⚠️</span>
                      Please use Ghana phone format
                    </div>
                  )}
                </div>
              )}

              {errors.secondaryContact && (
                <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm mt-2">
                  <span>⚠️</span>
                  <span>{errors.secondaryContact.message}</span>
                </div>
              )}

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Alternative contact number for backup communication
              </p>
            </div>
          )}
        />

        {/* Business Email */}
        <Controller
          name="businessEmail"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Business Email (Optional)
              </label>
              <input
                {...field}
                type="email"
                placeholder={formFieldConfigs.businessEmail.placeholder}
                value={field.value || ""}
                onChange={(e) => {
                  field.onChange(e);
                  onFieldChange?.("businessEmail", e.target.value);
                }}
                className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                  errors.businessEmail
                    ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-800"
                    : field.value && field.value.includes("@")
                    ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-800"
                    : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800"
                } text-gray-900 dark:text-gray-100`}
              />

              {errors.businessEmail && (
                <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm mt-2">
                  <span>⚠️</span>
                  <span>{errors.businessEmail.message}</span>
                </div>
              )}

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Professional email for business communications
              </p>
            </div>
          )}
        />
      </div>

      {/* Social Media Handles Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-gray-100">
              Social Media Handles (Optional)
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Add your social media profiles to help customers connect with you
            </p>
          </div>
          {fields.length < 5 && (
            <button
              type="button"
              onClick={addSocialHandle}
              className="px-4 py-2 text-sm bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              <span>➕</span>
              <span>Add Social Media</span>
            </button>
          )}
        </div>

        {fields.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
            <span className="text-4xl mb-3 block">📱</span>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              No social media handles added yet
            </p>
            <button
              type="button"
              onClick={addSocialHandle}
              className="px-4 py-2 text-sm bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Add Your First Social Media Handle
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Social Media Handle #{index + 1}
                  </h5>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm"
                  >
                    🗑️ Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Platform Selection */}
                  <Controller
                    name={`socialMediaHandles.${index}.nameOfSocial`}
                    control={control}
                    render={({ field: platformField }) => (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Platform
                        </label>
                        <select
                          {...platformField}
                          value={platformField.value || ""}
                          onChange={(e) => {
                            platformField.onChange(e);
                            onFieldChange?.(
                              `socialMediaHandles.${index}.nameOfSocial`,
                              e.target.value
                            );
                          }}
                          className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800"
                        >
                          <option value="">Select platform</option>
                          {socialPlatforms.map((platform) => (
                            <option key={platform.name} value={platform.name}>
                              {platform.icon} {platform.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  />

                  {/* Username Input */}
                  <Controller
                    name={`socialMediaHandles.${index}.userName`}
                    control={control}
                    render={({ field: usernameField }) => {
                      const selectedPlatform = socialPlatforms.find(
                        (p) =>
                          p.name ===
                          watch(`socialMediaHandles.${index}.nameOfSocial`)
                      );

                      return (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Username/Handle
                          </label>
                          <input
                            {...usernameField}
                            type="text"
                            placeholder={
                              selectedPlatform?.placeholder || "Enter username"
                            }
                            maxLength={
                              formFieldConfigs.socialMediaUsername.maxLength
                            }
                            value={usernameField.value || ""}
                            onChange={(e) => {
                              usernameField.onChange(e);
                              onFieldChange?.(
                                `socialMediaHandles.${index}.userName`,
                                e.target.value
                              );
                            }}
                            className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800"
                          />
                        </div>
                      );
                    }}
                  />
                </div>

                {/* Field-specific errors */}
                {(errors.socialMediaHandles?.[index]?.nameOfSocial ||
                  errors.socialMediaHandles?.[index]?.userName) && (
                  <div className="mt-2 space-y-1">
                    {errors.socialMediaHandles?.[index]?.nameOfSocial && (
                      <div className="text-xs text-red-600 dark:text-red-400">
                        ⚠️{" "}
                        {
                          errors.socialMediaHandles[index]?.nameOfSocial
                            ?.message
                        }
                      </div>
                    )}
                    {errors.socialMediaHandles?.[index]?.userName && (
                      <div className="text-xs text-red-600 dark:text-red-400">
                        ⚠️ {errors.socialMediaHandles[index]?.userName?.message}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {fields.length > 0 && fields.length < 5 && (
          <button
            type="button"
            onClick={addSocialHandle}
            className="w-full py-3 border-2 border-dashed border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors flex items-center justify-center space-x-2"
          >
            <span>➕</span>
            <span>Add Another Social Media ({fields.length}/5)</span>
          </button>
        )}
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-1"
          >
            <InfoIcon className=" text-blue-600 dark:text-blue-400" />
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Check Out tips
            </h4>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full bg-accent p-0 border-none">
          <ProfileContactTips
            getCompletionPercentage={getCompletionPercentage}
            primaryContact={primaryContact}
            secondaryContact={secondaryContact}
            businessEmail={businessEmail}
            socialHandles={socialHandles}
            validateGhanaPhone={validateGhanaPhone}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export type { ContactFormStepProps };
