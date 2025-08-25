"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import BasicInfoFormStep from "@/components/ui/profileformUi/BasicInformationStep";
import ContactFormStep from "@/components/ui/profileformUi/ContactFormStep";
import LocationFormStep from "@/components/ui/profileformUi/LocationFormStep";
import IdentificationFormStep from "@/components/ui/profileformUi/IdentificationFormStep";
import ReviewFormStep from "@/components/ui/profileformUi/ReviewFormStep";
import { useProfile } from "@/hooks/profiles/useProfile";
import {
  UpdateUserProfileFormData,
  updateUserProfileFormSchema,
  calculateUserProfileCompleteness,
} from "@/lib/utils/schemas/profile.schemas";
import { toast } from "sonner";
import { UserRole } from "@/types";

export enum FormStep {
  BASIC_INFO = "basic-info",
  LOCATION = "location",
  CONTACT = "contact",
  IDENTIFICATION = "identification",
  REVIEW = "review",
}

const FORM_STEPS = [
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

// Define the section type for better type safety
type ProfileSection = "basic-info" | "location" | "contact" | "identification";

interface ProfileFormPageProps {
  isEditing?: boolean;
  redirectOnSuccess?: string;
}

// Define the interface for updateProfile to match what your hook expects
interface UpdateProfileData {
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
      latitude?: number;
      longitude?: number;
    };
  };
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
    idFile: {
      url: string;
      fileName: string;
    };
  };
  isActiveInMarketplace?: boolean;
}

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

  // Form state management
  const [currentStep, setCurrentStep] = useState<FormStep>(FormStep.BASIC_INFO);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [stepErrors, setStepErrors] = useState<Record<FormStep, string[]>>({
    [FormStep.BASIC_INFO]: [],
    [FormStep.LOCATION]: [],
    [FormStep.CONTACT]: [],
    [FormStep.IDENTIFICATION]: [],
    [FormStep.REVIEW]: [],
  });

  // Initialize form with react-hook-form
  const methods = useForm<UpdateUserProfileFormData>({
    resolver: zodResolver(updateUserProfileFormSchema),
    mode: "onChange",
    defaultValues: {
      role: profile?.role,
      bio: profile?.bio || "",
      // Location fields (flattened in schema)
      ghanaPostGPS: profile?.location?.ghanaPostGPS || "",
      nearbyLandmark: profile?.location?.nearbyLandmark || "",
      region: profile?.location?.region || "",
      city: profile?.location?.city || "",
      district: profile?.location?.district || "",
      locality: profile?.location?.locality || "",
      other: profile?.location?.other || "",
      gpsCoordinates: profile?.location?.gpsCoordinates,
      // Contact fields (flattened in schema)
      primaryContact: profile?.contactDetails?.primaryContact || "",
      secondaryContact: profile?.contactDetails?.secondaryContact || "",
      businessEmail: profile?.contactDetails?.businessEmail || "",
      // Social media
      socialMediaHandles: profile?.socialMediaHandles || [],
      // ID fields (flattened in schema)
      idType: profile?.idDetails?.idType,
      idNumber: profile?.idDetails?.idNumber || "",
      // Marketplace status
      isActiveInMarketplace: profile?.isActiveInMarketplace || false,
    },
  });

  const {
    handleSubmit,
    formState: { isDirty, errors },
    reset,
    watch,
    getValues,
  } = methods;

  // Watch for form changes to track unsaved changes
  const formData = watch();

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(isDirty);
  }, [isDirty]);

  // Transform form data to API format (matching profile API expectations)
  const transformFormData = useCallback(
    (data: UpdateUserProfileFormData): UpdateProfileData => {
      return {
        role: data.role,
        bio: data.bio,
        location: {
          ghanaPostGPS: data.ghanaPostGPS,
          nearbyLandmark: data.nearbyLandmark,
          region: data.region,
          city: data.city,
          district: data.district,
          locality: data.locality,
          other: data.other,
          gpsCoordinates: data.gpsCoordinates,
        },
        contactDetails: {
          primaryContact: data.primaryContact,
          secondaryContact: data.secondaryContact,
          businessEmail: data.businessEmail,
        },
        socialMediaHandles: data.socialMediaHandles?.filter(
          (handle) => handle.nameOfSocial && handle.userName
        ),
        idDetails:
          data.idNumber && data.idType
            ? {
                idType: data.idType,
                idNumber: data.idNumber,
                idFile: {
                  url: "", // This will be handled by file upload
                  fileName: "",
                },
              }
            : undefined,
        isActiveInMarketplace: data.isActiveInMarketplace,
      };
    },
    []
  );

  // Manual save handler
  const handleSave = useCallback(async () => {
    if (isSaving || isSubmitting) return;

    setIsSaving(true);
    setSubmitError(null);

    try {
      const currentData = getValues();
      const transformedData = transformFormData(currentData);

      await updateProfile(transformedData);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      toast.info("Progress saved!, your changes have been saved successfully");
      // Reset form dirty state to reflect saved state
      reset(currentData, { keepValues: true });
    } catch (error) {
      console.error("Save failed:", error);

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

  // Save and continue to next step
  const handleSaveAndContinue = useCallback(async () => {
    await handleSave();

    if (!isSaving && !submitError) {
      const currentIndex = FORM_STEPS.findIndex(
        (step) => step.key === currentStep
      );
      if (currentIndex < FORM_STEPS.length - 1) {
        setCurrentStep(FORM_STEPS[currentIndex + 1].key);
      }
    }
  }, [handleSave, isSaving, submitError, currentStep]);

  // Initialize form with existing profile data
  useEffect(() => {
    if (profile && isInitialized) {
      const initialData: UpdateUserProfileFormData = {
        role: profile.role,
        bio: profile.bio || "",
        // Location fields (flattened)
        ghanaPostGPS: profile.location?.ghanaPostGPS || "",
        nearbyLandmark: profile.location?.nearbyLandmark || "",
        region: profile.location?.region || "",
        city: profile.location?.city || "",
        district: profile.location?.district || "",
        locality: profile.location?.locality || "",
        other: profile.location?.other || "",
        gpsCoordinates: profile.location?.gpsCoordinates,
        // Contact fields (flattened)
        primaryContact: profile.contactDetails?.primaryContact || "",
        secondaryContact: profile.contactDetails?.secondaryContact || "",
        businessEmail: profile.contactDetails?.businessEmail || "",
        // Social media
        socialMediaHandles: profile.socialMediaHandles || [],
        // ID fields (flattened)
        idType: profile.idDetails?.idType,
        idNumber: profile.idDetails?.idNumber || "",
        // Marketplace status
        isActiveInMarketplace: profile.isActiveInMarketplace || false,
      };

      reset(initialData);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    }
  }, [profile, isInitialized, reset]);

  // Update step errors when form errors change
  useEffect(() => {
    const newStepErrors: Record<FormStep, string[]> = {
      [FormStep.BASIC_INFO]: [],
      [FormStep.LOCATION]: [],
      [FormStep.CONTACT]: [],
      [FormStep.IDENTIFICATION]: [],
      [FormStep.REVIEW]: [],
    };

    Object.entries(errors).forEach(([field, error]) => {
      if (error?.message) {
        const step = getStepForField(field);
        if (step) {
          newStepErrors[step].push(error.message);
        }
      }
    });

    setStepErrors(newStepErrors);
  }, [errors]);

  // Get step for a specific field
  const getStepForField = (field: string): FormStep | null => {
    const stepFieldMap: Record<FormStep, string[]> = {
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

    for (const [step, fields] of Object.entries(stepFieldMap)) {
      if (fields.some((f) => field.startsWith(f))) {
        return step as FormStep;
      }
    }
    return null;
  };

  // Navigation functions
  const goToStep = useCallback((step: FormStep) => {
    setCurrentStep(step);
  }, []);

  const goToNextStep = useCallback(() => {
    const currentIndex = FORM_STEPS.findIndex(
      (step) => step.key === currentStep
    );

    if (currentIndex < FORM_STEPS.length - 1) {
      goToStep(FORM_STEPS[currentIndex + 1].key);
    }
  }, [currentStep, goToStep]);

  const goToPrevStep = useCallback(() => {
    const currentIndex = FORM_STEPS.findIndex(
      (step) => step.key === currentStep
    );
    if (currentIndex > 0) {
      goToStep(FORM_STEPS[currentIndex - 1].key);
    }
  }, [currentStep, goToStep]);

  // Main submission handler (Complete Profile)
  const onSubmit = useCallback(
    async (data: UpdateUserProfileFormData) => {
      if (isSubmitting) return;

      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const submitData = transformFormData(data);

        toast.info("Completing your profile...");
        await updateProfile(submitData);
        await refreshProfile();

        toast.success(
          "Profile completed successfully!, You can always update your,information later."
        );

        setLastSaved(new Date());
        setHasUnsavedChanges(false);

        if (redirectOnSuccess) {
          router.push(redirectOnSuccess);
        }
      } catch (error: unknown) {
        console.error("Profile submission error:", error);

        const errorMessage =
          error instanceof Error
            ? error.message
            : typeof error === "string"
            ? error
            : "Failed to complete profile";

        setSubmitError(errorMessage);
        toast.error(errorMessage);

        if (
          errorMessage === "AUTHENTICATION_ERROR" ||
          errorMessage.includes("authentication")
        ) {
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
      redirectOnSuccess,
      router,
    ]
  );

  // Calculate current completeness using the schema function
  const currentCompleteness = React.useMemo(() => {
    if (!formData) return 0;
    return calculateUserProfileCompleteness(formData).percentage;
  }, [formData]);

  // Get step completeness
  const getStepCompleteness = useCallback(
    (step: FormStep): number => {
      if (!formData) return 0;

      switch (step) {
        case FormStep.BASIC_INFO:
          return (((formData.role ? 1 : 0) + (formData.bio ? 1 : 0)) / 2) * 100;
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

  // Handle edit navigation from Review step
  const handleEdit = useCallback((section: ProfileSection) => {
    switch (section) {
      case "basic-info":
        setCurrentStep(FormStep.BASIC_INFO);
        break;
      case "location":
        setCurrentStep(FormStep.LOCATION);
        break;
      case "contact":
        setCurrentStep(FormStep.CONTACT);
        break;
      case "identification":
        setCurrentStep(FormStep.IDENTIFICATION);
        break;
    }
  }, []);

  // Loading state
  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
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
  if (error && !profile) {
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
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-md transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const currentStepIndex = FORM_STEPS.findIndex(
    (step) => step.key === currentStep
  );
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === FORM_STEPS.length - 1;

  return (
    <div className="max-h-screen overflow-auto bg-gray-50 dark:bg-gray-900 py-4 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6 transition-colors">
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
              style={{ width: `${currentCompleteness}%` }}></div>
          </div>

          {/* Step indicators */}
          <div className="grid grid-cols-5 gap-2">
            {FORM_STEPS.map((step) => {
              const stepCompleteness = getStepCompleteness(step.key);
              const hasErrors = stepErrors[step.key].length > 0;
              const isActive = step.key === currentStep;

              return (
                <div
                  key={step.key}
                  className={`relative cursor-pointer p-3 rounded-lg border transition-all ${
                    isActive
                      ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-950"
                      : hasErrors
                      ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 hover:bg-red-100 dark:hover:bg-red-900"
                      : stepCompleteness > 0
                      ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 hover:bg-green-100 dark:hover:bg-green-900"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750"
                  }`}
                  onClick={() => goToStep(step.key)}>
                  <div className="text-center">
                    <div className="text-2xl mb-1">{step.icon}</div>
                    <div className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-1">
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                      {step.description}
                    </div>

                    {/* Step progress indicator */}
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1">
                      <div
                        className={`h-1 rounded-full transition-all ${
                          hasErrors
                            ? "bg-red-400 dark:bg-red-500"
                            : "bg-green-400 dark:bg-green-500"
                        }`}
                        style={{ width: `${stepCompleteness}%` }}></div>
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
                  Don&apos;t forget to save your progress before moving to
                  another section or leaving the page.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Form */}
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
              {/* Error Display */}
              {submitError && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
                  <div className="text-red-800 dark:text-red-200">
                    {submitError}
                  </div>
                </div>
              )}

              {/* Current Step Info */}
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">
                    {FORM_STEPS.find((s) => s.key === currentStep)?.icon}
                  </span>
                  <div>
                    <h3 className="font-medium text-blue-900 dark:text-blue-100">
                      {FORM_STEPS.find((s) => s.key === currentStep)?.title}
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {
                        FORM_STEPS.find((s) => s.key === currentStep)
                          ?.description
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Step Content */}
              <div className="max-h-[450px] overflow-auto">
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
                  <p className="text-sm mt-2">Current step: {currentStep}</p>
                  <p className="text-sm">
                    Completeness: {getStepCompleteness(currentStep)}%
                  </p>
                  {stepErrors[currentStep].length > 0 && (
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
              <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={goToPrevStep}
                    disabled={isFirstStep}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    ← Previous
                  </button>

                  {!isLastStep && (
                    <button
                      type="button"
                      onClick={goToNextStep}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 border border-transparent rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors">
                      Next →
                    </button>
                  )}
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving || isSubmitting || !hasUnsavedChanges}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    {isSaving ? "Saving..." : "Save Progress"}
                  </button>

                  {!isLastStep && (
                    <button
                      type="button"
                      onClick={handleSaveAndContinue}
                      disabled={isSaving || isSubmitting}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 border border-transparent rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                      {isSaving ? "Saving..." : "Save & Continue"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
