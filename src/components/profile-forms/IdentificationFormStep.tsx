"use client";

import React, { useState, useRef } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Input } from "../ui/input";
import { idType } from "@/types";
import {
  idTypeConfigs,
  type UpdateUserProfileFormData,
} from "@/lib/utils/schemas/profile.schemas";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@radix-ui/react-popover";
import { InfoIcon } from "lucide-react";
import { Button } from "../ui/button";

interface IdentificationFormStepProps {
  className?: string;
  onFieldChange?: (field: string, value: unknown) => void;
}

// Constants
const SUPPORTED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Validation patterns for each ID type
const ID_PATTERNS = {
  [idType.NATIONAL_ID]: /^GHA-\d{9}-\d$/,
  [idType.VOTERS_ID]: /^\d{10}$/,
  [idType.PASSPORT]: /^[A-Z]\d{7}$/,
  [idType.DRIVERS_LICENSE]: /^DL\d{7}$/,
  [idType.NHIS]: /^\d{10}$/,
  [idType.OTHER]: /^.{1,50}$/, // Any 1-50 characters
} as const;

export default function IdentificationFormStep({
  className = "",
  onFieldChange,
}: IdentificationFormStepProps) {
  const {
    control,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<UpdateUserProfileFormData>();

  // State management
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showIdHelper, setShowIdHelper] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Watch form values - using flattened structure
  const selectedIdType = watch("idType");
  const idNumber = watch("idNumber") || "";

  // For file handling, we'll simulate the file structure since it's not in the form schema
  const [idFile, setIdFile] = useState<{ url: string; fileName: string }>({
    url: "",
    fileName: "",
  });

  // Utility functions
  const validateIdNumber = (
    type: idType | undefined,
    number: string
  ): boolean => {
    if (!type || !number) return false;
    const pattern = ID_PATTERNS[type];
    return pattern ? pattern.test(number.toUpperCase()) : false;
  };

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
    const hasIdType = selectedIdType ? 25 : 0;
    const hasValidIdNumber = validateIdNumber(selectedIdType, idNumber)
      ? 50
      : 0;
    const hasIdFile = idFile?.url && idFile?.fileName ? 25 : 0;
    return hasIdType + hasValidIdNumber + hasIdFile;
  };

  // File upload simulation
  const simulateFileUpload = async (
    file: File
  ): Promise<{ url: string; fileName: string }> => {
    return new Promise((resolve) => {
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval);
            resolve({
              url: `https://example.com/uploads/${file.name}`,
              fileName: file.name,
            });
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    });
  };

  // File handling
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file type
    if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
      alert("Please upload a valid image (JPEG, PNG, WebP) or PDF file.");
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      alert("File size must be less than 5MB.");
      return;
    }

    setIsUploading(true);

    try {
      const uploadResult = await simulateFileUpload(file);
      setIdFile(uploadResult);
      onFieldChange?.("idFile", uploadResult);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
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

  // Component sections
  const renderBenefitsNotice = () => (
    <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <span className="text-green-500 text-xl">✅</span>
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
          📋 Accepted ID Requirements
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
          {Object.entries(idTypeConfigs).map(([key, config]) => (
            <div key={key} className="flex items-start space-x-2">
              <span className="text-lg">{config.icon}</span>
              <div>
                <p className="font-medium">{config.label}</p>
                <p className="text-xs">Format: {config.example}</p>
              </div>
            </div>
          ))}
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
            {Object.entries(idTypeConfigs).map(([key, config]) => {
              const idTypeKey = key as idType;
              const isSelected = field.value === idTypeKey;
              return (
                <div
                  key={key}
                  onClick={() => {
                    field.onChange(idTypeKey);
                    onFieldChange?.("idType", idTypeKey);
                    setValue("idNumber", "", {
                      shouldValidate: true,
                    });
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
                      {config.label}
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
          <span>⚠️</span>
          <span>{errors.idType.message}</span>
        </div>
      )}
    </div>
  );

  const renderIdNumberInput = () => {
    // Type guard to ensure selectedIdType is a valid key
    const safeSelectedIdType =
      selectedIdType && selectedIdType in idTypeConfigs
        ? (selectedIdType as idType)
        : idType.NATIONAL_ID;

    const config = idTypeConfigs[safeSelectedIdType];
    const isValid = validateIdNumber(selectedIdType, idNumber);
    const inputClassName = `w-full px-4 py-3 rounded-lg border transition-colors uppercase tracking-wide ${
      errors.idNumber
        ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-800"
        : isValid && idNumber
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

            {/* Validation feedback */}
            {idNumber && (
              <div className="mt-2 text-sm">
                {isValid ? (
                  <div className="flex items-center text-green-600 dark:text-green-400">
                    <span className="mr-2">✅</span>
                    Valid {config.label} format
                  </div>
                ) : (
                  <div className="flex items-center text-orange-600 dark:text-orange-400">
                    <span className="mr-2">⚠️</span>
                    Format should be: {config.example}
                  </div>
                )}
              </div>
            )}

            {errors.idNumber && (
              <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm mt-2">
                <span>⚠️</span>
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
                ></div>
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
              JPEG, PNG, WebP, PDF • Max 5MB
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderUploadedFile = () => (
    <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-green-500 text-2xl">📄</span>
          <div>
            <p className="font-medium text-green-900 dark:text-green-100">
              {idFile.fileName}
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
              setIdFile({ url: "", fileName: "" });
              onFieldChange?.("idFile", { url: "", fileName: "" });
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

  const renderFileUpload = () =>
    selectedIdType &&
    validateIdNumber(selectedIdType, idNumber) && (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Upload ID Document
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Upload a clear photo or scan of your{" "}
            {selectedIdType && selectedIdType in idTypeConfigs
              ? idTypeConfigs[selectedIdType as idType].label
              : "ID document"}
            . Accepted formats: JPEG, PNG, WebP, PDF (max 5MB)
          </p>
        </div>

        {!idFile.url ? renderFileUploadArea() : renderUploadedFile()}

        {/* Note: File upload errors would be handled at the component level since idFile isn't in the form schema */}
      </div>
    );

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
        ></div>
      </div>

      <div className="space-y-2 text-sm">
        {[
          { label: "ID Type Selected", value: selectedIdType },
          {
            label: "ID Number",
            value: validateIdNumber(selectedIdType, idNumber),
          },
          { label: "ID Document", value: idFile.url },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">{label}</span>
            <span
              className={
                value ? "text-green-600 dark:text-green-400" : "text-gray-400"
              }
            >
              {value ? "✅ Complete" : "⭕ Optional"}
            </span>
          </div>
        ))}
      </div>
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

  const renderSkipOption = () => (
    <div className="text-center py-4 border-t border-gray-200 dark:border-gray-700">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
        Not ready to verify now? You can always do this later.
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-500">
        Verified profiles get 3x more customer inquiries on average.
      </p>
    </div>
  );

  return (
    <div className={`space-y-4 ${className}`}>
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

      {/* ID Type Selection */}
      {renderIdTypeSelector()}

      {/* ID Number Input */}
      {selectedIdType && (
        <div className="space-y-4">{renderIdNumberInput()}</div>
      )}

      {/* File Upload */}
      {renderFileUpload()}

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-1"
          >
            <InfoIcon className=" text-blue-600 dark:text-blue-400" />
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Check Out tips
            </h4>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full bg-accent p-2 bg-none border-none space-y-2">
          {/* Benefits Notice */}
          {renderBenefitsNotice()}
          {/* Progress Summary */}
          {renderProgressSummary()}
          {/* Security Notice */}
          {renderSecurityNotice()}
        </PopoverContent>
      </Popover>

      {/* Skip Option */}
      {renderSkipOption()}
    </div>
  );
}

export type { IdentificationFormStepProps };
