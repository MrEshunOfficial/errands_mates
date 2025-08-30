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
import BasicInfoFormStep from "@/components/profile/form/BasicInformationStep";
import ContactFormStep from "@/components/profile/form/ContactFormStep";
import LocationFormStep from "@/components/profile/form/LocationFormStep";
import ReviewFormStep from "@/components/profile/form/ReviewFormStep";

export enum FormStep {
  BASIC_INFO = "basic-info",
  LOCATION = "location",
  CONTACT = "contact",
  REVIEW = "review",
}

interface FormStepConfig {
  key: FormStep;
  title: string;
  description: string;
  icon: string;
  required: boolean;
  shortDescription: string;
}

const FORM_STEPS: FormStepConfig[] = [
  {
    key: FormStep.BASIC_INFO,
    title: "Basic Information",
    description: "Tell us about yourself",
    shortDescription: "Your role and bio",
    icon: "👤",
    required: true,
  },
  {
    key: FormStep.LOCATION,
    title: "Location Details",
    description: "Where are you located?",
    shortDescription: "Your location information",
    icon: "📍",
    required: true,
  },
  {
    key: FormStep.CONTACT,
    title: "Contact Information",
    description: "How can we reach you?",
    shortDescription: "Phone, email & social media",
    icon: "📞",
    required: true,
  },
  {
    key: FormStep.REVIEW,
    title: "Review & Complete",
    description: "Review your information",
    shortDescription: "Final review",
    icon: "✅",
    required: false,
  },
];

type ProfileSection = "basic-info" | "location" | "contact";

interface ProfileFormPageProps {
  isEditing?: boolean;
  redirectOnSuccess?: string;
}

import type { UpdateProfileData } from "@/lib/api/profiles/profile.api";
import { IUserProfile } from "@/types";
import { useIdDetails } from "@/hooks/id-details/useIdDetails";
import ProfileCard from "@/components/profile/form/ProfileCard";
import LoadingOverlay from "@/components/ui/LoadingOverlay";

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
  isActiveInMarketplace?: boolean;
}

type ApiProfileData = UpdateProfileData extends never
  ? FallbackUpdateProfileData
  : UpdateProfileData;

// Progressive Step Completion Component
interface ProgressiveStepProps {
  step: FormStepConfig;
  isCompleted: boolean;
  isActive: boolean;
  completeness: number;
  onActivate: () => void;
}

const ProgressiveStep: React.FC<ProgressiveStepProps> = ({
  step,
  isCompleted,
  isActive,
  onActivate,
}) => {
  if (isCompleted && !isActive) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-2xl p-6 transition-all duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {step.title}
              </h3>
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                Completed
              </p>
            </div>
          </div>
          <button
            onClick={onActivate}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline transition-colors"
          >
            Edit
          </button>
        </div>
      </div>
    );
  }

  return null;
};

// Skip Warning Modal Component
interface SkipWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  stepTitle: string;
}

