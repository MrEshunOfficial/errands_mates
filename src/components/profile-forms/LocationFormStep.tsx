"use client";

import React, { useState } from "react";
import { useFormContext, Controller } from "react-hook-form";

import Link from "next/link";

interface LocationFormStepProps {
  className?: string;
  onFieldChange?: (field: string, value: unknown) => void;
}

// Ghana regions for dropdown
const ghanaRegions = [
  "Greater Accra",
  "Ashanti",
  "Western",
  "Central",
  "Eastern",
  "Volta",
  "Northern",
  "Upper East",
  "Upper West",
  "Brong-Ahafo",
  "Western North",
  "Ahafo",
  "Bono East",
  "North East",
  "Savannah",
  "Oti",
];

export default function LocationFormStep({
  className = "",
  onFieldChange,
}: LocationFormStepProps) {
  const {
    control,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<UpdateProfileFormData>();

  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [gpsFormatHelper, setGpsFormatHelper] = useState(false);

  const locationData = watch("location") || {
    ghanaPostGPS: "",
    nearbyLandmark: "",
    region: "",
    city: "",
    district: "",
    locality: "",
    other: "",
    gpsCoordinates: undefined,
  };
  const ghanaPostGPS = locationData.ghanaPostGPS || "";

  // Auto-validate GPS format as user types
  const handleGPSChange = (value: string) => {
    const upperValue = value.toUpperCase();
    setValue("location.ghanaPostGPS", upperValue, {
      shouldValidate: true,
      shouldDirty: true,
    });
    onFieldChange?.("location.ghanaPostGPS", upperValue);
  };

  // Get user's current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setValue(
          "location.gpsCoordinates",
          { latitude, longitude },
          {
            shouldValidate: true,
            shouldDirty: true,
          }
        );
        onFieldChange?.("location.gpsCoordinates", { latitude, longitude });
        setIsGettingLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        setIsGettingLocation(false);
        alert(
          "Unable to get your location. Please check your browser permissions."
        );
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Calculate completion percentage
  const getCompletionPercentage = () => {
    const fields = [
      ghanaPostGPS,
      locationData.region,
      locationData.city,
      locationData.nearbyLandmark,
    ];
    const completed = fields.filter((field) => field && field.trim()).length;
    return (completed / fields.length) * 100;
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Section Header */}
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Help others find you by providing accurate location information. This
          is especially important for service providers.
        </p>
      </div>

      {/* Ghana Post GPS - Required Field */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
            Ghana Post GPS Address <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={() => setGpsFormatHelper(!gpsFormatHelper)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Need help? {gpsFormatHelper ? "Hide" : "Show"} format guide
          </button>
        </div>

        {gpsFormatHelper && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              🗺️ Ghana Post GPS Format Guide
            </h4>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
              <p>
                <strong>Format:</strong> XX-0000-0000 (e.g., GA-123-4567)
              </p>
              <p>
                <strong>Examples:</strong>
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>GA-039-5028 (Greater Accra)</li>
                <li>AK-456-7890 (Ashanti - Kumasi)</li>
                <li>WP-234-5678 (Western)</li>
              </ul>
              <p className="mt-2">
                <strong>Don&apos;t have one?</strong> Visit{" "}
                <Link
                  href="https://gpsportal.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 underline"
                >
                  Ghana Post GPS Portal
                </Link>{" "}
                to get yours.
              </p>
            </div>
          </div>
        )}

        <Controller
          name="location.ghanaPostGPS"
          control={control}
          render={({ field }) => (
            <div>
              <input
                {...field}
                type="text"
                placeholder={formFieldConfigs.ghanaPostGPS.placeholder}
                value={field.value || ""}
                onChange={(e) => {
                  field.onChange(e);
                  handleGPSChange(e.target.value);
                }}
                className={`w-full px-4 py-3 rounded-lg border transition-colors uppercase tracking-wider ${
                  errors.location?.ghanaPostGPS
                    ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-800"
                    : validateGhanaPostGPS(ghanaPostGPS) && ghanaPostGPS
                    ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-800"
                    : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800"
                } text-gray-900 dark:text-gray-100`}
              />

              {/* Validation feedback */}
              {ghanaPostGPS && (
                <div className="mt-2 text-sm">
                  {validateGhanaPostGPS(ghanaPostGPS) ? (
                    <div className="flex items-center text-green-600 dark:text-green-400">
                      <span className="mr-2">✅</span>
                      Valid GPS format
                    </div>
                  ) : (
                    <div className="flex items-center text-orange-600 dark:text-orange-400">
                      <span className="mr-2">⚠️</span>
                      Format should be XX-0000-0000
                    </div>
                  )}
                </div>
              )}

              {errors.location?.ghanaPostGPS && (
                <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm mt-2">
                  <span>⚠️</span>
                  <span>{errors.location.ghanaPostGPS.message}</span>
                </div>
              )}
            </div>
          )}
        />
      </div>

      {/* Region and City */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Controller
          name="location.region"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Region
              </label>
              <select
                {...field}
                value={field.value || ""}
                onChange={(e) => {
                  field.onChange(e);
                  onFieldChange?.("location.region", e.target.value);
                }}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500"
              >
                <option value="">Select a region</option>
                {ghanaRegions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>
          )}
        />

        <Controller
          name="location.city"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                City/Town
              </label>
              <input
                {...field}
                type="text"
                placeholder={formFieldConfigs.city.placeholder}
                maxLength={formFieldConfigs.city.maxLength}
                value={field.value || ""}
                onChange={(e) => {
                  field.onChange(e);
                  onFieldChange?.("location.city", e.target.value);
                }}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500"
              />
            </div>
          )}
        />
      </div>

      {/* District and Locality */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Controller
          name="location.district"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                District
              </label>
              <input
                {...field}
                type="text"
                placeholder={formFieldConfigs.district.placeholder}
                maxLength={formFieldConfigs.district.maxLength}
                value={field.value || ""}
                onChange={(e) => {
                  field.onChange(e);
                  onFieldChange?.("location.district", e.target.value);
                }}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500"
              />
            </div>
          )}
        />

        <Controller
          name="location.locality"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Locality/Neighborhood
              </label>
              <input
                {...field}
                type="text"
                placeholder={formFieldConfigs.locality.placeholder}
                maxLength={formFieldConfigs.locality.maxLength}
                value={field.value || ""}
                onChange={(e) => {
                  field.onChange(e);
                  onFieldChange?.("location.locality", e.target.value);
                }}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500"
              />
            </div>
          )}
        />
      </div>

      {/* Nearby Landmark */}
      <Controller
        name="location.nearbyLandmark"
        control={control}
        render={({ field }) => (
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Nearby Landmark
            </label>
            <input
              {...field}
              type="text"
              placeholder={formFieldConfigs.nearbyLandmark.placeholder}
              maxLength={formFieldConfigs.nearbyLandmark.maxLength}
              value={field.value || ""}
              onChange={(e) => {
                field.onChange(e);
                onFieldChange?.("location.nearbyLandmark", e.target.value);
              }}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Help others find you by mentioning a well-known landmark nearby
            </p>
          </div>
        )}
      />

      {/* Additional Location Info */}
      <Controller
        name="location.other"
        control={control}
        render={({ field }) => (
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Additional Location Information
            </label>
            <textarea
              {...field}
              rows={3}
              placeholder={formFieldConfigs.other.placeholder}
              maxLength={formFieldConfigs.other.maxLength}
              value={field.value || ""}
              onChange={(e) => {
                field.onChange(e);
                onFieldChange?.("location.other", e.target.value);
              }}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 resize-none"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>Optional: Any other relevant location details</span>
              <span>
                {(field.value || "").length}/{formFieldConfigs.other.maxLength}
              </span>
            </div>
          </div>
        )}
      />

      {/* GPS Coordinates */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
              GPS Coordinates (Optional)
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              For more precise location mapping
            </p>
          </div>
          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            className="px-4 py-2 text-sm bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <span>{isGettingLocation ? "🌍" : "📍"}</span>
            <span>
              {isGettingLocation
                ? "Getting Location..."
                : "Get Current Location"}
            </span>
          </button>
        </div>

        {locationData.gpsCoordinates && (
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-green-800 dark:text-green-200">
              <span>📍</span>
              <span className="font-medium">GPS Coordinates Captured</span>
            </div>
            <div className="text-sm text-green-700 dark:text-green-300 mt-1">
              Latitude: {locationData.gpsCoordinates.latitude?.toFixed(6)}
              <br />
              Longitude: {locationData.gpsCoordinates.longitude?.toFixed(6)}
            </div>
          </div>
        )}
      </div>

      {/* Progress Summary */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Location Section Progress
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
              Ghana Post GPS
            </span>
            <span
              className={
                validateGhanaPostGPS(ghanaPostGPS)
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }
            >
              {validateGhanaPostGPS(ghanaPostGPS) ? "✅ Valid" : "❌ Required"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">
              Region & City
            </span>
            <span
              className={
                locationData.region && locationData.city
                  ? "text-green-600 dark:text-green-400"
                  : "text-gray-400"
              }
            >
              {locationData.region && locationData.city
                ? "✅ Complete"
                : "⭕ Optional"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Landmark</span>
            <span
              className={
                locationData.nearbyLandmark
                  ? "text-green-600 dark:text-green-400"
                  : "text-gray-400"
              }
            >
              {locationData.nearbyLandmark ? "✅ Added" : "⭕ Recommended"}
            </span>
          </div>
        </div>
      </div>

      {/* Location Tips */}
      <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-2">
          💡 Location Tips for Better Visibility
        </h4>
        <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
          <li>• Accurate Ghana Post GPS helps customers find you easily</li>
          <li>• Mention popular landmarks that locals recognize</li>
          <li>• GPS coordinates enable precise mapping for services</li>
          <li>• Complete location details build trust with customers</li>
        </ul>
      </div>
    </div>
  );
}

export type { LocationFormStepProps };
