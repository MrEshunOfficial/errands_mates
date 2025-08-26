"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/profiles/useProfile";
import {
  UpdateUserProfileFormData,
  updateUserProfileFormSchema,
  calculateUserProfileCompleteness,
} from "@/lib/utils/schemas/profile.schemas";
import { toast } from "sonner";
import { ProfilePicture, UserRole } from "@/types/base.types";
import BasicInfoFormStep from "@/components/profile-forms/BasicInformationStep";
import ContactFormStep from "@/components/profile-forms/ContactFormStep";
import LocationFormStep from "@/components/profile-forms/LocationFormStep";
import IdentificationFormStep from "@/components/profile-forms/IdentificationFormStep";
import ReviewFormStep from "@/components/profile-forms/ReviewFormStep";

export enum FormStep {
  BASIC_INFO = "basic-info",
  LOCATION = "location",
  CONTACT = "contact",
  IDENTIFICATION = "identification",
  REVIEW = "review",
}

interface FormStepConfig {
  key: FormStep;
  title: string;
  description: string;
  icon: string;
}

const FORM_STEPS: FormStepConfig[] = [
  {
    key: FormStep.BASIC_INFO,
    title: "Basic Information",
    description: "Tell us about yourself",
    icon: "👤",
  },
  {
    key: FormStep.LOCATION,
    title: "Location Details",
    description: "Where are you located?",
    icon: "📍",
  },
  {
    key: FormStep.CONTACT,
    title: "Contact Information",
    description: "How can we reach you?",
    icon: "📞",
  },
  {
    key: FormStep.IDENTIFICATION,
    title: "Identification",
    description: "Verify your identity (optional)",
    icon: "🆔",
  },
  {
    key: FormStep.REVIEW,
    title: "Review & Complete",
    description: "Review your information",
    icon: "✅",
  },
];

const STEP_FIELDS: Record<FormStep, string[]> = {
  [FormStep.BASIC_INFO]: ["role", "bio", "isActiveInMarketplace"],
  [FormStep.LOCATION]: [
    "ghanaPostGPS",
    "nearbyLandmark",
    "region",
    "city",
    "district",
    "locality",
    "other",
    "gpsCoordinates",
  ],
  [FormStep.CONTACT]: [
    "primaryContact",
    "secondaryContact",
    "businessEmail",
    "socialMediaHandles",
  ],
  [FormStep.IDENTIFICATION]: ["idType", "idNumber"],
  [FormStep.REVIEW]: [],
};

type ProfileSection = "basic-info" | "location" | "contact" | "identification";

interface ProfileFormPageProps {
  isEditing?: boolean;
  redirectOnSuccess?: string;
}

