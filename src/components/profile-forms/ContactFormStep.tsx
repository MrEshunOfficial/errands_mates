"use client";

import React, { useState } from "react";
import { useFormContext, Controller, useFieldArray } from "react-hook-form";
import {
  formFieldConfigs,
  validateGhanaPhone,
} from "@/lib/schemas/profile.schema";
import type { UpdateProfileFormData } from "@/lib/schemas/profile.schema";
import { UserRole } from "@/types/api.types";

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

export default function ContactFormStep({
  className = "",
  onFieldChange,
}: ContactFormStepProps) {
  const {
    control,
    formState: { errors },
    watch,
  } = useFormContext<UpdateProfileFormData>();

  const [showPhoneHelper, setShowPhoneHelper] = useState(false);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "socialMediaHandles",
  });

  const contactDetails = watch("contactDetails") || {
    primaryContact: "",
    secondaryContact: "",
  };
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
    const primaryPhone = contactDetails.primaryContact ? 1 : 0;
    const secondaryPhone = contactDetails.secondaryContact ? 0.5 : 0;
    const socialCount = socialHandles.filter(
      (handle) => handle.nameOfSocial && handle.userName
    ).length;
    const socialScore = Math.min(socialCount * 0.3, 1);

    return ((primaryPhone + secondaryPhone + socialScore) / 2.5) * 100;
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
          name="contactDetails.primaryContact"
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
                  onFieldChange?.(
                    "contactDetails.primaryContact",
                    e.target.value
                  );
                }}
                className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                  errors.contactDetails?.primaryContact
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

              {errors.contactDetails?.primaryContact && (
                <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm mt-2">
                  <span>⚠️</span>
                  <span>{errors.contactDetails.primaryContact.message}</span>
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
          name="contactDetails.secondaryContact"
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
                  onFieldChange?.(
                    "contactDetails.secondaryContact",
                    e.target.value
                  );
                }}
                className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                  errors.contactDetails?.secondaryContact
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

              {errors.contactDetails?.secondaryContact && (
                <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm mt-2">
                  <span>⚠️</span>
                  <span>{errors.contactDetails.secondaryContact.message}</span>
                </div>
              )}

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Alternative contact number for backup communication
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

      {/* Contact Preferences */}
      <div className=" bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="text-start text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
          📞 Contact Preferences
        </h4>
        <div className="text-start text-sm text-blue-800 dark:text-blue-200 space-y-2">
          <p>
            • <strong>Phone calls:</strong> Fastest way to reach you for urgent
            matters
          </p>
          <p>
            • <strong>WhatsApp:</strong> Great for sharing photos and quick
            messages
          </p>
          <p>
            • <strong>Social media:</strong> Helps build trust and showcase your
            work
          </p>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Contact Section Progress
          </h4>
          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
            {Math.round(getCompletionPercentage())}%
          </span>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
          <div
            className="bg-blue-500 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${getCompletionPercentage()}%` }}
          ></div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">
              Primary Phone
            </span>
            <span
              className={
                validateGhanaPhone(contactDetails.primaryContact || "")
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }
            >
              {validateGhanaPhone(contactDetails.primaryContact || "")
                ? "✅ Valid"
                : "❌ Required"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">
              Secondary Phone
            </span>
            <span
              className={
                contactDetails.secondaryContact
                  ? "text-green-600 dark:text-green-400"
                  : "text-gray-400"
              }
            >
              {contactDetails.secondaryContact ? "✅ Added" : "⭕ Optional"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">
              Social Media
            </span>
            <span
              className={
                socialHandles.filter((h) => h.nameOfSocial && h.userName)
                  .length > 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-gray-400"
              }
            >
              {socialHandles.filter((h) => h.nameOfSocial && h.userName)
                .length > 0
                ? `✅ ${
                    socialHandles.filter((h) => h.nameOfSocial && h.userName)
                      .length
                  } added`
                : "⭕ Optional"}
            </span>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <span className="text-yellow-600 dark:text-yellow-400 text-lg">
            🔒
          </span>
          <div>
            <h4 className="text-start text-sm font-medium text-yellow-900 dark:text-yellow-100">
              Privacy & Security
            </h4>
            <div className="text-start text-sm text-yellow-800 dark:text-yellow-200 mt-1 space-y-1">
              <p>• Your phone numbers are verified and kept secure</p>
              <p>• Social media handles are public and help build trust</p>
              <p>• You can update or remove contact info anytime</p>
              <p>• We never share your personal details without permission</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tips for Service Providers */}
      {watch("role") === UserRole.PROVIDER && (
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <h4 className="text-start text-sm font-medium text-green-900 dark:text-green-100 mb-2">
            💼 Tips for Service Providers
          </h4>
          <ul className="text-start text-sm text-green-800 dark:text-green-200 space-y-1">
            <li>
              • Keep your phone number active - customers need to reach you
            </li>
            <li>• WhatsApp Business is great for sharing work photos</li>
            <li>• Social media profiles showcase your previous work</li>
            <li>• Quick response times lead to more bookings</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export type { ContactFormStepProps };
