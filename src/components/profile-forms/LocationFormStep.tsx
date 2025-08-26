"use client";

import React, { useEffect, useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import Link from "next/link";
import { UpdateUserProfileFormData } from "@/lib/utils/schemas/profile.schemas";
import { getRegions } from "@/lib/api/location.api.config/get.regions";

// Define proper TypeScript interfaces for the location API
interface City {
  id: string;
  name: string;
}

interface Region {
  id: string;
  name: string;
  cities?: City[];
}

interface LocationApiResponse {
  success: boolean;
  data: Region[];
  message?: string;
}

interface LocationFormStepProps {
  className?: string;
  onFieldChange?: (field: string, value: unknown) => void;
}

const validateGhanaPostGPS = (value: string): boolean => {
  return /^[A-Z]{2}-\d{4}-\d{4}$/.test(value);
};

const getLocationErrorMessage = (error: GeolocationPositionError): string => {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Location access denied. Please enable location permissions in your browser settings.";
    case error.POSITION_UNAVAILABLE:
      return "Location information unavailable. Please try again or enter coordinates manually.";
    case error.TIMEOUT:
      return "Location request timed out. Please try again.";
    default:
      return "Unable to retrieve location. Please check your browser settings.";
  }
};

export default function LocationFormStep({
  className = "",
  onFieldChange,
}: LocationFormStepProps) {
  const {
    control,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<UpdateUserProfileFormData>();

  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showGpsHelper, setShowGpsHelper] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const locationData = watch();
  const ghanaPostGPS = locationData.ghanaPostGPS || "";

  // Fetch regions with proper error handling and typing
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        setLoading(true);
        setApiError(null);

        const response = await getRegions();

        // Handle different possible response formats
        let regionsData: Region[] = [];

        if (Array.isArray(response)) {
          // Direct array response
          regionsData = response;
        } else if (response && typeof response === "object") {
          // Object response with data property
          if (Array.isArray(response.data)) {
            regionsData = response.data;
          } else if (Array.isArray(response.regions)) {
            regionsData = response.regions;
          }
        }

        // Validate the structure of each region
        const validatedRegions = regionsData.filter(
          (region): region is Region => {
            return (
              region &&
              typeof region === "object" &&
              typeof region.id === "string" &&
              typeof region.name === "string"
            );
          }
        );

        setRegions(validatedRegions);

        if (validatedRegions.length === 0 && regionsData.length > 0) {
          console.warn("Regions data structure may be incorrect:", regionsData);
          setApiError("Regions data format is invalid");
        }
      } catch (error) {
        console.error("Error fetching regions:", error);
        setApiError(
          error instanceof Error ? error.message : "Failed to load regions"
        );
        setRegions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRegions();
  }, []);

  const handleGPSChange = (value: string) => {
    const upperValue = value.toUpperCase();
    setValue("ghanaPostGPS", upperValue, {
      shouldValidate: true,
      shouldDirty: true,
    });
    onFieldChange?.("ghanaPostGPS", upperValue);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const coordinates = { latitude, longitude };
        setValue("gpsCoordinates", coordinates, {
          shouldValidate: true,
          shouldDirty: true,
        });
        onFieldChange?.("gpsCoordinates", coordinates);
        setIsGettingLocation(false);
        setLocationError(null);
      },
      (error) => {
        console.error("Geolocation error:", {
          code: error.code,
          message: error.message,
          timestamp: new Date().toISOString(),
        });

        const errorMessage = getLocationErrorMessage(error);
        setLocationError(errorMessage);
        setIsGettingLocation(false);
      },
      {
        timeout: 15000,
        enableHighAccuracy: true,
        maximumAge: 300000, // 5 minutes
      }
    );
  };

  const calculateProgress = (): number => {
    const requiredFields = [
      ghanaPostGPS,
      locationData.region,
      locationData.city,
      locationData.nearbyLandmark,
    ];
    const completed = requiredFields.filter((field) =>
      field?.toString().trim()
    ).length;
    return (completed / requiredFields.length) * 100;
  };

  const FormField = ({
    name,
    label,
    required = false,
    children,
  }: {
    name: string;
    label: string;
    required?: boolean;
    children: React.ReactNode;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );

  const TextInput = ({
    name,
    placeholder,
    maxLength,
    className: inputClassName = "",
  }: {
    name: keyof UpdateUserProfileFormData;
    placeholder: string;
    maxLength?: number;
    className?: string;
  }) => (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <input
          {...field}
          type="text"
          placeholder={placeholder}
          maxLength={maxLength}
          value={typeof field.value === "string" ? field.value : ""}
          onChange={(e) => {
            field.onChange(e.target.value);
            onFieldChange?.(name, e.target.value);
          }}
          className={`w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 ${inputClassName}`}
        />
      )}
    />
  );

  // Get the selected region with proper typing
  const getSelectedRegion = (): Region | undefined => {
    const selectedRegionId = locationData.region;
    return regions.find((region) => region.id === selectedRegionId);
  };

  const selectedRegion = getSelectedRegion();
  const isGpsValid = validateGhanaPostGPS(ghanaPostGPS);
  const progress = calculateProgress();

  return (
    <div className={`space-y-8 ${className}`}>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Help others find you by providing accurate location information.
      </p>

      {/* API Error Display */}
      {apiError && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <span className="text-red-600 dark:text-red-400">⚠️</span>
            <div>
              <p className="text-red-800 dark:text-red-200 font-medium text-sm">
                Location Service Error
              </p>
              <p className="text-red-700 dark:text-red-300 text-sm mt-1">
                {apiError}
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="text-red-600 dark:text-red-400 text-xs hover:underline mt-2"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ghana Post GPS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <FormField
            name="ghanaPostGPS"
            label="Ghana Post GPS Address"
            required
          >
            <></>
          </FormField>
          <button
            type="button"
            onClick={() => setShowGpsHelper(!showGpsHelper)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            {showGpsHelper ? "Hide" : "Show"} format guide
          </button>
        </div>

        {showGpsHelper && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              Ghana Post GPS Format Guide
            </h4>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
              <p>
                <strong>Format:</strong> XX-0000-0000 (e.g., GA-123-4567)
              </p>
              <p>
                <strong>Examples:</strong> GA-039-5028, AK-456-7890, WP-234-5678
              </p>
              <p>
                <strong>Don&apos;t have one?</strong>{" "}
                <Link
                  href="https://gpsportal.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 underline"
                >
                  Get yours here
                </Link>
              </p>
            </div>
          </div>
        )}

        <Controller
          name="ghanaPostGPS"
          control={control}
          render={({ field }) => (
            <div>
              <input
                {...field}
                type="text"
                placeholder="XX-0000-0000"
                value={field.value || ""}
                onChange={(e) => {
                  field.onChange(e);
                  handleGPSChange(e.target.value);
                }}
                className={`w-full px-4 py-3 rounded-lg border transition-colors uppercase tracking-wider ${
                  errors.ghanaPostGPS
                    ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950"
                    : isGpsValid && ghanaPostGPS
                    ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950"
                    : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                } text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800`}
              />

              {ghanaPostGPS && (
                <div className="mt-2 text-sm flex items-center">
                  <span className="mr-2">{isGpsValid ? "✅" : "⚠️"}</span>
                  <span
                    className={
                      isGpsValid
                        ? "text-green-600 dark:text-green-400"
                        : "text-orange-600 dark:text-orange-400"
                    }
                  >
                    {isGpsValid
                      ? "Valid GPS format"
                      : "Format should be XX-0000-0000"}
                  </span>
                </div>
              )}

              {errors.ghanaPostGPS && (
                <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm mt-2">
                  <span>⚠️</span>
                  <span>{errors.ghanaPostGPS.message}</span>
                </div>
              )}
            </div>
          )}
        />
      </div>

      {/* Region and City */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Region Field */}
        <FormField name="region" label="Region">
          <Controller
            name="region"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                value={field.value || ""}
                onChange={(e) => {
                  field.onChange(e);
                  onFieldChange?.("region", e.target.value);
                  // Clear city when region changes
                  setValue("city", "", { shouldDirty: true });
                  onFieldChange?.("city", "");
                }}
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {loading ? "Loading regions..." : "Select a region"}
                </option>
                {regions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.region && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.region.message}
            </p>
          )}
        </FormField>

        {/* City Field */}
        <FormField name="city" label="City/Town">
          <Controller
            name="city"
            control={control}
            render={({ field }) => {
              const availableCities = selectedRegion?.cities || [];
              const hasRegionSelected = !!locationData.region;

              return (
                <select
                  {...field}
                  value={field.value || ""}
                  onChange={(e) => {
                    field.onChange(e);
                    onFieldChange?.("city", e.target.value);
                  }}
                  disabled={!hasRegionSelected || loading}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {!hasRegionSelected
                      ? "Select a region first"
                      : availableCities.length === 0
                      ? "No cities available"
                      : "Select a city"}
                  </option>
                  {availableCities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              );
            }}
          />
          {errors.city && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.city.message}
            </p>
          )}
        </FormField>
      </div>

      {/* District and Locality */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField name="district" label="District">
          <TextInput
            name="district"
            placeholder="e.g., Tema Metropolitan"
            maxLength={50}
          />
        </FormField>
        <FormField name="locality" label="Locality/Neighborhood">
          <TextInput
            name="locality"
            placeholder="e.g., East Legon, Osu"
            maxLength={50}
          />
        </FormField>
      </div>

      {/* Nearby Landmark */}
      <FormField name="nearbyLandmark" label="Nearby Landmark">
        <TextInput
          name="nearbyLandmark"
          placeholder="e.g., Near Accra Mall, Behind Shell Station"
          maxLength={100}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Help others find you by mentioning a well-known landmark nearby
        </p>
      </FormField>

      {/* Additional Info */}
      <FormField name="other" label="Additional Location Information">
        <Controller
          name="other"
          control={control}
          render={({ field }) => (
            <div>
              <textarea
                {...field}
                rows={3}
                placeholder="Any other relevant location details"
                maxLength={200}
                value={field.value || ""}
                onChange={(e) => {
                  field.onChange(e);
                  onFieldChange?.("other", e.target.value);
                }}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 resize-none"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>Optional: Any other relevant location details</span>
                <span>{(field.value || "").length}/200</span>
              </div>
            </div>
          )}
        />
      </FormField>

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
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <span>{isGettingLocation ? "🌍" : "📍"}</span>
            <span>
              {isGettingLocation
                ? "Getting Location..."
                : "Get Current Location"}
            </span>
          </button>
        </div>

        {locationError && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <span className="text-red-600 dark:text-red-400">⚠️</span>
              <div>
                <p className="text-red-800 dark:text-red-200 font-medium text-sm">
                  Location Error
                </p>
                <p className="text-red-700 dark:text-red-300 text-sm mt-1">
                  {locationError}
                </p>
                <button
                  type="button"
                  onClick={() => setLocationError(null)}
                  className="text-red-600 dark:text-red-400 text-xs hover:underline mt-2"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {locationData.gpsCoordinates && (
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-green-800 dark:text-green-200">
                <span>📍</span>
                <span className="font-medium">GPS Coordinates Captured</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setValue("gpsCoordinates", undefined, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                  onFieldChange?.("gpsCoordinates", undefined);
                }}
                className="text-green-600 dark:text-green-400 text-xs hover:underline"
              >
                Clear
              </button>
            </div>
            <div className="text-sm text-green-700 dark:text-green-300 mt-1">
              Lat: {locationData.gpsCoordinates.latitude?.toFixed(6)}, Lng:{" "}
              {locationData.gpsCoordinates.longitude?.toFixed(6)}
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
            {Math.round(progress)}%
          </span>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="space-y-2 text-sm">
          {[
            { label: "Ghana Post GPS", condition: isGpsValid, required: true },
            {
              label: "Region & City",
              condition: locationData.region && locationData.city,
            },
            { label: "Landmark", condition: locationData.nearbyLandmark },
          ].map(({ label, condition, required }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">{label}</span>
              <span
                className={
                  condition
                    ? "text-green-600 dark:text-green-400"
                    : required
                    ? "text-red-600 dark:text-red-400"
                    : "text-gray-400"
                }
              >
                {condition
                  ? "✅ Complete"
                  : required
                  ? "❌ Required"
                  : "⭕ Optional"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-2">
          💡 Location Tips for Better Visibility
        </h4>
        <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
          {[
            "Accurate Ghana Post GPS helps customers find you easily",
            "Mention popular landmarks that locals recognize",
            "GPS coordinates enable precise mapping for services",
            "Complete location details build trust with customers",
          ].map((tip, index) => (
            <li key={index}>• {tip}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export type { LocationFormStepProps };
