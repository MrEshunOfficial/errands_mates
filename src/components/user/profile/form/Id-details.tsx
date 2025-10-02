"use client";
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useIdDetails } from "@/hooks/id-details/useIdDetails";
import { idType } from "@/types";
import { FileReference } from "@/lib/api/categories/categoryImage.api";

interface FormData {
  idType: idType;
  idNumber: string;
  idFile?: FileReference;
}

interface FormErrors {
  idType?: string;
  idNumber?: string;
  idFile?: string;
}

const IdDetailsUpdateForm: React.FC = () => {
  const {
    idDetails,
    hasIdDetails,
    loading,
    updating,
    validating,
    error,
    validationError,
    updateComplete,
    updateType,
    updateNumber,
    validateDetails,
    clearError,
    clearValidationError,
    getIdTypeOptions,
    validateFileStructure,
    isComplete,
    hasValidationErrors,
  } = useIdDetails();

  const [formData, setFormData] = useState<FormData>({
    idType: idType.NATIONAL_ID,
    idNumber: "",
    idFile: undefined,
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [fileInputKey, setFileInputKey] = useState(0);
  const [isDirty, setIsDirty] = useState(false);

  // Initialize form with existing data
  useEffect(() => {
    if (idDetails) {
      setFormData({
        idType: idDetails.idType,
        idNumber: idDetails.idNumber,
        idFile: idDetails.idFile,
      });
    }
  }, [idDetails]);

  const idTypeOptions = getIdTypeOptions();

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.idNumber.trim()) {
      errors.idNumber = "ID Number is required";
    } else if (formData.idNumber.length < 8) {
      errors.idNumber = "ID Number must be at least 8 characters";
    }

    if (formData.idFile) {
      const fileErrors = validateFileStructure(formData.idFile);
      if (fileErrors.length > 0) {
        errors.idFile = fileErrors.join(", ");
      }
    } else if (!hasIdDetails) {
      errors.idFile = "ID file is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (
    field: keyof FormData,
    value: string | idType | FileReference | undefined
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);

    // Clear specific field error when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ];

    if (file.size > maxSize) {
      setFormErrors((prev) => ({
        ...prev,
        idFile: "File size must be less than 5MB",
      }));
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setFormErrors((prev) => ({
        ...prev,
        idFile: "Only JPEG, PNG, and PDF files are allowed",
      }));
      return;
    }

    // Create FileReference object (in real app, you'd upload to server first)
    const fileReference: FileReference = {
      url: URL.createObjectURL(file),
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      uploadedAt: new Date(),
    };

    handleInputChange("idFile", fileReference);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await updateComplete(formData);
      setIsDirty(false);

      // Optional: Validate after update
      await validateDetails();
    } catch (err) {
      console.error("Failed to update ID details:", err);
    }
  };

  const handleQuickUpdate = async (
    field: "idType" | "idNumber",
    value: string | idType
  ) => {
    try {
      if (field === "idType") {
        if (typeof value === "string") {
          await updateType(value as idType);
        } else {
          await updateType(value);
        }
      } else if (field === "idNumber") {
        if (!value.toString().trim()) return;
        await updateNumber(value as string);
      }
      setIsDirty(false);
    } catch (err) {
      console.error(`Failed to update ${field}:`, err);
    }
  };

  const removeFile = () => {
    handleInputChange("idFile", undefined);
    setFileInputKey((prev) => prev + 1); // Reset file input
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {hasIdDetails ? "Update ID Details" : "Add ID Details"}
          </h2>
          <p className="text-gray-600 text-sm">
            Please provide your identification details for verification
            purposes.
          </p>
        </div>

        {/* Error Messages */}
        {(error || validationError) && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            {error && (
              <div className="flex items-center justify-between mb-2">
                <p className="text-red-700 text-sm">{error}</p>
                <button
                  onClick={clearError}
                  className="text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              </div>
            )}
            {validationError && (
              <div className="flex items-center justify-between">
                <p className="text-red-700 text-sm">{validationError}</p>
                <button
                  onClick={clearValidationError}
                  className="text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        )}

        <div className="space-y-6">
          {/* ID Type */}
          <div>
            <label
              htmlFor="idType"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              ID Type *
            </label>
            <select
              id="idType"
              value={formData.idType}
              onChange={(e) =>
                handleInputChange("idType", e.target.value as idType)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {idTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {formErrors.idType && (
              <p className="mt-1 text-sm text-red-600">{formErrors.idType}</p>
            )}
            <button
              type="button"
              onClick={() => handleQuickUpdate("idType", formData.idType)}
              disabled={updating || !isDirty}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400"
            >
              Quick Update Type
            </button>
          </div>

          {/* ID Number */}
          <div>
            <label
              htmlFor="idNumber"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              ID Number *
            </label>
            <input
              type="text"
              id="idNumber"
              value={formData.idNumber}
              onChange={(e) => handleInputChange("idNumber", e.target.value)}
              placeholder="Enter your ID number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {formErrors.idNumber && (
              <p className="mt-1 text-sm text-red-600">{formErrors.idNumber}</p>
            )}
            <button
              type="button"
              onClick={() => handleQuickUpdate("idNumber", formData.idNumber)}
              disabled={updating || !isDirty || !formData.idNumber.trim()}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400"
            >
              Quick Update Number
            </button>
          </div>

          {/* ID File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ID Document {!hasIdDetails && "*"}
            </label>

            {formData.idFile ? (
              <div className="border border-gray-300 rounded-md p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {formData.idFile.fileName}
                  </span>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
                <div className="text-xs text-gray-500">
                  Size:{" "}
                  {formData.idFile.fileSize
                    ? `${(formData.idFile.fileSize / 1024 / 1024).toFixed(
                        2
                      )} MB`
                    : "Unknown"}
                  {formData.idFile.mimeType &&
                    ` • Type: ${formData.idFile.mimeType}`}
                </div>
                {formData.idFile.url && (
                  <a
                    href={formData.idFile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    View File →
                  </a>
                )}
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-md p-6">
                <Input
                  key={fileInputKey}
                  type="file"
                  id="idFile"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileUpload}
                  className="w-full"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Accepted formats: JPEG, PNG, PDF. Maximum size: 5MB
                </p>
              </div>
            )}

            {formErrors.idFile && (
              <p className="mt-1 text-sm text-red-600">{formErrors.idFile}</p>
            )}
          </div>

          {/* Validation Status */}
          {hasIdDetails && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Validation Status:
                </span>
                <button
                  type="button"
                  onClick={validateDetails}
                  disabled={validating}
                  className="text-blue-600 hover:text-blue-800 text-sm disabled:opacity-50"
                >
                  {validating ? "Validating..." : "Check Validation"}
                </button>
              </div>
              <div className="flex items-center gap-2">
                {isComplete() ? (
                  <div className="flex items-center text-green-600 text-sm">
                    <svg
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Complete
                  </div>
                ) : (
                  <div className="flex items-center text-yellow-600 text-sm">
                    <svg
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    Incomplete
                  </div>
                )}

                {hasValidationErrors() && (
                  <div className="flex items-center text-red-600 text-sm ml-4">
                    <svg
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    Has Errors
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={updating || loading || !isDirty}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {updating
                ? "Updating..."
                : hasIdDetails
                ? "Update ID Details"
                : "Save ID Details"}
            </button>

            {hasIdDetails && (
              <button
                type="button"
                onClick={validateDetails}
                disabled={validating}
                className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 disabled:opacity-50 transition-colors"
              >
                {validating ? "Validating..." : "Validate"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdDetailsUpdateForm;
