"use client";

import { idType, UserRole } from "@/types";
import React from "react";
import { useFormContext } from "react-hook-form";

interface ReviewFormStepProps {
  className?: string;
  onEdit?: (section: string) => void;
  isSubmitting?: boolean;
}

// Section mapping for navigation
export const REVIEW_SECTIONS = {
  BASIC_INFO: "basic-info",
  LOCATION: "location",
  CONTACT: "contact",
  IDENTIFICATION: "identification",
} as const;

// ID type display names
const idTypeLabels: Record<idType, string> = {
  [idType.NATIONAL_ID]: "National ID",
  [idType.VOTERS_ID]: "Voter's ID",
  [idType.PASSPORT]: "Passport",
  [idType.DRIVERS_LICENSE]: "Driver's License",
  [idType.NHIS]: "NHIS",
  [idType.OTHER]: "Other",
};

// Role display names
const roleLabels = {
  [UserRole.CUSTOMER]: "Customer",
  [UserRole.PROVIDER]: "Service Provider",
};

export default function ReviewFormStep({
  className = "",
  onEdit,
  isSubmitting = false,
}: ReviewFormStepProps) {
  const {
    watch,
    formState: { errors },
  } = useFormContext<UpdateProfileFormData>();

  const formData = watch();
  const completeness = calculateProfileCompleteness(formData || {});

  // Check if section has errors
  const getSectionErrors = (section: string): string[] => {
    const errorMessages: string[] = [];

    switch (section) {
      case REVIEW_SECTIONS.BASIC_INFO:
        if (errors.role)
          errorMessages.push(errors.role.message || "Role is required");
        if (errors.bio) errorMessages.push(errors.bio.message || "Bio error");
        break;

      case REVIEW_SECTIONS.LOCATION:
        if (errors.location?.ghanaPostGPS)
          errorMessages.push(
            errors.location.ghanaPostGPS.message || "Ghana Post GPS error"
          );
        if (errors.location?.region)
          errorMessages.push(errors.location.region.message || "Region error");
        if (errors.location?.city)
          errorMessages.push(errors.location.city.message || "City error");
        if (errors.location?.nearbyLandmark)
          errorMessages.push(
            errors.location.nearbyLandmark.message || "Landmark error"
          );
        break;

      case REVIEW_SECTIONS.CONTACT:
        if (errors.contactDetails?.primaryContact)
          errorMessages.push(
            errors.contactDetails.primaryContact.message ||
              "Primary contact error"
          );
        if (errors.contactDetails?.secondaryContact)
          errorMessages.push(
            errors.contactDetails.secondaryContact.message ||
              "Secondary contact error"
          );
        if (errors.socialMediaHandles)
          errorMessages.push("Social media handles have errors");
        break;

      case REVIEW_SECTIONS.IDENTIFICATION:
        if (errors.idDetails?.idType)
          errorMessages.push(
            errors.idDetails.idType.message || "ID type error"
          );
        if (errors.idDetails?.idNumber)
          errorMessages.push(
            errors.idDetails.idNumber.message || "ID number error"
          );
        if (errors.idDetails?.idFile)
          errorMessages.push(
            errors.idDetails.idFile.message || "ID file error"
          );
        break;
    }

    return errorMessages;
  };

  // Get section completion status
  const getSectionStatus = (
    section: string
  ): {
    status: "complete" | "partial" | "empty" | "error";
    percentage: number;
  } => {
    const sectionErrors = getSectionErrors(section);

    if (sectionErrors.length > 0) {
      return { status: "error", percentage: 0 };
    }

    switch (section) {
      case REVIEW_SECTIONS.BASIC_INFO:
        const hasRole = !!formData?.role;
        const hasBio = !!formData?.bio?.trim();
        const basicPercentage =
          (((hasRole ? 1 : 0) + (hasBio ? 1 : 0)) / 2) * 100;
        if (basicPercentage === 100)
          return { status: "complete", percentage: basicPercentage };
        if (basicPercentage > 0)
          return { status: "partial", percentage: basicPercentage };
        return { status: "empty", percentage: 0 };

      case REVIEW_SECTIONS.LOCATION:
        const hasGPS = validateGhanaPostGPS(
          formData?.location?.ghanaPostGPS || ""
        );
        const hasRegion = !!formData?.location?.region?.trim();
        const hasCity = !!formData?.location?.city?.trim();
        const hasLandmark = !!formData?.location?.nearbyLandmark?.trim();
        const locationPercentage =
          (((hasGPS ? 1 : 0) +
            (hasRegion ? 0.5 : 0) +
            (hasCity ? 0.5 : 0) +
            (hasLandmark ? 0.5 : 0)) /
            2.5) *
          100;
        if (locationPercentage >= 80)
          return { status: "complete", percentage: locationPercentage };
        if (locationPercentage > 0)
          return { status: "partial", percentage: locationPercentage };
        return { status: "empty", percentage: 0 };

      case REVIEW_SECTIONS.CONTACT:
        const hasPrimaryPhone = validateGhanaPhone(
          formData?.contactDetails?.primaryContact || ""
        );
        const hasSecondaryPhone = validateGhanaPhone(
          formData?.contactDetails?.secondaryContact || ""
        );
        const hasSocialMedia = (formData?.socialMediaHandles || []).some(
          (handle) => handle.nameOfSocial?.trim() && handle.userName?.trim()
        );
        const contactPercentage =
          (((hasPrimaryPhone ? 1 : 0) +
            (hasSecondaryPhone ? 0.3 : 0) +
            (hasSocialMedia ? 0.5 : 0)) /
            1.8) *
          100;
        if (contactPercentage >= 80)
          return { status: "complete", percentage: contactPercentage };
        if (contactPercentage > 0)
          return { status: "partial", percentage: contactPercentage };
        return { status: "empty", percentage: 0 };

      case REVIEW_SECTIONS.IDENTIFICATION:
        const hasIdType = !!formData?.idDetails?.idType;
        const hasIdNumber = !!formData?.idDetails?.idNumber?.trim();
        const hasIdFile = !!formData?.idDetails?.idFile?.url;
        const idPercentage =
          (((hasIdType ? 1 : 0) + (hasIdNumber ? 1 : 0) + (hasIdFile ? 1 : 0)) /
            3) *
          100;
        if (idPercentage === 100)
          return { status: "complete", percentage: idPercentage };
        if (idPercentage > 0)
          return { status: "partial", percentage: idPercentage };
        return { status: "empty", percentage: 0 };

      default:
        return { status: "empty", percentage: 0 };
    }
  };

  // Get status badge
  const getStatusBadge = (
    status: "complete" | "partial" | "empty" | "error"
  ) => {
    switch (status) {
      case "complete":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
            ✅ Complete
          </span>
        );
      case "partial":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
            ⚡ Partial
          </span>
        );
      case "error":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
            ❌ Error
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
            ⭕ Empty
          </span>
        );
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

        {/* Overall completion circle */}
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
              className={`transition-all duration-500 ${
                completeness >= 80
                  ? "text-green-500"
                  : completeness >= 50
                  ? "text-yellow-500"
                  : "text-blue-500"
              }`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {completeness}%
            </span>
          </div>
        </div>

        <div
          className={`text-sm font-medium ${
            completeness >= 80
              ? "text-green-600 dark:text-green-400"
              : completeness >= 50
              ? "text-yellow-600 dark:text-yellow-400"
              : "text-blue-600 dark:text-blue-400"
          }`}>
          {completeness >= 80
            ? "🎉 Profile Complete!"
            : completeness >= 50
            ? "⚡ Almost There!"
            : "🚀 Good Start!"}
        </div>
      </div>

      {/* Basic Information Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">👤</span>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                Basic Information
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your profile basics
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusBadge(
              getSectionStatus(REVIEW_SECTIONS.BASIC_INFO).status
            )}
            <button
              type="button"
              onClick={() => onEdit?.(REVIEW_SECTIONS.BASIC_INFO)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              disabled={isSubmitting}>
              Edit
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Role
              </label>
              <p className="text-gray-900 dark:text-gray-100 mt-1">
                {formData?.role ? roleLabels[formData.role] : "Not selected"}
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Bio
            </label>
            <p className="text-gray-900 dark:text-gray-100 mt-1">
              {formData?.bio ? (
                <span className="text-sm">{formData.bio}</span>
              ) : (
                <span className="text-gray-400 italic">No bio provided</span>
              )}
            </p>
          </div>
        </div>

        {getSectionErrors(REVIEW_SECTIONS.BASIC_INFO).length > 0 && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
              Issues to resolve:
            </p>
            <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
              {getSectionErrors(REVIEW_SECTIONS.BASIC_INFO).map(
                (error, index) => (
                  <li key={index}>• {error}</li>
                )
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Location Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">📍</span>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                Location Details
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Where you&apos;re located
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusBadge(getSectionStatus(REVIEW_SECTIONS.LOCATION).status)}
            <button
              type="button"
              onClick={() => onEdit?.(REVIEW_SECTIONS.LOCATION)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              disabled={isSubmitting}>
              Edit
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Ghana Post GPS
              </label>
              <p className="text-gray-900 dark:text-gray-100 mt-1 font-mono">
                {formData?.location?.ghanaPostGPS || "Not provided"}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Region
              </label>
              <p className="text-gray-900 dark:text-gray-100 mt-1">
                {formData?.location?.region || "Not specified"}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                City
              </label>
              <p className="text-gray-900 dark:text-gray-100 mt-1">
                {formData?.location?.city || "Not specified"}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Nearby Landmark
              </label>
              <p className="text-gray-900 dark:text-gray-100 mt-1">
                {formData?.location?.nearbyLandmark || "Not provided"}
              </p>
            </div>
          </div>

          {formData?.location?.gpsCoordinates && (
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                GPS Coordinates
              </label>
              <p className="text-gray-900 dark:text-gray-100 mt-1 font-mono text-sm">
                {formData.location.gpsCoordinates.latitude?.toFixed(6)},{" "}
                {formData.location.gpsCoordinates.longitude?.toFixed(6)}
              </p>
            </div>
          )}
        </div>

        {getSectionErrors(REVIEW_SECTIONS.LOCATION).length > 0 && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
              Issues to resolve:
            </p>
            <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
              {getSectionErrors(REVIEW_SECTIONS.LOCATION).map(
                (error, index) => (
                  <li key={index}>• {error}</li>
                )
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Contact Information Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">📞</span>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                Contact Information
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                How customers can reach you
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusBadge(getSectionStatus(REVIEW_SECTIONS.CONTACT).status)}
            <button
              type="button"
              onClick={() => onEdit?.(REVIEW_SECTIONS.CONTACT)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              disabled={isSubmitting}>
              Edit
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Primary Phone
              </label>
              <p className="text-gray-900 dark:text-gray-100 mt-1">
                {formData?.contactDetails?.primaryContact
                  ? formatPhoneDisplay(formData.contactDetails.primaryContact)
                  : "Not provided"}
              </p>
            </div>
            {formData?.contactDetails?.secondaryContact && (
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Secondary Phone
                </label>
                <p className="text-gray-900 dark:text-gray-100 mt-1">
                  {formatPhoneDisplay(formData.contactDetails.secondaryContact)}
                </p>
              </div>
            )}
          </div>

          {formData?.socialMediaHandles &&
            formData.socialMediaHandles.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 block">
                  Social Media Handles
                </label>
                <div className="space-y-2">
                  {formData.socialMediaHandles
                    .filter((handle) => handle.nameOfSocial && handle.userName)
                    .map((handle, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 text-sm">
                        <span className="text-gray-600 dark:text-gray-400 min-w-0 flex-shrink-0">
                          {handle.nameOfSocial}:
                        </span>
                        <span className="text-gray-900 dark:text-gray-100 font-mono">
                          {handle.userName}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
        </div>

        {getSectionErrors(REVIEW_SECTIONS.CONTACT).length > 0 && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
              Issues to resolve:
            </p>
            <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
              {getSectionErrors(REVIEW_SECTIONS.CONTACT).map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Identification Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🆔</span>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                Identity Verification
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Optional identity verification
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusBadge(
              getSectionStatus(REVIEW_SECTIONS.IDENTIFICATION).status
            )}
            <button
              type="button"
              onClick={() => onEdit?.(REVIEW_SECTIONS.IDENTIFICATION)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              disabled={isSubmitting}>
              Edit
            </button>
          </div>
        </div>

        {formData?.idDetails?.idType ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  ID Type
                </label>
                <p className="text-gray-900 dark:text-gray-100 mt-1">
                  {idTypeLabels[formData.idDetails.idType]}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  ID Number
                </label>
                <p className="text-gray-900 dark:text-gray-100 mt-1 font-mono">
                  {formData.idDetails.idNumber || "Not provided"}
                </p>
              </div>
            </div>

            {formData.idDetails.idFile?.fileName && (
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Uploaded Document
                </label>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-green-600 dark:text-green-400">📄</span>
                  <span className="text-gray-900 dark:text-gray-100 text-sm">
                    {formData.idDetails.idFile.fileName}
                  </span>
                  <span className="text-green-600 dark:text-green-400 text-sm">
                    ✅ Uploaded
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <span className="text-4xl block mb-2">🆔</span>
            <p>No identification provided</p>
            <p className="text-xs mt-1">
              Identity verification is optional but recommended
            </p>
          </div>
        )}

        {getSectionErrors(REVIEW_SECTIONS.IDENTIFICATION).length > 0 && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
              Issues to resolve:
            </p>
            <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
              {getSectionErrors(REVIEW_SECTIONS.IDENTIFICATION).map(
                (error, index) => (
                  <li key={index}>• {error}</li>
                )
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Completion Recommendations */}
      {completeness < 100 && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3 flex items-center">
            <span className="mr-2">💡</span>
            Suggestions to Improve Your Profile
          </h4>
          <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            {!formData?.role && (
              <p>• Select your role to help us customize your experience</p>
            )}
            {!formData?.bio?.trim() && (
              <p>• Add a bio to tell people about yourself</p>
            )}
            {!validateGhanaPostGPS(formData?.location?.ghanaPostGPS || "") && (
              <p>
                • Add your Ghana Post GPS address to help customers find you
              </p>
            )}
            {!validateGhanaPhone(
              formData?.contactDetails?.primaryContact || ""
            ) && <p>• Add a valid phone number so customers can contact you</p>}
            {(!formData?.socialMediaHandles ||
              formData.socialMediaHandles.length === 0) && (
              <p>
                • Add social media handles to build trust and showcase your work
              </p>
            )}
            {!formData?.idDetails?.idType &&
              formData?.role === UserRole.PROVIDER && (
                <p>
                  • Consider adding ID verification to build trust with
                  customers
                </p>
              )}
          </div>
        </div>
      )}

      {/* Final Submit Notice */}
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

export type { ReviewFormStepProps };
