"use client";

import { idType, UserRole } from "@/types";
import React from "react";
import { useFormContext } from "react-hook-form";
import {
  UpdateUserProfileFormData,
  calculateUserProfileCompleteness,
} from "@/lib/utils/schemas/profile.schemas";
import { FieldErrors, FieldError } from "react-hook-form";

// Add this type definition at the top of ReviewFormStep.tsx
type ProfileSection = "basic-info" | "location" | "contact" | "identification";

interface ReviewFormStepProps {
  className?: string;
  onEdit?: (section: ProfileSection) => void;
  isSubmitting?: boolean;
}

export const REVIEW_SECTIONS = {
  BASIC_INFO: "basic-info",
  LOCATION: "location",
  CONTACT: "contact",
  IDENTIFICATION: "identification",
} as const;

type ReviewSection = (typeof REVIEW_SECTIONS)[keyof typeof REVIEW_SECTIONS];

// Consolidated configuration for sections
const SECTION_CONFIG = {
  [REVIEW_SECTIONS.BASIC_INFO]: {
    icon: "👤",
    title: "Basic Information",
    description: "Your profile basics",
    fields: ["role", "bio"],
    getContent: (data: UpdateUserProfileFormData) => ({
      Role: data?.role
        ? {
            [UserRole.CUSTOMER]: "Customer",
            [UserRole.PROVIDER]: "Service Provider",
          }[data.role]
        : "Not selected",
      Bio: data?.bio?.trim() || "No bio provided",
    }),
  },
  [REVIEW_SECTIONS.LOCATION]: {
    icon: "📍",
    title: "Location Details",
    description: "Where you're located",
    fields: [
      "ghanaPostGPS",
      "region",
      "city",
      "nearbyLandmark",
      "gpsCoordinates",
    ],
    getContent: (data: UpdateUserProfileFormData) => ({
      "Ghana Post GPS": data?.ghanaPostGPS || "Not provided",
      Region: data?.region || "Not specified",
      City: data?.city || "Not specified",
      "Nearby Landmark": data?.nearbyLandmark || "Not provided",
      ...(data?.gpsCoordinates && {
        "GPS Coordinates": `${data.gpsCoordinates.latitude?.toFixed(
          6
        )}, ${data.gpsCoordinates.longitude?.toFixed(6)}`,
      }),
    }),
  },
  [REVIEW_SECTIONS.CONTACT]: {
    icon: "📞",
    title: "Contact Information",
    description: "How customers can reach you",
    fields: [
      "primaryContact",
      "secondaryContact",
      "businessEmail",
      "socialMediaHandles",
    ],
    getContent: (data: UpdateUserProfileFormData) => ({
      "Primary Phone": data?.primaryContact
        ? formatPhone(data.primaryContact)
        : "Not provided",
      ...(data?.secondaryContact && {
        "Secondary Phone": formatPhone(data.secondaryContact),
      }),
      ...(data?.businessEmail && { "Business Email": data.businessEmail }),
      ...(data?.socialMediaHandles?.length && {
        "Social Media": data.socialMediaHandles
          .filter((h) => h.nameOfSocial && h.userName)
          .map((h) => `${h.nameOfSocial}: ${h.userName}`)
          .join(", "),
      }),
    }),
  },
  [REVIEW_SECTIONS.IDENTIFICATION]: {
    icon: "🆔",
    title: "Identity Verification",
    description: "Optional identity verification",
    fields: ["idType", "idNumber"],
    getContent: (data: UpdateUserProfileFormData) => {
      if (!data?.idType) return { Status: "No identification provided" };

      const idLabels = {
        [idType.NATIONAL_ID]: "National ID",
        [idType.VOTERS_ID]: "Voter's ID",
        [idType.PASSPORT]: "Passport",
        [idType.DRIVERS_LICENSE]: "Driver's License",
        [idType.NHIS]: "NHIS",
        [idType.OTHER]: "Other",
      };

      return {
        "ID Type": idLabels[data.idType],
        "ID Number": data?.idNumber || "Not provided",
      };
    },
  },
} as const;

// Utility functions
const formatPhone = (phone: string): string => {
  if (!phone) return "";
  if (phone.startsWith("+233")) return phone.replace("+233", "+233 ");
  if (phone.startsWith("0") && phone.length === 10) {
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3");
  }
  return phone;
};

const getSectionErrors = (
  section: ReviewSection,
  errors: FieldErrors
): string[] => {
  const fieldMap: Record<ReviewSection, string[]> = {
    [REVIEW_SECTIONS.BASIC_INFO]: ["role", "bio"],
    [REVIEW_SECTIONS.LOCATION]: [
      "ghanaPostGPS",
      "region",
      "city",
      "nearbyLandmark",
    ],
    [REVIEW_SECTIONS.CONTACT]: [
      "primaryContact",
      "secondaryContact",
      "businessEmail",
      "socialMediaHandles",
    ],
    [REVIEW_SECTIONS.IDENTIFICATION]: ["idType", "idNumber"],
  };

  return fieldMap[section]
    .map((field) => {
      let error: unknown;

      if (field.includes(".")) {
        error = field
          .split(".")
          .reduce<unknown>(
            (obj, key) =>
              typeof obj === "object" && obj !== null
                ? (obj as Record<string, unknown>)[key]
                : undefined,
            errors
          );
      } else {
        error = errors[field];
      }

      // Now narrow: we only care if it looks like a FieldError
      if (error && typeof error === "object" && "message" in error) {
        return (error as FieldError).message;
      }

      return undefined;
    })
    .filter((msg): msg is string => Boolean(msg));
};