const SkipWarningModal: React.FC<SkipWarningModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  stepTitle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Skip {stepTitle}?
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            You&apos;re about to skip an important section. Without complete
            profile information:
          </p>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-xl p-4 mb-6">
          <ul className="text-sm text-orange-800 dark:text-orange-200 space-y-2">
            <li className="flex items-start">
              <span className="text-orange-500 mr-2">•</span>
              Limited access to marketplace features
            </li>
            <li className="flex items-start">
              <span className="text-orange-500 mr-2">•</span>
              Reduced visibility to potential connections
            </li>
            <li className="flex items-start">
              <span className="text-orange-500 mr-2">•</span>
              May miss important opportunities
            </li>
          </ul>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors"
          >
            Continue Filling
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 rounded-xl transition-all"
          >
            Skip for Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ProgressiveProfileForm({
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

  const {
    hasIdDetails,
    isComplete: isIdComplete,
    hasValidationErrors: hasIdValidationErrors,
  } = useIdDetails();

  const [currentStep, setCurrentStep] = useState<FormStep>(FormStep.BASIC_INFO);
  const [completedSteps, setCompletedSteps] = useState<Set<FormStep>>(
    new Set()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSkipWarning, setShowSkipWarning] = useState(false);

  const safeProfile = profile as IUserProfile | null | undefined;

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
    formState: { isDirty },
    reset,
    watch,
    getValues,
  } = methods;

  const formData = watch();

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

      const profileData: Partial<IUserProfile> = {};

      if (data.bio !== undefined) {
        profileData.bio = data.bio;
      }

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

      if (data.primaryContact) {
        profileData.contactDetails = {
          primaryContact: data.primaryContact,
          ...(data.secondaryContact && {
            secondaryContact: data.secondaryContact,
          }),
          ...(data.businessEmail && { businessEmail: data.businessEmail }),
        };
      }

      if (data.socialMediaHandles?.length) {
        profileData.socialMediaHandles = data.socialMediaHandles.filter(
          (h): h is { nameOfSocial: string; userName: string } =>
            Boolean(h.nameOfSocial && h.userName)
        );
      }

      if (data.isActiveInMarketplace !== undefined) {
        profileData.isActiveInMarketplace = data.isActiveInMarketplace;
      }

      if (data.role !== undefined) {
        profileData.role = data.role;
      }

      return {
        profile: profileData,
      } as ApiProfileData;
    },
    []
  );

  const handleSave = useCallback(async (): Promise<void> => {
    if (isSaving || isSubmitting) return;

    setIsSaving(true);
    setSubmitError(null);

    try {
      const transformedData = transformFormData(getValues());
      await updateProfile(transformedData);
      setLastSaved(new Date());
      toast.success("Progress saved successfully!");
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

        case FormStep.REVIEW:
          const requiredStepsComplete = FORM_STEPS.filter(
            (s) => s.required
          ).every((s) => getStepCompleteness(s.key) > 0);
          return requiredStepsComplete ? 100 : 0;

        default:
          return 0;
      }
    },
    [formData]
  );

  const currentCompleteness = useMemo((): number => {
    if (!formData) return 0;

    const profileCompleteness =
      calculateUserProfileCompleteness(formData).percentage;

    let idBonus = 0;
    if (hasIdDetails && isIdComplete() && !hasIdValidationErrors()) {
      idBonus = 15;
    } else if (hasIdDetails) {
      idBonus = 7;
    }

    return Math.min(100, profileCompleteness + idBonus);
  }, [formData, hasIdDetails, isIdComplete, hasIdValidationErrors]);

  const handleStepComplete = useCallback(async (): Promise<void> => {
    await handleSave();

    if (!isSaving && !submitError) {
      const newCompletedSteps = new Set(completedSteps);
      newCompletedSteps.add(currentStep);
      setCompletedSteps(newCompletedSteps);

      // Move to next step
      const currentIndex = FORM_STEPS.findIndex(
        (step) => step.key === currentStep
      );
      if (currentIndex < FORM_STEPS.length - 1) {
        setCurrentStep(FORM_STEPS[currentIndex + 1].key);
      }
    }
  }, [handleSave, isSaving, submitError, completedSteps, currentStep]);

  const handleSkip = useCallback((): void => {
    setShowSkipWarning(true);
  }, []);

  const confirmSkip = useCallback((): void => {
    setShowSkipWarning(false);

    // If this is the last required step, go to dashboard with warning
    const currentIndex = FORM_STEPS.findIndex(
      (step) => step.key === currentStep
    );
    if (currentIndex < FORM_STEPS.length - 1) {
      setCurrentStep(FORM_STEPS[currentIndex + 1].key);
    } else {
      toast.warning(
        "Profile incomplete. Complete it later to unlock all features."
      );
      router.push(redirectOnSuccess);
    }
  }, [currentStep, router, redirectOnSuccess]);

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

  const handleEdit = useCallback((section: ProfileSection): void => {
    const stepMap: Record<ProfileSection, FormStep> = {
      "basic-info": FormStep.BASIC_INFO,
      location: FormStep.LOCATION,
      contact: FormStep.CONTACT,
    };
    setCurrentStep(stepMap[section]);
  }, []);

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
        isActiveInMarketplace: safeProfile.isActiveInMarketplace || false,
      };

      reset(initialData);
      setLastSaved(new Date());

      // Mark completed steps based on existing data - calculate directly here
      const newCompletedSteps = new Set<FormStep>();
      FORM_STEPS.forEach((step) => {
        let stepCompleteness = 0;
        switch (step.key) {
          case FormStep.BASIC_INFO:
            const bioComplete = Boolean(
              initialData.bio && initialData.bio.trim()
            );
            const roleComplete = Boolean(initialData.role);
            stepCompleteness =
              ((Number(bioComplete) + Number(roleComplete)) / 2) * 100;
            break;
          case FormStep.LOCATION:
            stepCompleteness = initialData.ghanaPostGPS ? 100 : 0;
            break;
          case FormStep.CONTACT:
            stepCompleteness = initialData.primaryContact ? 100 : 0;
            break;
          case FormStep.REVIEW:
            const requiredStepsComplete = [
              FormStep.BASIC_INFO,
              FormStep.LOCATION,
              FormStep.CONTACT,
            ].every((s) => {
              switch (s) {
                case FormStep.BASIC_INFO:
                  return (
                    Boolean(initialData.bio && initialData.bio.trim()) &&
                    Boolean(initialData.role)
                  );
                case FormStep.LOCATION:
                  return Boolean(initialData.ghanaPostGPS);
                case FormStep.CONTACT:
                  return Boolean(initialData.primaryContact);
                default:
                  return false;
              }
            });
            stepCompleteness = requiredStepsComplete ? 100 : 0;
            break;
        }

        if (stepCompleteness >= 100) {
          newCompletedSteps.add(step.key);
        }
      });
      setCompletedSteps(newCompletedSteps);
    }
  }, [safeProfile, isInitialized, reset]);

  if (isLoading || !isInitialized) {
    return (
      <LoadingOverlay show={true} message="Loading profile please wait..." />
    );
  }

  if (error && !safeProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-red-900">
        <div className="text-center space-y-6 max-w-md mx-auto px-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Unable to Load Profile
            </h2>
            <p className="text-gray-600 dark:text-gray-300">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all transform hover:scale-105 shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const currentStepConfig = FORM_STEPS.find((s) => s.key === currentStep);
  const hasUnsavedChanges = isDirty;

  return (
    <>
      <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-blue-900 max-h-[920px] p-4 overflow-auto hide-scrollbar">
        <div className="container max-w-4xl mx-auto p-4">
          {/* Header Section */}
          <ProfileCard
            isEditing={isEditing}
            currentCompleteness={currentCompleteness}
            hasIdDetails={hasIdDetails}
            isIdComplete={isIdComplete}
          />

          {/* Progressive Steps Display */}
          <div className="space-y-4 mb-8">
            {FORM_STEPS.map((step) => {
              const isCompleted = completedSteps.has(step.key);
              const isActive = step.key === currentStep;
              const completeness = getStepCompleteness(step.key);

              return (
                <ProgressiveStep
                  key={step.key}
                  step={step}
                  isCompleted={isCompleted}
                  isActive={isActive}
                  completeness={completeness}
                  onActivate={() => setCurrentStep(step.key)}
                />
              );
            })}
          </div>

          {/* Current Active Step */}
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {submitError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-6 m-6 rounded-lg">
                    <div className="flex">
                      <div className="text-red-400 text-xl mr-3">⚠️</div>
                      <div className="text-red-800 dark:text-red-200 font-medium">
                        {submitError}
                      </div>
                    </div>
                  </div>
                )}

                {/* Current Step Header */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700 p-8">
                  <div className="flex items-center space-x-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg">
                      {currentStepConfig?.icon}
                    </div>
                    <div className="flex-1">
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        {currentStepConfig?.title}
                      </h1>
                      <p className="text-lg text-gray-600 dark:text-gray-400">
                        {currentStepConfig?.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {Math.round(getStepCompleteness(currentStep))}%
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Complete
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-6">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${getStepCompleteness(currentStep)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Form Content */}
                <div className="p-8">
                  <div className="max-w-2xl mx-auto">
                    {currentStep === FormStep.BASIC_INFO && (
                      <BasicInfoFormStep />
                    )}
                    {currentStep === FormStep.CONTACT && <ContactFormStep />}
                    {currentStep === FormStep.LOCATION && <LocationFormStep />}
                    {currentStep === FormStep.REVIEW && (
                      <ReviewFormStep
                        isSubmitting={isSubmitting}
                        onEdit={handleEdit}
                      />
                    )}
                  </div>
                </div>

                {/* Action Footer */}
                <div className="bg-gray-50 dark:bg-gray-700 px-8 py-6 border-t border-gray-200 dark:border-gray-600">
                  <div className="max-w-2xl mx-auto">
                    {currentStep !== FormStep.REVIEW ? (
                      <div className="flex flex-col sm:flex-row gap-4">
                        <button
                          type="button"
                          onClick={handleStepComplete}
                          disabled={
                            isSaving ||
                            isSubmitting ||
                            getStepCompleteness(currentStep) === 0
                          }
                          className="flex-1 flex items-center justify-center px-6 py-4 text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl font-semibold transition-all shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          {isSaving ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                              Saving & Continuing...
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-5 h-5 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              Complete {currentStepConfig?.title}
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={handleSkip}
                          disabled={isSaving || isSubmitting}
                          className="px-6 py-4 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 font-medium transition-colors disabled:opacity-50"
                        >
                          Skip for now
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-4">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex-1 flex items-center justify-center px-8 py-4 text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl font-semibold transition-all shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                              Completing Profile...
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-5 h-5 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              Complete Profile
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            toast.warning(
                              "Profile incomplete. Complete it later to unlock all features."
                            );
                            router.push(redirectOnSuccess);
                          }}
                          disabled={isSubmitting}
                          className="px-6 py-4 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 font-medium transition-colors disabled:opacity-50"
                        >
                          Go to Dashboard
                        </button>
                      </div>
                    )}

                    {/* Additional Info */}
                    <div className="mt-6 text-center">
                      {hasUnsavedChanges && (
                        <div className="flex items-center justify-center text-orange-600 dark:text-orange-400 text-sm mb-3">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse" />
                          You have unsaved changes
                        </div>
                      )}

                      {lastSaved && (
                        <div className="flex items-center justify-center text-green-600 dark:text-green-400 text-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                          Last saved: {lastSaved.toLocaleTimeString()}
                        </div>
                      )}
                    </div>

                    {/* Step Navigation Hint */}
                    {currentStep !== FormStep.REVIEW && (
                      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
                        <div className="flex items-start space-x-3">
                          <div className="w-5 h-5 text-blue-500 mt-0.5">
                            <svg
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                              <strong>Why complete your profile?</strong> A
                              complete profile gives you access to all
                              marketplace features, increases your visibility to
                              potential connections, and helps others trust and
                              engage with you.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </FormProvider>

          {/* Next Steps Preview */}
          {currentStep !== FormStep.REVIEW && (
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                What&apos;s Next?
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {FORM_STEPS.slice(
                  FORM_STEPS.findIndex((s) => s.key === currentStep) + 1
                ).map((step) => {
                  const isCompleted = completedSteps.has(step.key);
                  return (
                    <div
                      key={step.key}
                      className={`p-4 rounded-xl border transition-all ${
                        isCompleted
                          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700"
                          : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${
                            isCompleted
                              ? "bg-green-100 dark:bg-green-800"
                              : "bg-gray-100 dark:bg-gray-600"
                          }`}
                        >
                          {isCompleted ? "✅" : step.icon}
                        </div>
                        <div className="flex-1">
                          <h4
                            className={`font-medium text-sm ${
                              isCompleted
                                ? "text-green-800 dark:text-green-200"
                                : "text-gray-900 dark:text-gray-100"
                            }`}
                          >
                            {step.title}
                          </h4>
                          <p
                            className={`text-xs ${
                              isCompleted
                                ? "text-green-600 dark:text-green-400"
                                : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {step.shortDescription}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Profile Completion Benefits */}
          {currentCompleteness < 100 && (
            <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-700">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg flex-shrink-0">
                  🎯
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                    Unlock Your Full Potential
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700 dark:text-gray-300">
                        <strong>Marketplace Access:</strong> List services,
                        products, and connect with customers
                      </span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700 dark:text-gray-300">
                        <strong>Priority Support:</strong> Get faster responses
                        and dedicated assistance
                      </span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700 dark:text-gray-300">
                        <strong>Enhanced Visibility:</strong> Appear higher in
                        search results and recommendations
                      </span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700 dark:text-gray-300">
                        <strong>Trust Indicators:</strong> Verified badge and
                        credibility scores
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Skip Warning Modal */}
      <SkipWarningModal
        isOpen={showSkipWarning}
        onClose={() => setShowSkipWarning(false)}
        onConfirm={confirmSkip}
        stepTitle={currentStepConfig?.title || ""}
      />
    </>
  );
}