// Import the UpdateProfileData type from your API
import type { UpdateProfileData } from "@/lib/api/profiles/profile.api";
import { IUserProfile } from "@/types";
// Fallback interface if UpdateProfileData is not available
interface FallbackUpdateProfileData {
  role?: UserRole;
  bio?: string;
  location?: {
    ghanaPostGPS?: string;
    nearbyLandmark?: string;
    region?: string;
    city?: string;
    district?: string;
    locality?: string;
    other?: string;
    gpsCoordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  profilePicture?: ProfilePicture;
  contactDetails?: {
    primaryContact?: string;
    secondaryContact?: string;
    businessEmail?: string;
  };
  socialMediaHandles?: Array<{
    nameOfSocial: string;
    userName: string;
  }>;
  idDetails?: {
    idType: string;
    idNumber: string;
    idFile: { url: string; fileName: string };
  };
  isActiveInMarketplace?: boolean;
}

// Use UpdateProfileData if available, otherwise use fallback
type ApiProfileData = UpdateProfileData extends never
  ? FallbackUpdateProfileData
  : UpdateProfileData;

export default function FlexibleProfileForm({
  isEditing = false,
  redirectOnSuccess = "/dashboard",
}: ProfileFormPageProps) {
  const router = useRouter();
  const {
    profile,
    isLoading,
    error,
    isInitialized,
    updateProfile,
    refreshProfile,
  } = useProfile();

  // Consolidated state
  const [currentStep, setCurrentStep] = useState<FormStep>(FormStep.BASIC_INFO);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Safe profile access with proper typing
  const safeProfile = profile as IUserProfile | null | undefined;

  // Initialize form with proper default values
  const defaultValues = useMemo<UpdateUserProfileFormData>(
    () => ({
      role: safeProfile?.role,
      bio: safeProfile?.bio || "",
      ghanaPostGPS: safeProfile?.location?.ghanaPostGPS || "",
      nearbyLandmark: safeProfile?.location?.nearbyLandmark || "",
      region: safeProfile?.location?.region || "",
      city: safeProfile?.location?.city || "",
      district: safeProfile?.location?.district || "",
      locality: safeProfile?.location?.locality || "",
      other: safeProfile?.location?.other || "",
      gpsCoordinates: safeProfile?.location?.gpsCoordinates,
      primaryContact: safeProfile?.contactDetails?.primaryContact || "",
      secondaryContact: safeProfile?.contactDetails?.secondaryContact || "",
      businessEmail: safeProfile?.contactDetails?.businessEmail || "",
      socialMediaHandles: safeProfile?.socialMediaHandles || [],
      idType: safeProfile?.idDetails?.idType,
      idNumber: safeProfile?.idDetails?.idNumber || "",
      isActiveInMarketplace: safeProfile?.isActiveInMarketplace || false,
    }),
    [safeProfile]
  );

  const methods = useForm<UpdateUserProfileFormData>({
    resolver: zodResolver(updateUserProfileFormSchema),
    mode: "onChange",
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isDirty, errors },
    reset,
    watch,
    getValues,
  } = methods;

  const formData = watch();

  // Transform form data to API format with proper typing
  const transformFormData = useCallback(
    (data: UpdateUserProfileFormData): ApiProfileData => {
      const gpsCoordinates =
        data.gpsCoordinates?.latitude !== undefined &&
        data.gpsCoordinates?.longitude !== undefined
          ? {
              latitude: data.gpsCoordinates.latitude,
              longitude: data.gpsCoordinates.longitude,
            }
          : undefined;

      // Create a partial profile data object instead of full IUserProfile
      const profileData: Partial<IUserProfile> = {};

      // Basic fields
      if (data.bio !== undefined) {
        profileData.bio = data.bio;
      }

      // Location - only include if ghanaPostGPS is provided (required field)
      if (data.ghanaPostGPS) {
        profileData.location = {
          ghanaPostGPS: data.ghanaPostGPS,
          ...(data.nearbyLandmark && { nearbyLandmark: data.nearbyLandmark }),
          ...(data.region && { region: data.region }),
          ...(data.city && { city: data.city }),
          ...(data.district && { district: data.district }),
          ...(data.locality && { locality: data.locality }),
          ...(data.other && { other: data.other }),
          ...(gpsCoordinates && { gpsCoordinates }),
        };
      }

      // Contact details - only include if primaryContact is provided (required field)
      if (data.primaryContact) {
        profileData.contactDetails = {
          primaryContact: data.primaryContact,
          ...(data.secondaryContact && {
            secondaryContact: data.secondaryContact,
          }),
          ...(data.businessEmail && { businessEmail: data.businessEmail }),
        };
      }

      // Social media handles
      if (data.socialMediaHandles?.length) {
        profileData.socialMediaHandles = data.socialMediaHandles.filter(
          (h): h is { nameOfSocial: string; userName: string } =>
            Boolean(h.nameOfSocial && h.userName)
        );
      }

      // ID details
      if (data.idNumber && data.idType) {
        profileData.idDetails = {
          idType: data.idType,
          idNumber: data.idNumber,
          idFile: { url: "", fileName: "" },
        };
      }

      // Marketplace status
      if (data.isActiveInMarketplace !== undefined) {
        profileData.isActiveInMarketplace = data.isActiveInMarketplace;
      }

      // Role
      if (data.role !== undefined) {
        profileData.role = data.role;
      }

      // Return the profile data wrapped as expected by the API
      return {
        profile: profileData,
      } as ApiProfileData;
    },
    []
  );

  // Save handler with proper error handling
  const handleSave = useCallback(async (): Promise<void> => {
    if (isSaving || isSubmitting) return;

    setIsSaving(true);
    setSubmitError(null);

    try {
      const transformedData = transformFormData(getValues());
      await updateProfile(transformedData);
      setLastSaved(new Date());
      toast.info("Progress saved successfully!");
      reset(getValues(), { keepValues: true });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save progress";
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [
    isSaving,
    isSubmitting,
    getValues,
    transformFormData,
    updateProfile,
    reset,
  ]);

  // Navigation handlers with proper typing
  const currentIndex = FORM_STEPS.findIndex((step) => step.key === currentStep);
  const goToStep = useCallback(
    (step: FormStep): void => setCurrentStep(step),
    []
  );
  const goToNextStep = useCallback((): void => {
    if (currentIndex < FORM_STEPS.length - 1) {
      goToStep(FORM_STEPS[currentIndex + 1].key);
    }
  }, [currentIndex, goToStep]);

  const goToPrevStep = useCallback((): void => {
    if (currentIndex > 0) {
      goToStep(FORM_STEPS[currentIndex - 1].key);
    }
  }, [currentIndex, goToStep]);

  // Step completeness calculation with proper typing
  const getStepCompleteness = useCallback(
    (step: FormStep): number => {
      if (!formData) return 0;

      switch (step) {
        case FormStep.BASIC_INFO:
          const bioComplete = Boolean(formData.bio && formData.bio.trim());
          const roleComplete = Boolean(formData.role);
          return ((Number(bioComplete) + Number(roleComplete)) / 2) * 100;

        case FormStep.LOCATION:
          return formData.ghanaPostGPS ? 100 : 0;

        case FormStep.CONTACT:
          return formData.primaryContact ? 100 : 0;

        case FormStep.IDENTIFICATION:
          return formData.idNumber && formData.idType ? 100 : 0;

        default:
          return 0;
      }
    },
    [formData]
  );

  // Error handling with proper typing
  const stepErrors = useMemo((): Record<FormStep, string[]> => {
    const result = Object.keys(STEP_FIELDS).reduce(
      (acc, step) => ({ ...acc, [step]: [] }),
      {} as Record<FormStep, string[]>
    );

    Object.entries(errors).forEach(([field, error]) => {
      if (error?.message) {
        const step = Object.keys(STEP_FIELDS).find((s) =>
          STEP_FIELDS[s as FormStep].some((f) => field.startsWith(f))
        ) as FormStep | undefined;

        if (step && result[step]) {
          result[step].push(error.message);
        }
      }
    });

    return result;
  }, [errors]);

  // Profile completeness calculation
  const currentCompleteness = useMemo((): number => {
    if (!formData) return 0;
    return calculateUserProfileCompleteness(formData).percentage;
  }, [formData]);

  // Main submission handler
  const onSubmit = useCallback(
    async (data: UpdateUserProfileFormData): Promise<void> => {
      if (isSubmitting) return;

      setIsSubmitting(true);
      setSubmitError(null);

      try {
        await updateProfile(transformFormData(data));
        await refreshProfile();
        toast.success("Profile completed successfully!");
        setLastSaved(new Date());
        router.push(redirectOnSuccess);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to complete profile";
        setSubmitError(errorMessage);
        toast.error(errorMessage);

        if (errorMessage.includes("authentication")) {
          router.push("/login");
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      isSubmitting,
      transformFormData,
      updateProfile,
      refreshProfile,
      router,
      redirectOnSuccess,
    ]
  );

  // Handle edit navigation
  const handleEdit = useCallback((section: ProfileSection): void => {
    const stepMap: Record<ProfileSection, FormStep> = {
      "basic-info": FormStep.BASIC_INFO,
      location: FormStep.LOCATION,
      contact: FormStep.CONTACT,
      identification: FormStep.IDENTIFICATION,
    };
    setCurrentStep(stepMap[section]);
  }, []);

  // Initialize form with profile data
  useEffect(() => {
    if (safeProfile && isInitialized) {
      const initialData: UpdateUserProfileFormData = {
        role: safeProfile.role,
        bio: safeProfile.bio || "",
        ghanaPostGPS: safeProfile.location?.ghanaPostGPS || "",
        nearbyLandmark: safeProfile.location?.nearbyLandmark || "",
        region: safeProfile.location?.region || "",
        city: safeProfile.location?.city || "",
        district: safeProfile.location?.district || "",
        locality: safeProfile.location?.locality || "",
        other: safeProfile.location?.other || "",
        gpsCoordinates: safeProfile.location?.gpsCoordinates,
        primaryContact: safeProfile.contactDetails?.primaryContact || "",
        secondaryContact: safeProfile.contactDetails?.secondaryContact || "",
        businessEmail: safeProfile.contactDetails?.businessEmail || "",
        socialMediaHandles: safeProfile.socialMediaHandles || [],
        idType: safeProfile.idDetails?.idType,
        idNumber: safeProfile.idDetails?.idNumber || "",
        isActiveInMarketplace: safeProfile.isActiveInMarketplace || false,
      };

      reset(initialData);
      setLastSaved(new Date());
    }
  }, [safeProfile, isInitialized, reset]);

  // Loading state
  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !safeProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Profile Error
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === FORM_STEPS.length - 1;
  const hasUnsavedChanges = isDirty;

  return (
    <div className="container max-w-5xl mx-auto space-y-2 border rounded-2xl p-2">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {isEditing ? "Edit Profile" : "Build Your Profile"}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Fill out sections at your own pace. Save your progress manually
              when ready.
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Profile Completeness
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {currentCompleteness}%
            </div>
            {lastSaved && (
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Last saved: {lastSaved.toLocaleTimeString()}
              </div>
            )}
            {hasUnsavedChanges && (
              <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                • Unsaved changes
              </div>
            )}
            {isSaving && (
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 animate-pulse">
                Saving...
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
          <div
            className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${currentCompleteness}%` }}
          ></div>
        </div>

        {/* Step indicators */}
        <div className="grid grid-cols-5 gap-2">
          {FORM_STEPS.map((step) => {
            const stepCompleteness = getStepCompleteness(step.key);
            const hasErrors = stepErrors[step.key]?.length > 0;
            const isActive = step.key === currentStep;

            const borderColor = isActive
              ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-950"
              : hasErrors
              ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 hover:bg-red-100 dark:hover:bg-red-900"
              : stepCompleteness > 0
              ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 hover:bg-green-100 dark:hover:bg-green-900"
              : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750";

            return (
              <div
                key={step.key}
                className={`cursor-pointer p-3 rounded-lg border transition-all ${borderColor}`}
                onClick={() => goToStep(step.key)}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">{step.icon}</div>
                  <div className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-1">
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                    {step.description}
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1">
                    <div
                      className={`h-1 rounded-full transition-all ${
                        hasErrors
                          ? "bg-red-400 dark:bg-red-500"
                          : "bg-green-400 dark:bg-green-500"
                      }`}
                      style={{ width: `${stepCompleteness}%` }}
                    ></div>
                  </div>
                  {hasErrors && (
                    <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {stepErrors[step.key].length} issue
                      {stepErrors[step.key].length !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && (
        <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="text-orange-600 dark:text-orange-400 text-lg mr-3">
              ⚠️
            </div>
            <div>
              <p className="text-orange-800 dark:text-orange-200 font-medium">
                You have unsaved changes
              </p>
              <p className="text-orange-700 dark:text-orange-300 text-sm">
                Don&apos;t forget to save your progress before moving to another
                section.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-2">
            {submitError && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
                <div className="text-red-800 dark:text-red-200">
                  {submitError}
                </div>
              </div>
            )}

            {/* Current Step Info */}
            <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
              <div className="flex items-center">
                <span className="text-2xl mr-3">
                  {FORM_STEPS.find((s) => s.key === currentStep)?.icon}
                </span>
                <div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">
                    {FORM_STEPS.find((s) => s.key === currentStep)?.title}
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {FORM_STEPS.find((s) => s.key === currentStep)?.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Form Step Content */}
            <div className="">
              <div className="text-center py-2 text-gray-500 dark:text-gray-400">
                {currentStep === FormStep.BASIC_INFO && <BasicInfoFormStep />}
                {currentStep === FormStep.CONTACT && <ContactFormStep />}
                {currentStep === FormStep.LOCATION && <LocationFormStep />}
                {currentStep === FormStep.IDENTIFICATION && (
                  <IdentificationFormStep />
                )}
                {currentStep === FormStep.REVIEW && (
                  <ReviewFormStep
                    isSubmitting={isSubmitting}
                    onEdit={handleEdit}
                  />
                )}
                {stepErrors[currentStep]?.length > 0 && (
                  <div className="mt-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded">
                    <p className="text-red-700 dark:text-red-300 font-medium">
                      Issues in this section:
                    </p>
                    <ul className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {stepErrors[currentStep].map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={goToPrevStep}
                  disabled={isFirstStep}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
                {!isLastStep && (
                  <button
                    type="button"
                    onClick={goToNextStep}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 border border-transparent rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
                  >
                    Next →
                  </button>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || isSubmitting || !hasUnsavedChanges}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Saving..." : "Save Progress"}
                </button>
                {!isLastStep && (
                  <button
                    type="button"
                    onClick={async () => {
                      await handleSave();
                      if (!isSaving && !submitError) {
                        goToNextStep();
                      }
                    }}
                    disabled={isSaving || isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 border border-transparent rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? "Saving..." : "Save & Continue"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
