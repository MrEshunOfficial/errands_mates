import { useIdDetails } from "@/hooks/id-details/useIdDetails";
import { idType } from "@/types";
import React from "react";

const IdDetailsDisplay: React.FC = () => {
  const {
    idDetails,
    hasIdDetails,
    loading,
    error,
    fetchIdDetails,
    clearError,
  } = useIdDetails();

  const getIdTypeLabel = (type: idType): string => {
    const typeLabels: Record<idType, string> = {
      [idType.NATIONAL_ID]: "National ID",
      [idType.PASSPORT]: "Passport",
      [idType.VOTERS_ID]: "Voter's ID",
      [idType.DRIVERS_LICENSE]: "Driver's License",
      [idType.NHIS]: "NHIS Card",
      [idType.OTHER]: "Other",
    };
    return typeLabels[type] || "Unknown";
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "Unknown size";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (date?: Date): string => {
    if (!date) return "Unknown date";
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-red-800">
              Error Loading ID Details
            </h2>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800 text-sm">
              ✕
            </button>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={fetchIdDetails}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!hasIdDetails || !idDetails) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            No ID Details Found
          </h2>
          <p className="text-gray-600 mb-4">
            You haven&apos;t uploaded any identification details yet.
          </p>
          <button
            onClick={fetchIdDetails}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">ID Details</h2>
          <button
            onClick={fetchIdDetails}
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>

        <div className="space-y-4">
          {/* ID Type */}
          <div className="flex justify-between py-3 border-b border-gray-100">
            <span className="font-medium text-gray-600">ID Type:</span>
            <span className="text-gray-900">
              {getIdTypeLabel(idDetails.idType)}
            </span>
          </div>

          {/* ID Number */}
          <div className="flex justify-between py-3 border-b border-gray-100">
            <span className="font-medium text-gray-600">ID Number:</span>
            <span className="text-gray-900 font-mono">
              {idDetails.idNumber}
            </span>
          </div>

          {/* File Details */}
          <div className="py-3 border-b border-gray-100">
            <span className="font-medium text-gray-600 block mb-2">
              Attached File:
            </span>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {idDetails.idFile.fileName}
                </span>
                <a
                  href={idDetails.idFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1">
                  View
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                {idDetails.idFile.fileSize && (
                  <div>Size: {formatFileSize(idDetails.idFile.fileSize)}</div>
                )}
                {idDetails.idFile.mimeType && (
                  <div>Type: {idDetails.idFile.mimeType}</div>
                )}
                {idDetails.idFile.uploadedAt && (
                  <div>Uploaded: {formatDate(idDetails.idFile.uploadedAt)}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="mt-6 flex items-center justify-center">
          <div className="flex items-center gap-2 text-green-600">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm font-medium">ID Details Available</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdDetailsDisplay;
