"use client";

import React, { useState, useRef } from "react";
import { useFormContext, Controller } from "react-hook-form";

import { Input } from "../ui/input";
import { idType } from "@/types";
import {
  idTypeConfigs,
  type UpdateProfileFormData,
} from "@/lib/utils/schemas/profile.schemas";

interface IdentificationFormStepProps {
  className?: string;
  onFieldChange?: (field: string, value: unknown) => void;
}

const supportedFileTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const maxFileSize = 5 * 1024 * 1024; // 5MB

export default function IdentificationFormStep({
  className = "",
  onFieldChange,
}: IdentificationFormStepProps) {
  const {
    control,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<UpdateProfileFormData>();

  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showIdHelper, setShowIdHelper] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const idDetails = watch("idDetails") || {
    idType: idType.NATIONAL_ID,
    idNumber: "",
    idFile: {
      url: "",
      fileName: "",
    },
  };
  const selectedIdType = idDetails.idType;
  const idNumber = idDetails.idNumber || "";
  const idFile = idDetails.idFile || {};

  // Validate ID number based on type
  const validateIdNumber = (
    type: idType | undefined,
    number: string
  ): boolean => {
    if (!type || !number) return false;
    const config = idTypeConfigs[type];
    return config ? config.pattern.test(number.toUpperCase()) : false;
  };

  // Format ID number based on type
  const formatIdNumber = (type: idType | undefined, number: string): string => {
    if (!type || !number) return number;

    const upperNumber = number.toUpperCase();

    switch (type) {
      case idType.NATIONAL_ID:
        return upperNumber.replace(
          /^(GHA)?-?(\d{0,9})-?(\d?)$/,
          (match, p1, p2, p3) => {
            let result = "GHA";
            if (p2) result += `-${p2}`;
            if (p3) result += `-${p3}`;
            return result;
          }
        );
      default:
        return upperNumber;
    }
  };

  // Handle file upload simulation (replace with actual upload logic)
  const simulateFileUpload = async (
    file: File
  ): Promise<{ url: string; fileName: string }> => {
    return new Promise((resolve) => {
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval);
            // Simulate successful upload
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

  // Handle file selection
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file type
    if (!supportedFileTypes.includes(file.type)) {
      alert("Please upload a valid image (JPEG, PNG, WebP) or PDF file.");
      return;
    }

    // Validate file size
    if (file.size > maxFileSize) {
      alert("File size must be less than 5MB.");
      return;
    }

    setIsUploading(true);

    try {
      const uploadResult = await simulateFileUpload(file);
      setValue("idDetails.idFile", uploadResult, {
        shouldValidate: true,
        shouldDirty: true,
      });
      onFieldChange?.("idDetails.idFile", uploadResult);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // Calculate completion percentage
  const getCompletionPercentage = (): number => {
    const hasIdType = selectedIdType ? 25 : 0;
    const hasValidIdNumber = validateIdNumber(selectedIdType, idNumber)
      ? 50
      : 0;
    const hasIdFile = idFile.url && idFile.fileName ? 25 : 0;
    return hasIdType + hasValidIdNumber + hasIdFile;
  };

  return (
    <div className={`space-y-8 ${className}`}>
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

      {/* Benefits Notice */}
      <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <span className="text-green-500 text-xl">✅</span>
          <div>
            <h4 className="text-sm font-medium text-green-900 dark:text-green-100">
              Why verify your identity?
            </h4>
            <ul className="text-sm text-green-800 dark:text-green-200 mt-2 space-y-1">
              <li>• Build trust with potential customers</li>
              <li>• Get priority in search results</li>
              <li>• Access premium features</li>
              <li>• Reduce booking cancellations</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ID Type Selection */}
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

        {showIdHelper && (
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
        )}

        <Controller
          name="idDetails.idType"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(idTypeConfigs).map(([key, config]) => (
                <div
                  key={key}
                  onClick={() => {
                    field.onChange(key as idType);
                    onFieldChange?.("idDetails.idType", key);
                    // Clear ID number when type changes
                    setValue("idDetails.idNumber", "", {
                      shouldValidate: true,
                    });
                  }}
                  className={`cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 hover:shadow-md ${
                    field.value === key
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
              ))}
            </div>
          )}
        />

        {errors.idDetails?.idType && (
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm">
            <span>⚠️</span>
            <span>{errors.idDetails.idType.message}</span>
          </div>
        )}
      </div>

      {/* ID Number Input */}
      {selectedIdType && (
        <div className="space-y-4">
          <Controller
            name="idDetails.idNumber"
            control={control}
            render={({ field }) => {
              const config = idTypeConfigs[selectedIdType];

              return (
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {config.label} Number
                  </label>
                  <div className="relative">
                    <input
                      {...field}
                      type="text"
                      placeholder={config.placeholder}
                      maxLength={config.maxLength}
                      value={field.value || ""}
                      onChange={(e) => {
                        const formatted = formatIdNumber(
                          selectedIdType,
                          e.target.value
                        );
                        field.onChange(formatted);
                        onFieldChange?.("idDetails.idNumber", formatted);
                      }}
                      className={`w-full px-4 py-3 rounded-lg border transition-colors uppercase tracking-wide ${
                        errors.idDetails?.idNumber
                          ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-800"
                          : validateIdNumber(selectedIdType, idNumber) &&
                            idNumber
                          ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-800"
                          : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800"
                      } text-gray-900 dark:text-gray-100`}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <span className="text-2xl">{config.icon}</span>
                    </div>
                  </div>

                  {/* Validation feedback */}
                  {idNumber && (
                    <div className="mt-2 text-sm">
                      {validateIdNumber(selectedIdType, idNumber) ? (
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

                  {errors.idDetails?.idNumber && (
                    <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm mt-2">
                      <span>⚠️</span>
                      <span>{errors.idDetails.idNumber.message}</span>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Enter your {config.label.toLowerCase()} number exactly as
                    shown on your ID
                  </p>
                </div>
              );
            }}
          />
        </div>
      )}

      {/* File Upload */}
      {selectedIdType && validateIdNumber(selectedIdType, idNumber) && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Upload ID Document
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Upload a clear photo or scan of your{" "}
              {idTypeConfigs[selectedIdType].label}. Accepted formats: JPEG,
              PNG, WebP, PDF (max 5MB)
            </p>
          </div>

          {!idFile.url ? (
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-950"
                  : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800"
              } ${
                isUploading
                  ? "opacity-50 pointer-events-none"
                  : "hover:bg-gray-100 dark:hover:bg-gray-750"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Input
                ref={fileInputRef}
                type="file"
                accept={supportedFileTypes.join(",")}
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
          ) : (
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
                      setValue("idDetails.idFile", { url: "", fileName: "" });
                      onFieldChange?.("idDetails.idFile", {
                        url: "",
                        fileName: "",
                      });
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
                accept={supportedFileTypes.join(",")}
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
            </div>
          )}

          {errors.idDetails?.idFile && (
            <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm">
              <span>⚠️</span>
              <span>{errors.idDetails.idFile.message}</span>
            </div>
          )}
        </div>
      )}

      {/* Progress Summary */}
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
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">
              ID Type Selected
            </span>
            <span
              className={
                selectedIdType
                  ? "text-green-600 dark:text-green-400"
                  : "text-gray-400"
              }
            >
              {selectedIdType ? "✅ Selected" : "⭕ Optional"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">ID Number</span>
            <span
              className={
                validateIdNumber(selectedIdType, idNumber)
                  ? "text-green-600 dark:text-green-400"
                  : "text-gray-400"
              }
            >
              {validateIdNumber(selectedIdType, idNumber)
                ? "✅ Valid"
                : "⭕ Optional"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">
              ID Document
            </span>
            <span
              className={
                idFile.url
                  ? "text-green-600 dark:text-green-400"
                  : "text-gray-400"
              }
            >
              {idFile.url ? "✅ Uploaded" : "⭕ Optional"}
            </span>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <span className="text-blue-500 text-lg">🔒</span>
          <div>
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Your Security & Privacy
            </h4>
            <div className="text-sm text-blue-800 dark:text-blue-200 mt-1 space-y-1">
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
