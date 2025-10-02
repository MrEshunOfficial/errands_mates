"use client";
import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ZodError } from "zod";
import {
  useMyProviderProfile,
  useProviderProfile,
} from "@/hooks/providerProfiles/use-provider-profile";
import {
  createProviderProfileSchema,
  updateProviderProfileSchema,
} from "@/lib/utils/schemas/provider.profile.schema";
import {
  ProviderProfile,
  UpdateProviderProfileRequestBody,
  CreateProviderProfileRequestBody,
} from "@/types";

export interface ProviderProfileFormData {
  providerContactInfo: {
    primaryContact: string;
    secondaryContact?: string;
    businessEmail?: string;
    emergencyContact?: string;
  };
  operationalStatus?: string;
  serviceOfferings?: Array<{ _id: string }>;
  workingHours?: Record<
    string,
    {
      start: string;
      end: string;
      isAvailable: boolean;
    }
  >;
  isAvailableForWork: boolean;
  isAlwaysAvailable: boolean;
  businessName?: string;
  businessRegistration?: {
    registrationNumber: string;
    registrationDocument: {
      url: string;
      fileName: string;
      fileSize?: number;
      mimeType?: string;
      uploadedAt?: string | Date;
    };
  };
  insurance?: {
    provider: string;
    policyNumber: string;
    expiryDate: string | Date;
    document: {
      url: string;
      fileName: string;
      fileSize?: number;
      mimeType?: string;
      uploadedAt?: string | Date;
    };
  };
  safetyMeasures: {
    requiresDeposit: boolean;
    depositAmount?: number;
    hasInsurance: boolean;
    insuranceProvider?: string;
    insuranceExpiryDate?: string | Date;
    emergencyContactVerified: boolean;
  };
  performanceMetrics?: {
    completionRate: number;
    averageRating: number;
    totalJobs: number;
    responseTimeMinutes: number;
    averageResponseTime: number;
    cancellationRate: number;
    disputeRate: number;
    clientRetentionRate: number;
  };
  riskLevel?: string;
  lastRiskAssessmentDate?: string | Date;
  riskAssessedBy?: string;
  penaltiesCount?: number;
  lastPenaltyDate?: string | Date;
}

export interface ProviderProfileFormState {
  currentStep: number;
  formData: Partial<ProviderProfileFormData>;
  validationErrors: Record<string, string[]>;
  isSubmitting: boolean;
  submitError: string | null;
  submitSuccess: boolean;
}

export interface ProviderProfileFormProps {
  mode: "create" | "edit";
  initialData?: Partial<ProviderProfile>;
  onSuccess?: (profile: ProviderProfile) => void;
  onError?: (error: string) => void;
  redirectOnSuccess?: string;
  children: (props: ProviderProfileFormChildProps) => React.ReactNode;
}

export interface ProviderProfileFormChildProps {
  formState: ProviderProfileFormState;
  formData: Partial<ProviderProfileFormData>;
  validationErrors: Record<string, string[]>;
  isSubmitting: boolean;
  submitError: string | null;
  submitSuccess: boolean;
  currentStep: number;
  totalSteps: number;
  updateFormData: (data: Partial<ProviderProfileFormData>) => void;
  updateFieldValue: (field: string, value: unknown) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  goToStep: (step: number) => void;
  validateCurrentStep: () => boolean;
  validateField: (field: string) => boolean;
  clearFieldError: (field: string) => void;
  clearAllErrors: () => void;
  handleSubmit: () => Promise<void>;
  resetForm: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
}

const TOTAL_STEPS = 5;

const getInitialFormData = (
  mode: "create" | "edit",
  initialData?: Partial<ProviderProfile>
): Partial<ProviderProfileFormData> => {
  if (mode === "edit" && initialData) {
    return {
      providerContactInfo: initialData.providerContactInfo || {
        primaryContact: "",
      },
      operationalStatus: initialData.operationalStatus,
      serviceOfferings: initialData.serviceOfferings?.map((service) => ({
        _id: typeof service === "string" ? service : service.toString(),
      })),
      workingHours: initialData.workingHours,
      isAvailableForWork: initialData.isAvailableForWork ?? true,
      isAlwaysAvailable: initialData.isAlwaysAvailable ?? false,
      businessName: initialData.businessName,
      businessRegistration: initialData.businessRegistration,
      insurance: initialData.insurance,
      safetyMeasures: initialData.safetyMeasures || {
        requiresDeposit: false,
        hasInsurance: false,
        emergencyContactVerified: false,
      },
      performanceMetrics: initialData.performanceMetrics,
      riskLevel: initialData.riskLevel,
      lastRiskAssessmentDate: initialData.lastRiskAssessmentDate,
      riskAssessedBy: initialData.riskAssessedBy?.toString(),
      penaltiesCount: initialData.penaltiesCount,
      lastPenaltyDate: initialData.lastPenaltyDate,
    };
  }

  return {
    providerContactInfo: {
      primaryContact: "",
    },
    isAvailableForWork: true,
    isAlwaysAvailable: false,
    safetyMeasures: {
      requiresDeposit: false,
      hasInsurance: false,
      emergencyContactVerified: false,
    },
  };
};

