"use client";

import React, { useState, useRef, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { idType } from "@/types";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@radix-ui/react-popover";
import { InfoIcon, AlertCircle, CheckCircle } from "lucide-react";
import { useIdDetails } from "@/hooks/id-details/useIdDetails";
import {
  idTypeConfigs,
  idDetailsFormWithFileSchema,
  type IdDetailsFormWithFileData,
  validateIdNumber,
  validateIdDocumentFile,
} from "@/lib/utils/schemas/id-verification-schema";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";

interface IdentificationFormStepProps {
  className?: string;
  onStepComplete?: (isComplete: boolean) => void;
  onFieldChange?: (field: string, value: unknown) => void;
}

// Constants
const SUPPORTED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
  "image/tiff",
];

export default function IdentificationFormStep({
  className = "",
  onStepComplete,
  onFieldChange,
}: IdentificationFormStepProps) {
  // Use the dedicated ID details hook
  const {
    idDetails,
    validation,
    hasIdDetails,
    loading,
    updating,
    validating,
    error,
    validationError,
    updateComplete,
    validateDetails,
    clearError,
    clearValidationError,
    isComplete,
    hasValidationErrors,
    getIdTypeOptions,
  } = useIdDetails();

  // Form setup with separated ID details schema
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
    reset,
  } = useForm<IdDetailsFormWithFileData>({
    resolver: zodResolver(idDetailsFormWithFileSchema),
    defaultValues: {
      idType: idDetails?.idType || undefined,
      idNumber: idDetails?.idNumber || "",
      file: undefined,
    },
  });

  // State management
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showIdHelper, setShowIdHelper] = useState(false);
  const [localFileInfo, setLocalFileInfo] = useState<{
    name: string;
    size: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Watch form values
  const selectedIdType = watch("idType");
  const idNumber = watch("idNumber") || "";
  const selectedFile = watch("file");

  // Update form when idDetails changes
  useEffect(() => {
    if (idDetails) {
      reset({
        idType: idDetails.idType,
        idNumber: idDetails.idNumber,
        file: undefined, // File is handled separately
      });
    }
  }, [idDetails, reset]);

  // Notify parent about step completion
  useEffect(() => {
    const stepIsComplete = isComplete() && !hasValidationErrors();
    onStepComplete?.(stepIsComplete);
  }, [isComplete, hasValidationErrors, onStepComplete]);

  // Clear errors when form changes
  useEffect(() => {
    if (error) clearError();
    if (validationError) clearValidationError();
  }, [
    selectedIdType,
    idNumber,
    selectedFile,
    error,
    validationError,
    clearError,
    clearValidationError,
  ]);

  // Utility functions
  const formatIdNumber = (type: idType | undefined, number: string): string => {
    if (!type || !number) return number;
    const upperNumber = number.toUpperCase();

    if (type === idType.NATIONAL_ID) {
      return upperNumber.replace(
        /^(GHA)?-?(\d{0,9})-?(\d?)$/,
        (match, p1, p2, p3) => {
          let result = "GHA";
          if (p2) result += `-${p2}`;
          if (p3) result += `-${p3}`;
          return result;
        }
      );
    }
    return upperNumber;
  };

  const getCompletionPercentage = (): number => {
    const hasIdType = selectedIdType ? 30 : 0;
    const hasValidIdNumber =
      selectedIdType && validateIdNumber(idNumber, selectedIdType).isValid
        ? 40
        : 0;
    const hasIdFile = selectedFile || idDetails?.idFile ? 30 : 0;
    return hasIdType + hasValidIdNumber + hasIdFile;
  };

  // Unified file upload function
  const uploadIdFile = async (
    file: File
  ): Promise<{ url: string; fileName: string }> => {
    try {
      // Create FormData for the file upload
      const formData = new FormData();
      formData.append("file", file);

      // Add ID details if available
      if (selectedIdType) {
        formData.append("idType", selectedIdType);
      }
      if (idNumber) {
        formData.append("idNumber", idNumber);
      }

      // Reset progress
      setUploadProgress(0);

      const xhr = new XMLHttpRequest();

      return new Promise((resolve, reject) => {
        // Track upload progress
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round(
              (event.loaded / event.total) * 100
            );
            setUploadProgress(percentComplete);
          }
        });

        // Handle successful upload
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve({
                url: response.url,
                fileName: response.fileName,
              });
            } catch {
              reject(new Error("Invalid server response format"));
            }
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              reject(
                new Error(
                  errorResponse.message ||
                    errorResponse.error ||
                    `Upload failed`
                )
              );
            } catch {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        });

        // Handle network errors
        xhr.addEventListener("error", () => {
          reject(new Error("Network error during file upload"));
        });

        // Handle timeout
        xhr.addEventListener("timeout", () => {
          reject(new Error("File upload timed out"));
        });

        // Configure request - Use your existing endpoint
        xhr.open("PUT", "/api/profile/id-details");
        xhr.timeout = 60000;
        xhr.withCredentials = true;

        // Send the request
        xhr.send(formData);
      });
    } catch (error) {
      setUploadProgress(0);
      throw new Error(
        `Upload preparation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  // Updated form submission handler
  const onSubmit = async (data: IdDetailsFormWithFileData) => {
    try {
      setIsUploading(true);
      clearError();
      clearValidationError();

      let fileReference = idDetails?.idFile;

      // Upload new file if provided
      if (data.file) {
        try {
          // Validate file before upload
          const fileValidation = validateIdDocumentFile(data.file);
          if (!fileValidation.isValid) {
            throw new Error(fileValidation.error);
          }

          // Upload the file
          const uploadResult = await uploadIdFile(data.file);

          // Create file reference object
          fileReference = {
            url: uploadResult.url,
            fileName: uploadResult.fileName,
            fileSize: data.file.size,
            mimeType: data.file.type,
            uploadedAt: new Date(),
          };

          // Clear local file info since upload is complete
          setLocalFileInfo({
            name: uploadResult.fileName,
            size: data.file.size,
          });
        } catch (uploadError) {
          const errorMessage =
            uploadError instanceof Error
              ? uploadError.message
              : "File upload failed";
          throw new Error(`File upload failed: ${errorMessage}`);
        }
      }

      // Ensure we have a file reference
      if (!fileReference) {
        throw new Error("ID document file is required");
      }

      // Use the hook's updateComplete method to save everything
      await updateComplete({
        idType: data.idType,
        idNumber: data.idNumber,
        idFile: fileReference,
      });

      // Automatically trigger validation after successful update
      await validateDetails();
    } catch (err) {
      console.error("ID details submission error:", err);
      // Error handling is managed by the hook
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // File handling
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const validation = validateIdDocumentFile(file);

    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    setLocalFileInfo({ name: file.name, size: file.size });
    setValue("file", file, { shouldValidate: true });
    onFieldChange?.("file", file);
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // Handle form submission without creating a form element
  const handleFormSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    handleSubmit(onSubmit)();
  };

  // Component sections
  const renderBenefitsNotice = () => (
    <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <CheckCircle className="text-green-500 mt-0.5" size={20} />
        <div>
          <h4 className="text-sm font-medium text-green-900 dark:text-green-100">
            Why verify your identity?
          </h4>
          <ul className="text-start text-sm text-green-800 dark:text-green-200 mt-2 space-y-1">
            <li>• Build trust with potential customers</li>
            <li>• Get priority in search results</li>
            <li>• Access premium features</li>
            <li>• Reduce booking cancellations</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderIdHelper = () =>
    showIdHelper && (
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">
          Accepted ID Requirements
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
          {getIdTypeOptions().map(({ value, label }) => {
            const config = idTypeConfigs[value as idType];
            return (
              <div key={value} className="flex items-start space-x-2">
                <span className="text-lg">{config.icon}</span>
                <div>
                  <p className="font-medium">{label}</p>
                  <p className="text-xs">Format: {config.example}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );

  const renderIdTypeSelector = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
          Select ID Type
        </label>
        <button
          type="button"
          onClick={() => setShowIdHelper(!showIdHelper)}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          {showIdHelper ? "Hide" : "Show"} ID requirements
        </button>
      </div>

      {renderIdHelper()}

      <Controller
        name="idType"
        control={control}
        render={({ field }) => (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getIdTypeOptions().map(({ value, label }) => {
              const config = idTypeConfigs[value as idType];
              const isSelected = field.value === value;
              return (
                <div
                  key={value}
                  onClick={() => {
                    field.onChange(value);
                    onFieldChange?.("idType", value);
                    setValue("idNumber", "", { shouldValidate: true });
                  }}
                  className={`cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 hover:shadow-md ${
                    isSelected
                      ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-950 ring-2 ring-blue-200 dark:ring-blue-800"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <div className="text-center">
                    <span className="text-3xl block mb-2">{config.icon}</span>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                      {label}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {config.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      />

      {errors.idType && (
        <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle size={16} />
          <span>{errors.idType.message}</span>
        </div>
      )}
    </div>
  );

  const renderIdNumberInput = () => {
    if (!selectedIdType) return null;

    const config = idTypeConfigs[selectedIdType];
    const validation = validateIdNumber(idNumber, selectedIdType);
    const inputClassName = `w-full px-4 py-3 rounded-lg border transition-colors uppercase tracking-wide ${
      errors.idNumber
        ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-800"
        : validation.isValid && idNumber
        ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-800"
        : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800"
    } text-gray-900 dark:text-gray-100`;

    return (
      <Controller
        name="idNumber"
        control={control}
        render={({ field }) => (
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              {config.label} Number
            </label>
            <div className="relative">
              <input
                {...field}
                type="text"
                placeholder={config.placeholder}
                maxLength={50}
                value={field.value || ""}
                onChange={(e) => {
                  const formatted = formatIdNumber(
                    selectedIdType,
                    e.target.value
                  );
                  field.onChange(formatted);
                  onFieldChange?.("idNumber", formatted);
                }}
                className={inputClassName}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <span className="text-2xl">{config.icon}</span>
              </div>
            </div>

            {idNumber && (
              <div className="mt-2 text-sm">
                {validation.isValid ? (
                  <div className="flex items-center text-green-600 dark:text-green-400">
                    <CheckCircle size={16} className="mr-2" />
                    Valid {config.label} format
                  </div>
                ) : (
                  <div className="flex items-center text-orange-600 dark:text-orange-400">
                    <AlertCircle size={16} className="mr-2" />
                    Format should be: {config.example}
                  </div>
                )}
              </div>
            )}

            {errors.idNumber && (
              <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm mt-2">
                <AlertCircle size={16} />
                <span>{errors.idNumber.message}</span>
              </div>
            )}

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Enter your {config.label.toLowerCase()} number exactly as shown on
              your ID
            </p>
          </div>
        )}
      />
    );
  };

  const renderFileUploadArea = () => {
    const dragClassName = `relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
      dragActive
        ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-950"
        : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800"
    } ${
      isUploading
        ? "opacity-50 pointer-events-none"
        : "hover:bg-gray-100 dark:hover:bg-gray-750"
    }`;

    return (
      <div
        className={dragClassName}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Input
          ref={fileInputRef}
          type="file"
          accept={SUPPORTED_FILE_TYPES.join(",")}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="space-y-4">
            <div className="text-4xl">📤</div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Uploading...
              </p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {uploadProgress}%
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-4xl">📁</div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-1">
                Drag and drop your ID document here
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                or click to browse files
              </p>
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500">
              JPEG, PNG, WebP, PDF, TIFF • Max 10MB
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderUploadedFile = () => {
    const fileName =
      localFileInfo?.name || idDetails?.idFile?.fileName || "Unknown file";

    return (
      <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-green-500 text-2xl">📄</span>
            <div>
              <p className="font-medium text-green-900 dark:text-green-100">
                {fileName}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Document uploaded successfully
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => {
                setLocalFileInfo(null);
                setValue("file", undefined);
                onFieldChange?.("file", null);
              }}
              className="text-sm text-red-600 dark:text-red-400 hover:underline"
            >
              Remove
            </button>
          </div>
        </div>
        <Input
          ref={fileInputRef}
          type="file"
          accept={SUPPORTED_FILE_TYPES.join(",")}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>
    );
  };

  const renderFileUpload = () => {
    if (
      !selectedIdType ||
      !validateIdNumber(idNumber, selectedIdType).isValid
    ) {
      return null;
    }

    const hasFile = selectedFile || idDetails?.idFile || localFileInfo;

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Upload ID Document
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Upload a clear photo or scan of your{" "}
            {idTypeConfigs[selectedIdType].label}. Accepted formats: JPEG, PNG,
            WebP, PDF, TIFF (max 10MB)
          </p>
        </div>

        {!hasFile ? renderFileUploadArea() : renderUploadedFile()}

        {errors.file && (
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle size={16} />
            <span>{errors.file.message}</span>
          </div>
        )}
      </div>
    );
  };

  const renderProgressSummary = () => (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Identification Section Progress
        </h4>
        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
          {Math.round(getCompletionPercentage())}%
        </span>
      </div>

      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
        <div
          className="bg-blue-500 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
          style={{ width: `${getCompletionPercentage()}%` }}
        />
      </div>

      <div className="space-y-2 text-sm">
        {[
          { label: "ID Type Selected", value: !!selectedIdType },
          {
            label: "ID Number",
            value:
              selectedIdType &&
              validateIdNumber(idNumber, selectedIdType).isValid,
          },
          {
            label: "ID Document",
            value: !!(selectedFile || idDetails?.idFile || localFileInfo),
          },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">{label}</span>
            <span
              className={
                value ? "text-green-600 dark:text-green-400" : "text-gray-400"
              }
            >
              {value ? "✅ Complete" : "⭕ Pending"}
            </span>
          </div>
        ))}
      </div>

      {validation && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Verification Status
            </span>
            <span
              className={`font-medium ${
                validation.isComplete
                  ? "text-green-600 dark:text-green-400"
                  : "text-orange-600 dark:text-orange-400"
              }`}
            >
              {validation.isComplete ? "Ready for Review" : "Incomplete"}
            </span>
          </div>
          {hasValidationErrors() && (
            <div className="mt-2 text-xs text-red-600 dark:text-red-400">
              {validation.errors?.map((error, index) => (
                <div key={index}>• {error}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderSecurityNotice = () => (
    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <span className="text-blue-500 text-lg">🔒</span>
        <div>
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Your Security & Privacy
          </h4>
          <div className="text-start text-sm text-blue-800 dark:text-blue-200 mt-1 space-y-1">
            <p>• Your ID information is encrypted and stored securely</p>
            <p>
              • Only authorized verification staff can access your documents
            </p>
            <p>• We never share your ID details with other users</p>
            <p>• You can remove your verification anytime from settings</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderErrorMessages = () => {
    if (!error && !validationError) return null;

    return (
      <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="text-red-500 mt-0.5" size={20} />
          <div>
            <h4 className="text-sm font-medium text-red-900 dark:text-red-100">
              Error
            </h4>
            <p className="text-sm text-red-800 dark:text-red-200 mt-1">
              {error || validationError}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderActionButtons = () => (
    <div className="flex flex-col sm:flex-row gap-3">
      <Button
        type="button"
        onClick={handleFormSubmit}
        disabled={!isValid || updating || loading}
        className="flex-1"
      >
        {updating
          ? "Saving..."
          : hasIdDetails
          ? "Update ID Details"
          : "Save ID Details"}
      </Button>

      {hasIdDetails && (
        <Button
          type="button"
          variant="outline"
          onClick={validateDetails}
          disabled={validating}
          className="flex-1 sm:flex-none"
        >
          {validating ? "Validating..." : "Re-validate"}
        </Button>
      )}
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Section Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Identity Verification (Optional)
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Verify your identity to build trust with customers. This step is
          optional but highly recommended for service providers.
        </p>
      </div>

      {/* Error Messages */}
      {renderErrorMessages()}

      {/* Form Content - Using div instead of form to avoid nesting */}
      <div className="space-y-6">
        {/* ID Type Selection */}
        {renderIdTypeSelector()}

        {/* ID Number Input */}
        {selectedIdType && renderIdNumberInput()}

        {/* File Upload */}
        {renderFileUpload()}

        {/* Action Buttons */}
        {selectedIdType && idNumber && renderActionButtons()}
      </div>

      {/* Tips and Information */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
          >
            <InfoIcon className="text-blue-600 dark:text-blue-400" size={16} />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              View Tips & Information
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 space-y-4">
          {renderBenefitsNotice()}
          {renderProgressSummary()}
          {renderSecurityNotice()}
        </PopoverContent>
      </Popover>

      {/* Skip Option */}
      <div className="text-center py-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Not ready to verify now? You can always do this later.
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500">
          Verified profiles get 3x more customer inquiries on average.
        </p>
      </div>
    </div>
  );
}

export type { IdentificationFormStepProps };