const getStatusBadge = (hasErrors: boolean, hasContent: boolean) => {
  if (hasErrors) return <StatusBadge type="error" />;
  if (hasContent) return <StatusBadge type="complete" />;
  return <StatusBadge type="empty" />;
};

const StatusBadge = ({ type }: { type: "complete" | "error" | "empty" }) => {
  const variants = {
    complete:
      "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
    error: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
    empty: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
  };

  const labels = {
    complete: "✅ Complete",
    error: "❌ Error",
    empty: "⭕ Empty",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${variants[type]}`}
    >
      {labels[type]}
    </span>
  );
};

export default function ReviewFormStep({
  className = "",
  onEdit,
  isSubmitting = false,
}: ReviewFormStepProps) {
  const {
    watch,
    formState: { errors },
  } = useFormContext<UpdateUserProfileFormData>();
  const formData = watch();
  const completeness = calculateUserProfileCompleteness(
    formData || {}
  ).percentage;

  const renderSection = (sectionKey: ReviewSection) => {
    const config = SECTION_CONFIG[sectionKey];
    const sectionErrors = getSectionErrors(sectionKey, errors);
    const content = config.getContent(formData);
    const hasContent = Object.values(content).some(
      (value) =>
        value &&
        value !== "Not provided" &&
        value !== "Not specified" &&
        value !== "No identification provided"
    );

    return (
      <div
        key={sectionKey}
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
      >
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{config.icon}</span>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                {config.title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {config.description}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusBadge(sectionErrors.length > 0, hasContent)}
            <button
              type="button"
              onClick={() => onEdit?.(sectionKey)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              disabled={isSubmitting}
            >
              Edit
            </button>
          </div>
        </div>

        {/* Section Content */}
        {hasContent ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(content).map(([label, value]) => (
                <div key={label}>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {label}
                  </label>
                  <p
                    className={`text-gray-900 dark:text-gray-100 mt-1 ${
                      label.includes("GPS") ||
                      label.includes("Coordinates") ||
                      label.includes("Number")
                        ? "font-mono"
                        : ""
                    } ${
                      !value || value.includes("Not")
                        ? "text-gray-400 italic"
                        : ""
                    }`}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <span className="text-4xl block mb-2">{config.icon}</span>
            <p>No {config.title.toLowerCase()} provided</p>
            {sectionKey === REVIEW_SECTIONS.IDENTIFICATION && (
              <p className="text-xs mt-1">
                Identity verification is optional but recommended
              </p>
            )}
          </div>
        )}

        {/* Section Errors */}
        {sectionErrors.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
              Issues to resolve:
            </p>
            <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
              {sectionErrors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const missingFields = [
    {
      condition: !formData?.role,
      text: "Select your role to help us customize your experience",
    },
    {
      condition: !formData?.bio?.trim(),
      text: "Add a bio to tell people about yourself",
    },
    {
      condition: !formData?.ghanaPostGPS,
      text: "Add your Ghana Post GPS address to help customers find you",
    },
    {
      condition: !formData?.primaryContact,
      text: "Add a valid phone number so customers can contact you",
    },
    {
      condition: !formData?.socialMediaHandles?.length,
      text: "Add social media handles to build trust and showcase your work",
    },
    {
      condition: !formData?.idType && formData?.role === UserRole.PROVIDER,
      text: "Consider adding ID verification to build trust with customers",
    },
  ].filter((item) => item.condition);

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header with Overall Progress */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Review Your Profile
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Review your information before completing your profile. You can edit
          any section if needed.
        </p>

        {/* Progress Circle */}
        <div className="relative inline-flex items-center justify-center w-24 h-24 mb-4">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={`${2.51 * completeness} 251`}
              strokeLinecap="round"
              className={`transition-all duration-500 ${
                completeness >= 80
                  ? "text-green-500"
                  : completeness >= 50
                  ? "text-yellow-500"
                  : "text-blue-500"
              }`}
            />
          </svg>
          <span className="absolute text-xl font-bold text-gray-900 dark:text-gray-100">
            {completeness}%
          </span>
        </div>

        <div
          className={`text-sm font-medium ${
            completeness >= 80
              ? "text-green-600 dark:text-green-400"
              : completeness >= 50
              ? "text-yellow-600 dark:text-yellow-400"
              : "text-blue-600 dark:text-blue-400"
          }`}
        >
          {completeness >= 80
            ? "🎉 Profile Complete!"
            : completeness >= 50
            ? "⚡ Almost There!"
            : "🚀 Good Start!"}
        </div>
      </div>

      {/* Render All Sections */}
      {Object.values(REVIEW_SECTIONS).map(renderSection)}

      {/* Improvement Suggestions */}
      {completeness < 100 && missingFields.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3 flex items-center">
            <span className="mr-2">💡</span>Suggestions to Improve Your Profile
          </h4>
          <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            {missingFields.map((field, index) => (
              <p key={index}>• {field.text}</p>
            ))}
          </div>
        </div>
      )}

      {/* Completion Notice */}
      <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
        <span className="text-4xl block mb-3">🎉</span>
        <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
          {completeness >= 80 ? "Your Profile is Ready!" : "Almost Done!"}
        </h4>
        <p className="text-sm text-green-800 dark:text-green-200 mb-4">
          {completeness >= 80
            ? "Your profile looks great! Click the button below to save your changes and start using the platform."
            : `Your profile is ${completeness}% complete. You can submit now and complete the remaining sections later.`}
        </p>
        <div className="text-xs text-green-700 dark:text-green-300">
          You can always edit your profile information later from your
          dashboard.
        </div>
      </div>
    </div>
  );
}