export const ProviderProfileFormLogic: React.FC<ProviderProfileFormProps> = ({
  mode,
  initialData,
  onSuccess,
  onError,
  redirectOnSuccess,
  children,
}) => {
  const router = useRouter();

  // Use appropriate hook based on mode
  const createHook = useProviderProfile({ autoLoad: false });
  const editHook = useMyProviderProfile({ autoLoad: mode === "edit" });

  // Select the appropriate hook methods based on mode
  const {
    loading,
    error: hookError,
    success: hookSuccess,
    clearError,
    clearSuccess,
  } = mode === "create" ? createHook : editHook;

  const createProfile =
    mode === "create" ? createHook.createProfile : undefined;
  const updateProfile = mode === "edit" ? editHook.updateProfile : undefined;
  const profile = mode === "edit" ? editHook.profile : undefined;

  const [formState, setFormState] = useState<ProviderProfileFormState>({
    currentStep: 0,
    formData: getInitialFormData(mode, initialData),
    validationErrors: {},
    isSubmitting: false,
    submitError: null,
    submitSuccess: false,
  });

  // Load profile data in edit mode
  useEffect(() => {
    if (mode === "edit" && profile && !initialData) {
      setFormState((prev) => ({
        ...prev,
        formData: getInitialFormData("edit", profile),
      }));
    }
  }, [mode, profile, initialData]);

  // Handle hook errors
  useEffect(() => {
    if (hookError) {
      setFormState((prev) => ({
        ...prev,
        submitError: hookError,
        isSubmitting: false,
      }));
      onError?.(hookError);
    }
  }, [hookError, onError]);

  // Handle hook success
  useEffect(() => {
    if (hookSuccess && formState.isSubmitting) {
      setFormState((prev) => ({
        ...prev,
        submitSuccess: true,
        isSubmitting: false,
      }));

      if (mode === "edit" && profile) {
        onSuccess?.(profile);
      }

      if (redirectOnSuccess) {
        setTimeout(() => {
          router.push(redirectOnSuccess);
        }, 1500);
      }

      clearSuccess();
    }
  }, [
    hookSuccess,
    formState.isSubmitting,
    mode,
    profile,
    onSuccess,
    redirectOnSuccess,
    router,
    clearSuccess,
  ]);

  const updateFormData = useCallback(
    (data: Partial<ProviderProfileFormData>) => {
      setFormState((prev) => ({
        ...prev,
        formData: {
          ...prev.formData,
          ...data,
        },
      }));
    },
    []
  );

  const updateFieldValue = useCallback((field: string, value: unknown) => {
    setFormState((prev) => {
      const fieldParts = field.split(".");
      let updatedData: Record<string, unknown> = { ...prev.formData };

      if (fieldParts.length === 1) {
        updatedData = {
          ...updatedData,
          [field]: value,
        };
      } else {
        let current: Record<string, unknown> = updatedData;
        for (let i = 0; i < fieldParts.length - 1; i++) {
          const part = fieldParts[i];
          current[part] = { ...(current[part] as Record<string, unknown>) };
          current = current[part] as Record<string, unknown>;
        }
        current[fieldParts[fieldParts.length - 1]] = value;
      }

      return {
        ...prev,
        formData: updatedData as typeof prev.formData,
      };
    });
  }, []);

  const validateFormData = useCallback(
    (data: Partial<ProviderProfileFormData>): boolean => {
      try {
        if (mode === "create") {
          createProviderProfileSchema.parse(data);
        } else {
          updateProviderProfileSchema.parse(data);
        }

        setFormState((prev) => ({ ...prev, validationErrors: {} }));
        return true;
      } catch (error) {
        if (error instanceof ZodError) {
          const errors: Record<string, string[]> = {};

          error.issues.forEach((issue) => {
            const path = issue.path.join(".");
            if (!errors[path]) {
              errors[path] = [];
            }
            errors[path].push(issue.message);
          });

          setFormState((prev) => ({ ...prev, validationErrors: errors }));
        }
        return false;
      }
    },
    [mode]
  );

  const validateCurrentStep = useCallback((): boolean => {
    return validateFormData(formState.formData);
  }, [formState.formData, validateFormData]);

  const validateField = useCallback(
    (field: string): boolean => {
      try {
        const schema =
          mode === "create"
            ? createProviderProfileSchema
            : updateProviderProfileSchema;
        schema.parse(formState.formData);

        setFormState((prev) => {
          const newErrors = { ...prev.validationErrors };
          delete newErrors[field];
          return { ...prev, validationErrors: newErrors };
        });
        return true;
      } catch (error: unknown) {
        if (error instanceof ZodError) {
          const fieldError = error.issues.find(
            (err) => err.path.join(".") === field
          );
          if (fieldError) {
            setFormState((prev) => ({
              ...prev,
              validationErrors: {
                ...prev.validationErrors,
                [field]: [fieldError.message],
              },
            }));
            return false;
          }
        }

        return true;
      }
    },
    [formState.formData, mode]
  );

  const clearFieldError = useCallback((field: string) => {
    setFormState((prev) => {
      const newErrors = { ...prev.validationErrors };
      delete newErrors[field];
      return { ...prev, validationErrors: newErrors };
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setFormState((prev) => ({
      ...prev,
      validationErrors: {},
      submitError: null,
    }));
    clearError();
  }, [clearError]);

  const goToNextStep = useCallback(() => {
    if (formState.currentStep < TOTAL_STEPS - 1) {
      setFormState((prev) => ({
        ...prev,
        currentStep: prev.currentStep + 1,
      }));
    }
  }, [formState.currentStep]);

  const goToPreviousStep = useCallback(() => {
    if (formState.currentStep > 0) {
      setFormState((prev) => ({
        ...prev,
        currentStep: prev.currentStep - 1,
      }));
    }
  }, [formState.currentStep]);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < TOTAL_STEPS) {
      setFormState((prev) => ({
        ...prev,
        currentStep: step,
      }));
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    clearAllErrors();

    if (!validateFormData(formState.formData)) {
      setFormState((prev) => ({
        ...prev,
        submitError: "Please fix validation errors before submitting",
      }));
      return;
    }

    setFormState((prev) => ({
      ...prev,
      isSubmitting: true,
      submitError: null,
    }));

    try {
      if (mode === "create" && createProfile) {
        const response = await createProfile(
          formState.formData as CreateProviderProfileRequestBody
        );

        setFormState((prev) => ({
          ...prev,
          submitSuccess: true,
          isSubmitting: false,
        }));

        if (response.providerProfile) {
          onSuccess?.(response.providerProfile as ProviderProfile);
        }

        if (redirectOnSuccess) {
          setTimeout(() => {
            router.push(redirectOnSuccess);
          }, 1500);
        }
      } else if (mode === "edit" && updateProfile) {
        await updateProfile(
          formState.formData as UpdateProviderProfileRequestBody
        );
        // Success handled in useEffect
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setFormState((prev) => ({
        ...prev,
        submitError: errorMessage,
        isSubmitting: false,
      }));
      onError?.(errorMessage);
    }
  }, [
    formState.formData,
    mode,
    createProfile,
    updateProfile,
    onSuccess,
    onError,
    redirectOnSuccess,
    router,
    validateFormData,
    clearAllErrors,
  ]);

  const resetForm = useCallback(() => {
    setFormState({
      currentStep: 0,
      formData: getInitialFormData(mode, initialData),
      validationErrors: {},
      isSubmitting: false,
      submitError: null,
      submitSuccess: false,
    });
    clearAllErrors();
  }, [mode, initialData, clearAllErrors]);

  const childProps: ProviderProfileFormChildProps = {
    formState,
    formData: formState.formData,
    validationErrors: formState.validationErrors,
    isSubmitting: formState.isSubmitting || loading,
    submitError: formState.submitError,
    submitSuccess: formState.submitSuccess,
    currentStep: formState.currentStep,
    totalSteps: TOTAL_STEPS,
    updateFormData,
    updateFieldValue,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    validateCurrentStep,
    validateField,
    clearFieldError,
    clearAllErrors,
    handleSubmit,
    resetForm,
    canGoNext: formState.currentStep < TOTAL_STEPS - 1,
    canGoPrevious: formState.currentStep > 0,
    isFirstStep: formState.currentStep === 0,
    isLastStep: formState.currentStep === TOTAL_STEPS - 1,
  };

  return <>{children(childProps)}</>;
};

export default ProviderProfileFormLogic;
