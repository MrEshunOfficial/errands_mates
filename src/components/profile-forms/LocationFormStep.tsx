// LocationFormStep.tsx - Fixed Version with Proper Validation
"use client";

import React, { useEffect, useState } from "react";
import { useFormContext, Controller, PathValue } from "react-hook-form";
import Link from "next/link";
import { UpdateUserProfileFormData } from "@/lib/utils/schemas/profile.schemas";
import { getRegions } from "@/lib/api/location.api.config/get.regions";

// Components
import { LocationTips } from "./extras/location-tips";
import { LocationProgress } from "./extras/LocationProgress";

// Updated interfaces to match your actual API response
interface City {
  id?: string;
  name: string;
}

interface RawRegionData {
  id?: string;
  name?: string;
  region?: string;
  cities?: (string | City)[];
}

interface Region {
  id: string;
  name: string;
  cities: City[];
}

interface LocationFormStepProps {
  className?: string;
  onFieldChange?: (field: string, value: unknown) => void;
}

const validateGhanaPostGPS = (value: string): boolean => {
  return /^[A-Z]{2}-\d{3}-\d{4}$/.test(value);
};

const getLocationErrorMessage = (error: GeolocationPositionError): string => {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Location access denied. Please enable location permissions and try again.";
    case error.POSITION_UNAVAILABLE:
      return "Location service unavailable. Check your internet connection and GPS settings.";
    case error.TIMEOUT:
      return "Location request timed out. Please try again with a stable connection.";
    default:
      return "Location service error. Please check your device settings and try again.";
  }
};

// Enhanced geolocation options
const getGeolocationOptions = (): PositionOptions => ({
  enableHighAccuracy: true,
  timeout: 20000,
  maximumAge: 0,
});

