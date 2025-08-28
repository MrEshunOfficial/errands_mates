// hooks/useIdDetails.ts
import {
  IdDetailsSummaryResponse,
  ValidationResult,
  idDetailsAPI,
} from "@/lib/api/identification-details/idDetails.api";
import { IdDetails, FileReference, idType } from "@/types";
import { useState, useCallback, useEffect } from "react";

// ===================================================================
// HOOK INTERFACE
// ===================================================================

export interface UseIdDetailsReturn {
  // Data state
  idDetails: IdDetails | null;
  summary: IdDetailsSummaryResponse["idDetails"] | null;
  validation: ValidationResult | null;
  hasIdDetails: boolean;

  // Loading states
  loading: boolean;
  updating: boolean;
  validating: boolean;
  removing: boolean;

  // Error states
  error: string | null;
  validationError: string | null;

  // Actions
  fetchIdDetails: () => Promise<void>;
  updateComplete: (idDetails: IdDetails) => Promise<void>;
  updateType: (idType: idType) => Promise<void>;
  updateNumber: (idNumber: string) => Promise<void>;
  updateFile: (idFile: FileReference) => Promise<void>;
  removeDetails: () => Promise<void>;
  validateDetails: () => Promise<void>;
  getSummary: () => Promise<void>;
  clearError: () => void;
  clearValidationError: () => void;

  // Utility functions
  isComplete: () => boolean;
  hasValidationErrors: () => boolean;
  getIdTypeOptions: () => { value: idType; label: string }[];
  validateFileStructure: (file: FileReference) => string[];
}

// ===================================================================
// CUSTOM HOOK
// ===================================================================

export const useIdDetails = (autoFetch: boolean = true): UseIdDetailsReturn => {
  // State management
  const [idDetails, setIdDetails] = useState<IdDetails | null>(null);
  const [summary, setSummary] = useState<
    IdDetailsSummaryResponse["idDetails"] | null
  >(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [hasIdDetails, setHasIdDetails] = useState<boolean>(false);

  // Loading states
  const [loading, setLoading] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);
  const [validating, setValidating] = useState<boolean>(false);
  const [removing, setRemoving] = useState<boolean>(false);

  // Error states
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Clear errors
  const clearError = useCallback(() => setError(null), []);
  const clearValidationError = useCallback(() => setValidationError(null), []);

  // Fetch ID details
  const fetchIdDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await idDetailsAPI.getIdDetails();

      if (response.hasIdDetails && response.idDetails) {
        setIdDetails(response.idDetails);
        setHasIdDetails(true);
      } else {
        setIdDetails(null);
        setHasIdDetails(false);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
      setIdDetails(null);
      setHasIdDetails(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update complete ID details
  const updateComplete = useCallback(async (newIdDetails: IdDetails) => {
    try {
      setUpdating(true);
      setError(null);
      const response = await idDetailsAPI.updateIdDetails({
        idDetails: newIdDetails,
      });

      if (response.idDetails) {
        setIdDetails(response.idDetails);
        setHasIdDetails(true);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setUpdating(false);
    }
  }, []);

  // Update ID type only
  const updateType = useCallback(async (idType: idType) => {
    try {
      setUpdating(true);
      setError(null);
      const response = await idDetailsAPI.updateIdType({ idType });

      if (response.profile?.idDetails) {
        setIdDetails(response.profile.idDetails);
        setHasIdDetails(true);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setUpdating(false);
    }
  }, []);

  // Update ID number only
  const updateNumber = useCallback(async (idNumber: string) => {
    try {
      setUpdating(true);
      setError(null);
      const response = await idDetailsAPI.updateIdNumber({ idNumber });

      if (response.profile?.idDetails) {
        setIdDetails(response.profile.idDetails);
        setHasIdDetails(true);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setUpdating(false);
    }
  }, []);

  // Update ID file only
  const updateFile = useCallback(async (idFile: FileReference) => {
    try {
      setUpdating(true);
      setError(null);
      const response = await idDetailsAPI.updateIdFile({ idFile });

      if (response.profile?.idDetails) {
        setIdDetails(response.profile.idDetails);
        setHasIdDetails(true);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setUpdating(false);
    }
  }, []);

  // Remove ID details
  const removeDetails = useCallback(async () => {
    try {
      setRemoving(true);
      setError(null);
      await idDetailsAPI.removeIdDetails();

      setIdDetails(null);
      setHasIdDetails(false);
      setValidation(null);
      setSummary(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setRemoving(false);
    }
  }, []);

  // Validate ID details
  const validateDetails = useCallback(async () => {
    try {
      setValidating(true);
      setValidationError(null);
      const response = await idDetailsAPI.validateIdDetails();

      if (response.validation) {
        setValidation(response.validation);
        setHasIdDetails(response.hasIdDetails || false);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setValidating(false);
    }
  }, []);

  // Get summary
  const getSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await idDetailsAPI.getIdDetailsSummary();

      if (response.hasIdDetails && response.idDetails) {
        setSummary(response.idDetails);
        setHasIdDetails(true);
      } else {
        setSummary(null);
        setHasIdDetails(false);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
      setSummary(null);
      setHasIdDetails(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Utility functions
  const isComplete = useCallback((): boolean => {
    return validation?.isComplete || false;
  }, [validation]);

  const hasValidationErrors = useCallback((): boolean => {
    return (validation?.errors?.length || 0) > 0;
  }, [validation]);

  const getIdTypeOptions = useCallback(() => {
    return idDetailsAPI.getIdTypeOptions();
  }, []);

  const validateFileStructure = useCallback((file: FileReference): string[] => {
    return idDetailsAPI.validateFileStructure(file);
  }, []);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchIdDetails();
    }
  }, [autoFetch, fetchIdDetails]);

  return {
    // Data state
    idDetails,
    summary,
    validation,
    hasIdDetails,

    // Loading states
    loading,
    updating,
    validating,
    removing,

    // Error states
    error,
    validationError,

    // Actions
    fetchIdDetails,
    updateComplete,
    updateType,
    updateNumber,
    updateFile,
    removeDetails,
    validateDetails,
    getSummary,
    clearError,
    clearValidationError,

    // Utility functions
    isComplete,
    hasValidationErrors,
    getIdTypeOptions,
    validateFileStructure,
  };
};
