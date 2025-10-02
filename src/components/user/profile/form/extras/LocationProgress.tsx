// LocationProgress.tsx - Fixed version with proper typing
"use client";

import React, { useState, useRef, useEffect } from "react";

// Updated interface to match the actual form data structure
interface LocationData {
  ghanaPostGPS?: string;
  region?: string;
  city?: string;
  district?: string;
  locality?: string;
  nearbyLandmark?: string;
  other?: string;
  gpsCoordinates?: {
    latitude?: number;
    longitude?: number;
  };
}

interface LocationProgressProps {
  progress: number;
  isGpsValid: boolean;
  locationData: LocationData; // Changed from UserLocation to LocationData
}

export const LocationProgress: React.FC<LocationProgressProps> = ({
  progress,
  isGpsValid,
  locationData,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        !triggerRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen]);

  const getProgressColor = () => {
    if (progress >= 75) return "bg-green-500";
    if (progress >= 50) return "bg-yellow-500";
    if (progress >= 25) return "bg-orange-500";
    return "bg-red-500";
  };

  const getProgressTextColor = () => {
    if (progress >= 75) return "text-green-600 dark:text-green-400";
    if (progress >= 50) return "text-yellow-600 dark:text-yellow-400";
    if (progress >= 25) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  const progressItems = [
    {
      label: "Ghana Post GPS",
      condition: isGpsValid,
      required: true,
      field: "ghanaPostGPS",
    },
    {
      label: "Region & City",
      condition: !!(locationData.region && locationData.city), // Added !! for boolean conversion
      required: true,
      field: "region_city",
    },
    {
      label: "Landmark",
      condition: !!locationData.nearbyLandmark?.trim(), // Added optional chaining and trim check
      required: true,
      field: "nearbyLandmark",
    },
    {
      label: "District",
      condition: !!locationData.district?.trim(), // Added optional chaining and trim check
      required: false,
      field: "district",
    },
    {
      label: "GPS Coordinates",
      condition: !!locationData.gpsCoordinates, // Added !! for boolean conversion
      required: false,
      field: "gpsCoordinates",
    },
  ];

  const completedRequired = progressItems.filter(
    (item) => item.required && item.condition
  ).length;
  const totalRequired = progressItems.filter((item) => item.required).length;
  const completedOptional = progressItems.filter(
    (item) => !item.required && item.condition
  ).length;
  const totalOptional = progressItems.filter((item) => !item.required).length;

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600 relative overflow-hidden">
            <div
              className={`absolute inset-0 ${getProgressColor()} transition-all duration-300`}
              style={{
                clipPath: `polygon(0 ${100 - progress}%, 100% ${
                  100 - progress
                }%, 100% 100%, 0 100%)`,
              }}
            />
          </div>
          <span className={`font-medium ${getProgressTextColor()}`}>
            {Math.round(progress)}%
          </span>
        </div>
        <svg
          className={`ml-1 h-4 w-4 transform transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 animate-in slide-in-from-top-2 duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="progress-title">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3
                id="progress-title"
                className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Location Section Progress
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close progress">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Overall Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Overall Completion
                </span>
                <span
                  className={`text-sm font-medium ${getProgressTextColor()}`}>
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Required Fields */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Required Fields
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {completedRequired}/{totalRequired}
                </span>
              </div>
              <div className="space-y-2">
                {progressItems
                  .filter((item) => item.required)
                  .map(({ label, condition, field }) => (
                    <div
                      key={field}
                      className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {label}
                      </span>
                      <span
                        className={
                          condition
                            ? "text-green-600 dark:text-green-400 text-xs"
                            : "text-red-600 dark:text-red-400 text-xs"
                        }>
                        {condition ? "✅ Complete" : "❌ Required"}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Optional Fields */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Optional Fields
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {completedOptional}/{totalOptional}
                </span>
              </div>
              <div className="space-y-2">
                {progressItems
                  .filter((item) => !item.required)
                  .map(({ label, condition, field }) => (
                    <div
                      key={field}
                      className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {label}
                      </span>
                      <span
                        className={
                          condition
                            ? "text-green-600 dark:text-green-400 text-xs"
                            : "text-gray-400 text-xs"
                        }>
                        {condition ? "✅ Complete" : "⭕ Optional"}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Summary */}
            <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {completedRequired === totalRequired ? (
                  <div className="flex items-center text-green-600 dark:text-green-400">
                    <span className="mr-1">🎉</span>
                    All required fields completed!
                  </div>
                ) : (
                  <div>
                    <span className="font-medium">
                      {totalRequired - completedRequired} required field(s)
                      remaining
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
