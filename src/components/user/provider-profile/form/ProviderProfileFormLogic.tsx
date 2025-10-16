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
  ProviderOperationalStatus,
} from "@/types";
import { toast } from "sonner";

export interface ProviderProfileFormData {
  providerContactInfo: {
    businessContact?: string;
    businessEmail?: string;
  };
  operationalStatus: ProviderOperationalStatus;
  serviceOfferings: Array<{ _id: string }>;
  workingHours?: Record<
    string,
    {
      start: string;
      end: string;
    }
  >;
  isCurrentlyAvailable: boolean;
  isAlwaysAvailable: boolean;
  businessName?: string;
  requireInitialDeposit: boolean;
  percentageDeposit?: number;
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

const TOTAL_STEPS = 4;

const getInitialFormData = (
  mode: "create" | "edit",
  initialData?: Partial<ProviderProfile>
): Partial<ProviderProfileFormData> => {
  if (mode === "edit" && initialData) {
    return {
      providerContactInfo: initialData.providerContactInfo || {},
      operationalStatus:
        initialData.operationalStatus || ProviderOperationalStatus.PROBATIONARY,
      serviceOfferings:
        initialData.serviceOfferings?.map((service) => ({
          _id: typeof service === "string" ? service : service.toString(),
        })) || [],
      workingHours: initialData.workingHours,
      isCurrentlyAvailable: initialData.isCurrentlyAvailable ?? false,
      isAlwaysAvailable: initialData.isAlwaysAvailable ?? false,
      businessName: initialData.businessName,
      requireInitialDeposit: initialData.requireInitialDeposit ?? false,
      percentageDeposit: initialData.percentageDeposit,
      performanceMetrics: initialData.performanceMetrics,
    };
  }

  return {
    providerContactInfo: {},
    operationalStatus: ProviderOperationalStatus.PROBATIONARY,
    serviceOfferings: [],
    isCurrentlyAvailable: false,
    isAlwaysAvailable: false,
    requireInitialDeposit: false,
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
    // Validate the form data
    if (!validateFormData(formState.formData)) {
      toast.error("Validation failed. Errors:", formState.validationErrors);

      // Scroll to first error
      const firstErrorField = Object.keys(formState.validationErrors)[0];
      toast.error(`First error field: ${firstErrorField}`, {
        description: formState.validationErrors[firstErrorField],
      });

      setFormState((prev) => ({
        ...prev,
        submitError: `Please fix validation errors: ${Object.values(
          prev.validationErrors
        )
          .flat()
          .join(", ")}`,
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
        // Transform serviceOfferings to just string array of IDs
        const dataToSubmit = {
          ...formState.formData,
          serviceOfferings:
            formState.formData.serviceOfferings?.map((s) => s._id) || [],
        } as unknown as CreateProviderProfileRequestBody;

        const response = await createProfile(dataToSubmit);

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
        // Transform serviceOfferings to just string array of IDs
        const dataToSubmit = {
          ...formState.formData,
          serviceOfferings:
            formState.formData.serviceOfferings?.map((s) => s._id) || [],
        } as unknown as UpdateProviderProfileRequestBody;

        console.log(
          "Updating with data:",
          JSON.stringify(dataToSubmit, null, 2)
        );

        await updateProfile(dataToSubmit);
        // Success handled in useEffect
      }
    } catch (error) {
      console.error("Submission error:", error);
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
    clearAllErrors,
    formState.formData,
    formState.validationErrors,
    validateFormData,
    mode,
    createProfile,
    updateProfile,
    redirectOnSuccess,
    onSuccess,
    router,
    onError,
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