// Data transformation utility
const transformRegionsData = (rawData: RawRegionData[]): Region[] => {
  return rawData
    .map((rawRegion, index): Region | null => {
      try {
        let regionName: string;
        let regionId: string;
        let regionCities: City[] = [];

        if (rawRegion.id && rawRegion.name) {
          regionName = rawRegion.name;
          regionId = rawRegion.id;
        } else if (rawRegion.region) {
          regionName = rawRegion.region;
          regionId = rawRegion.region.toLowerCase().replace(/\s+/g, "_");
        } else {
          console.warn(`Skipping invalid region at index ${index}:`, rawRegion);
          return null;
        }

        if (rawRegion.cities && Array.isArray(rawRegion.cities)) {
          regionCities = rawRegion.cities
            .map((city, cityIndex): City | null => {
              if (typeof city === "string") {
                return {
                  id: `${regionId}_${city.toLowerCase().replace(/\s+/g, "_")}`,
                  name: city,
                };
              } else if (city && typeof city === "object") {
                return {
                  id: city.id || `${regionId}_city_${cityIndex}`,
                  name: city.name || `City ${cityIndex + 1}`,
                };
              }
              return null;
            })
            .filter((city): city is City => city !== null);
        }

        return {
          id: regionId,
          name: regionName,
          cities: regionCities,
        };
      } catch (error) {
        console.error(
          `Error processing region at index ${index}:`,
          error,
          rawRegion
        );
        return null;
      }
    })
    .filter((region): region is Region => region !== null);
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
    trigger,
    clearErrors,
  } = useFormContext<UpdateUserProfileFormData>();

  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showGpsHelper, setShowGpsHelper] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const locationData = watch();
  const ghanaPostGPS = locationData.ghanaPostGPS || "";

  // Fetch regions with improved error handling
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        setLoading(true);
        setApiError(null);

        console.log("Fetching regions...");
        const response = await getRegions();
        console.log("Raw API response:", response);

        let rawRegionsData: RawRegionData[] = [];

        if (Array.isArray(response)) {
          rawRegionsData = response;
        } else if (response && typeof response === "object") {
          if (Array.isArray(response.data)) {
            rawRegionsData = response.data;
          } else if (Array.isArray(response.regions)) {
            rawRegionsData = response.regions;
          } else {
            throw new Error("Invalid API response structure");
          }
        } else {
          throw new Error("API returned invalid data format");
        }

        console.log("Raw regions data:", rawRegionsData);
        const transformedRegions = transformRegionsData(rawRegionsData);
        console.log("Transformed regions:", transformedRegions);

        setRegions(transformedRegions);

        if (transformedRegions.length === 0) {
          setApiError("No regions data available");
        }
      } catch (error) {
        console.error("Error fetching regions:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to load regions";
        setApiError(errorMessage);
        setRegions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRegions();
  }, []);

  // Enhanced field change handler with proper validation
  const handleFieldChange = <K extends keyof UpdateUserProfileFormData>(
    fieldName: K,
    value: UpdateUserProfileFormData[K]
  ) => {
    console.log(`Field ${String(fieldName)} changed to:`, value);

    clearErrors(fieldName);

    setValue(fieldName, value as PathValue<UpdateUserProfileFormData, K>, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });

    setTimeout(() => {
      trigger(fieldName);
    }, 0);

    onFieldChange?.(fieldName, value);
  };

  const handleGPSChange = (value: string) => {
    const upperValue = value.toUpperCase();
    handleFieldChange("ghanaPostGPS", upperValue);
  };

  const handleRegionChange = (regionId: string) => {
    // Clear city when region changes
    handleFieldChange("region", regionId);
    handleFieldChange("city", "");
  };

  const handleCityChange = (cityId: string) => {
    handleFieldChange("city", cityId);
  };

  // Enhanced location getter with better error handling
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError(
        "Geolocation is not supported by this browser. Please enter coordinates manually."
      );
      return;
    }

    if (!window.isSecureContext) {
      setLocationError(
        "Location services require a secure connection (HTTPS). Please use a secure connection."
      );
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    try {
      const permission = await navigator.permissions.query({
        name: "geolocation",
      });

      if (permission.state === "denied") {
        throw new GeolocationPositionError();
      }

      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            getGeolocationOptions()
          );
        }
      );

      const { latitude, longitude } = position.coords;
      const coordinates = { latitude, longitude };

      handleFieldChange("gpsCoordinates", coordinates);
      setLocationError(null);

      console.log("Location retrieved successfully:", coordinates);
    } catch (error) {
      console.error("Geolocation error:", error);

      let errorMessage: string;

      if (error instanceof GeolocationPositionError) {
        errorMessage = getLocationErrorMessage(error);
      } else {
        errorMessage =
          "Unable to retrieve location. Please check your browser settings and try again.";
      }

      setLocationError(errorMessage);
    } finally {
      setIsGettingLocation(false);
    }
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
            const newValue = e.target.value;
            field.onChange(newValue);
            handleFieldChange(name, newValue);
          }}
          onBlur={field.onBlur}
          className={`w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 ${inputClassName}`}
        />
      )}
    />
  );

  const getSelectedRegion = (): Region | undefined => {
    const selectedRegionId = locationData.region;
    return regions.find((region) => region.id === selectedRegionId);
  };

  const selectedRegion = getSelectedRegion();
  const isGpsValid = validateGhanaPostGPS(ghanaPostGPS);
  const progress = calculateProgress();

  return (
    <div className={`space-y-8 ${className}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Help others find you by providing accurate location information.
        </p>
        <div className="flex items-center space-x-3">
          <LocationTips />
          <LocationProgress
            progress={progress}
            isGpsValid={isGpsValid}
            locationData={locationData}
          />
        </div>
      </div>

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
                  const newValue = e.target.value;
                  field.onChange(newValue);
                  handleGPSChange(newValue);
                }}
                onBlur={field.onBlur}
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
                  const newValue = e.target.value;
                  field.onChange(newValue);
                  handleRegionChange(newValue);
                }}
                onBlur={field.onBlur}
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
                    const newValue = e.target.value;
                    field.onChange(newValue);
                    handleCityChange(newValue);
                  }}
                  onBlur={field.onBlur}
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
          {errors.district && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.district.message}
            </p>
          )}
        </FormField>
        <FormField name="locality" label="Locality/Neighborhood">
          <TextInput
            name="locality"
            placeholder="e.g., East Legon, Osu"
            maxLength={50}
          />
          {errors.locality && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.locality.message}
            </p>
          )}
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
        {errors.nearbyLandmark && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.nearbyLandmark.message}
          </p>
        )}
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
                  const newValue = e.target.value;
                  field.onChange(newValue);
                  handleFieldChange("other", newValue);
                }}
                onBlur={field.onBlur}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 resize-none"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>Optional: Any other relevant location details</span>
                <span>{(field.value || "").length}/200</span>
              </div>
              {errors.other && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.other.message}
                </p>
              )}
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
                <div className="flex space-x-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setLocationError(null)}
                    className="text-red-600 dark:text-red-400 text-xs hover:underline"
                  >
                    Dismiss
                  </button>
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="text-red-600 dark:text-red-400 text-xs hover:underline"
                  >
                    Try Again
                  </button>
                </div>
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
                  handleFieldChange("gpsCoordinates", undefined);
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

        {errors.gpsCoordinates && (
          <div className="text-red-600 dark:text-red-400 text-sm">
            {errors.gpsCoordinates.message}
          </div>
        )}
      </div>
    </div>
  );
}

export type { LocationFormStepProps };
