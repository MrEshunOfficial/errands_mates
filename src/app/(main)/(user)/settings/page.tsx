"use client";
import React, { useState, useCallback, useMemo } from "react";
import type {
  IUserPreferences,
  NotificationPreferences,
  PrivacySettings,
  AppPreferences,
  PreferenceCategory,
  UpdatePreferenceRequest,
  BulkUpdatePreferenceRequest,
} from "@/types/base.types";
import { useProfile } from "@/hooks/profiles/useProfile";
import {
  BulkUpdatePreferencesData,
  UpdateSpecificPreferenceData,
} from "@/lib/api/profiles/profile.api";
import LoadingOverlay from "@/components/ui/LoadingOverlay";

interface PreferencesManagerProps {
  className?: string;
  onPreferenceUpdate?: (
    category: PreferenceCategory,
    key: string,
    value: boolean | string | number | object
  ) => void;
  onBulkUpdate?: (
    category: PreferenceCategory,
    updates:
      | Partial<NotificationPreferences>
      | Partial<PrivacySettings>
      | Partial<AppPreferences>
  ) => void;
}

interface PreferenceSection {
  title: string;
  description: string;
  category: PreferenceCategory;
  icon: string;
}

const PreferencesManager: React.FC<PreferencesManagerProps> = ({
  className = "",
  onPreferenceUpdate,
  onBulkUpdate,
}) => {
  const {
    profile,
    updateSpecificPreference,
    bulkUpdatePreferences,
    isLoading,
    error,
    clearError,
  } = useProfile();

  type PreferenceValue<T extends PreferenceCategory> = T extends "notifications"
    ? Partial<NotificationPreferences>
    : T extends "privacy"
    ? Partial<PrivacySettings>
    : T extends "app"
    ? Partial<AppPreferences>
    : never;

  const [activeSection, setActiveSection] =
    useState<PreferenceCategory>("notifications");
  const [pendingChanges, setPendingChanges] = useState<{
    notifications: Partial<NotificationPreferences>;
    privacy: Partial<PrivacySettings>;
    app: Partial<AppPreferences>;
  }>({
    notifications: {},
    privacy: {},
    app: {},
  });

  const preferences = useMemo((): IUserPreferences => {
    return (
      profile?.preferences || {
        notifications: {
          email: true,
          sms: true,
          push: true,
          bookingUpdates: true,
          promotions: false,
          providerMessages: true,
          systemAlerts: true,
          weeklyDigest: false,
        },
        privacy: {
          shareProfile: true,
          shareLocation: false,
          shareContactDetails: false,
          preferCloseProximity: {
            location: false,
            radius: 5,
          },
          allowDirectContact: true,
          showOnlineStatus: true,
        },
        app: {
          theme: "system" as const,
          language: "en",
          currency: "GHS" as const,
          distanceUnit: "km" as const,
          autoRefresh: true,
          soundEnabled: true,
        },
      }
    );
  }, [profile?.preferences]);

  const sections: PreferenceSection[] = [
    {
      title: "Notifications",
      description: "Manage how you receive notifications",
      category: "notifications",
      icon: "🔔",
    },
    {
      title: "Privacy",
      description: "Control your privacy and visibility settings",
      category: "privacy",
      icon: "🔒",
    },
    {
      title: "App Settings",
      description: "Customize your app experience",
      category: "app",
      icon: "⚙️",
    },
  ];

  const handleSinglePreferenceUpdate = useCallback(
    async (
      category: PreferenceCategory,
      key: string,
      value: boolean | string | number
    ) => {
      try {
        let updateData: UpdatePreferenceRequest;

        if (key.includes(".")) {
          const [parentKey, childKey] = key.split(".");
          const currentParentValue = preferences[category][
            parentKey as keyof (typeof preferences)[typeof category]
          ] as Record<string, unknown>;
          const updatedParentValue = {
            ...currentParentValue,
            [childKey]: value,
          };

          updateData = {
            category,
            key: parentKey,
            value: updatedParentValue,
          };
        } else {
          updateData = {
            category,
            key,
            value,
          };
        }

        await updateSpecificPreference(
          updateData as unknown as UpdateSpecificPreferenceData
        );
        onPreferenceUpdate?.(category, key, value);

        setPendingChanges((prev) => ({
          ...prev,
          [category]: {
            ...prev[category],
            [key]: undefined,
          },
        }));
      } catch (error) {
        console.error("Failed to update preference:", error);
      }
    },
    [updateSpecificPreference, onPreferenceUpdate, preferences]
  );

  const handleBulkUpdate = useCallback(
    async (category: PreferenceCategory) => {
      const updates = pendingChanges[category];
      if (Object.keys(updates).length === 0) return;

      try {
        const bulkUpdateData: BulkUpdatePreferenceRequest = {
          category,
          updates,
        };

        await bulkUpdatePreferences(
          bulkUpdateData as unknown as BulkUpdatePreferencesData
        );
        onBulkUpdate?.(category, updates);

        setPendingChanges((prev) => ({
          ...prev,
          [category]: {} as PreferenceValue<typeof category>,
        }));
      } catch (error) {
        console.error("Failed to bulk update preferences:", error);
      }
    },
    [bulkUpdatePreferences, pendingChanges, onBulkUpdate]
  );

  const updatePendingChange = useCallback(
    (
      category: PreferenceCategory,
      key: string,
      value: boolean | string | number
    ) => {
      setPendingChanges((prev) => ({
        ...prev,
        [category]: {
          ...prev[category],
          [key]: value as
            | NotificationPreferences[keyof NotificationPreferences]
            | PrivacySettings[keyof PrivacySettings]
            | AppPreferences[keyof AppPreferences],
        },
      }));
    },
    []
  );

  const getEffectiveValue = useCallback(
    (
      category: PreferenceCategory,
      key: string
    ): boolean | string | number | undefined => {
      const pendingValue =
        pendingChanges[category][
          key as keyof (typeof pendingChanges)[typeof category]
        ];
      if (pendingValue !== undefined) {
        return pendingValue as boolean | string | number;
      }

      if (key.includes(".")) {
        const [parentKey, childKey] = key.split(".");
        const parentValue = preferences[category][
          parentKey as keyof (typeof preferences)[typeof category]
        ] as Record<string, unknown>;
        return parentValue?.[childKey] as boolean | string | number;
      }

      return preferences[category]?.[
        key as keyof (typeof preferences)[typeof category]
      ] as boolean | string | number;
    },
    [preferences, pendingChanges]
  );

  const hasPendingChanges = useCallback(
    (category: PreferenceCategory) => {
      return Object.keys(pendingChanges[category]).length > 0;
    },
    [pendingChanges]
  );

  const renderToggleSwitch = (
    category: PreferenceCategory,
    key: string,
    label: string,
    description?: string,
    immediate: boolean = true
  ) => {
    const value = getEffectiveValue(category, key) as boolean;
    const isPending =
      pendingChanges[category][
        key as keyof (typeof pendingChanges)[typeof category]
      ] !== undefined;

    const handleChange = (newValue: boolean) => {
      if (immediate) {
        handleSinglePreferenceUpdate(category, key, newValue);
      } else {
        updatePendingChange(category, key, newValue);
      }
    };

    return (
      <div
        key={key}
        className={`group relative flex items-center justify-between p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
          value
            ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700"
            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
        }`}
      >
        {isPending && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
        )}

        <div className="flex-1 pr-4">
          <label className="block text-sm font-semibold cursor-pointer text-gray-800 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-gray-100">
            {label}
          </label>
          {description && (
            <p className="text-xs mt-1 text-gray-600 dark:text-gray-400 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={value || false}
            onChange={(e) => handleChange(e.target.checked)}
            disabled={isLoading}
            aria-label={label}
          />
          <div
            className={`
            w-12 h-6 rounded-full peer transition-all duration-300 ease-in-out
            ${
              value
                ? "bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30"
                : "bg-gray-300 dark:bg-gray-600"
            }
            peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800
            peer-checked:after:translate-x-6 peer-checked:after:border-white 
            after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
            after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-300
            ${value ? "after:shadow-lg" : ""}
          `}
          ></div>
        </label>
      </div>
    );
  };

  const renderSelectInput = (
    category: PreferenceCategory,
    key: string,
    label: string,
    options: Array<{ value: string; label: string }>,
    immediate: boolean = true
  ) => {
    const value = getEffectiveValue(category, key) as string;
    const isPending =
      pendingChanges[category][
        key as keyof (typeof pendingChanges)[typeof category]
      ] !== undefined;

    const handleChange = (newValue: string) => {
      if (immediate) {
        handleSinglePreferenceUpdate(category, key, newValue);
      } else {
        updatePendingChange(category, key, newValue);
      }
    };

    return (
      <div
        key={key}
        className="relative p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 hover:shadow-md"
      >
        {isPending && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
        )}

        <label className="block text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">
          {label}
        </label>
        <select
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          disabled={isLoading}
          className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const renderNumberInput = (
    category: PreferenceCategory,
    key: string,
    label: string,
    min: number,
    max: number,
    immediate: boolean = true
  ) => {
    const value = getEffectiveValue(category, key) as number;
    const isPending =
      pendingChanges[category][
        key as keyof (typeof pendingChanges)[typeof category]
      ] !== undefined;

    const handleChange = (newValue: number) => {
      if (immediate) {
        handleSinglePreferenceUpdate(category, key, newValue);
      } else {
        updatePendingChange(category, key, newValue);
      }
    };

    return (
      <div
        key={key}
        className="relative p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 hover:shadow-md"
      >
        {isPending && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
        )}

        <label className="block text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">
          {label}
        </label>
        <div className="relative">
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            onChange={(e) => handleChange(parseInt(e.target.value, 10))}
            disabled={isLoading}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <div className="absolute right-3 top-2.5 text-xs text-gray-500 dark:text-gray-400">
            {min}-{max}
          </div>
        </div>
      </div>
    );
  };

  const renderNotificationsSection = () => {
    return (
      <div className="space-y-4">
        <div className="grid gap-4">
          {renderToggleSwitch(
            "notifications",
            "email",
            "Email Notifications",
            "Receive notifications via email"
          )}
          {renderToggleSwitch(
            "notifications",
            "sms",
            "SMS Notifications",
            "Receive notifications via text message"
          )}
          {renderToggleSwitch(
            "notifications",
            "push",
            "Push Notifications",
            "Receive push notifications in the app"
          )}
          {renderToggleSwitch(
            "notifications",
            "bookingUpdates",
            "Booking Updates",
            "Get updates on your bookings"
          )}
          {renderToggleSwitch(
            "notifications",
            "promotions",
            "Promotions",
            "Receive promotional offers and news"
          )}
          {renderToggleSwitch(
            "notifications",
            "providerMessages",
            "Provider Messages",
            "Get notified when providers send you messages"
          )}
          {renderToggleSwitch(
            "notifications",
            "systemAlerts",
            "System Alerts",
            "Important system notifications and updates"
          )}
          {renderToggleSwitch(
            "notifications",
            "weeklyDigest",
            "Weekly Digest",
            "Receive a weekly summary of your activity"
          )}
        </div>
      </div>
    );
  };

  const renderPrivacySection = () => {
    return (
      <div className="space-y-6">
        <div className="grid gap-4">
          {renderToggleSwitch(
            "privacy",
            "shareProfile",
            "Share Profile",
            "Allow others to view your profile information"
          )}
          {renderToggleSwitch(
            "privacy",
            "shareLocation",
            "Share Location",
            "Allow location sharing with service providers"
          )}
          {renderToggleSwitch(
            "privacy",
            "shareContactDetails",
            "Share Contact Details",
            "Allow sharing of contact information"
          )}
          {renderToggleSwitch(
            "privacy",
            "allowDirectContact",
            "Allow Direct Contact",
            "Let providers contact you directly"
          )}
          {renderToggleSwitch(
            "privacy",
            "showOnlineStatus",
            "Show Online Status",
            "Display when you are online"
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex items-center mb-4">
            <span className="text-lg mr-2">📍</span>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Location Preferences
            </h4>
          </div>
          <div className="grid gap-4">
            {renderToggleSwitch(
              "privacy",
              "preferCloseProximity.location",
              "Prefer Close Proximity",
              "Prioritize nearby service providers"
            )}
            {getEffectiveValue("privacy", "preferCloseProximity.location") && (
              <div className="ml-4">
                {renderNumberInput(
                  "privacy",
                  "preferCloseProximity.radius",
                  "Search Radius (km)",
                  1,
                  50
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderAppSection = () => {
    return (
      <div className="space-y-4">
        <div className="grid gap-4">
          {renderSelectInput("app", "theme", "Theme", [
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
            { value: "system", label: "System Default" },
          ])}

          {renderSelectInput("app", "language", "Language", [
            { value: "en", label: "English" },
            { value: "tw", label: "Twi" },
            { value: "ga", label: "Ga" },
          ])}

          {renderSelectInput("app", "currency", "Currency", [
            { value: "GHS", label: "Ghana Cedis (GHS)" },
            { value: "USD", label: "US Dollars (USD)" },
            { value: "EUR", label: "Euros (EUR)" },
          ])}

          {renderSelectInput("app", "distanceUnit", "Distance Unit", [
            { value: "km", label: "Kilometers" },
            { value: "miles", label: "Miles" },
          ])}

          {renderToggleSwitch(
            "app",
            "autoRefresh",
            "Auto Refresh",
            "Automatically refresh content"
          )}
          {renderToggleSwitch(
            "app",
            "soundEnabled",
            "Sound Effects",
            "Enable sound effects in the app"
          )}
        </div>
      </div>
    );
  };

  const renderSectionContent = (category: PreferenceCategory) => {
    switch (category) {
      case "notifications":
        return renderNotificationsSection();
      case "privacy":
        return renderPrivacySection();
      case "app":
        return renderAppSection();
      default:
        return null;
    }
  };

  return (
    <div
      className={`w-full min-h-screen rounded-2xl shadow-xl border bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}
    >
      {/* Error Display */}
      {error && (
        <div className="mx-8 mt-6 p-4 rounded-xl border bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 animate-slideIn">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <span className="text-xl mr-2">⚠️</span>
              <p className="text-sm font-medium">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="ml-4 text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors duration-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Sidebar Navigation */}
        <div className="w-80 border-r bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-gray-200 dark:border-gray-700">
          <nav className="p-6 space-y-2">
            {sections.map((section) => (
              <button
                key={section.category}
                onClick={() => setActiveSection(section.category)}
                className={`group w-full text-left p-4 rounded-xl text-sm font-medium transition-all duration-300 ${
                  activeSection === section.category
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 transform scale-[1.02]"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-md"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{section.icon}</span>
                    <div>
                      <div className="font-semibold">{section.title}</div>
                      <div
                        className={`text-xs mt-1 ${
                          activeSection === section.category
                            ? "text-blue-100"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {section.description}
                      </div>
                    </div>
                  </div>
                  {hasPendingChanges(section.category) && (
                    <div className="relative">
                      <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
                      <div className="absolute inset-0 w-3 h-3 bg-amber-400 rounded-full animate-ping"></div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 relative">
          <div className="p-8">
            <div className="mb-8">
              <div className="flex items-center mb-2">
                <span className="text-3xl mr-3">
                  {sections.find((s) => s.category === activeSection)?.icon}
                </span>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {sections.find((s) => s.category === activeSection)?.title}
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {
                  sections.find((s) => s.category === activeSection)
                    ?.description
                }
              </p>
            </div>

            {/* Pending Changes Banner */}
            {hasPendingChanges(activeSection) && (
              <div className="mb-6 p-4 rounded-xl border bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 border-amber-200 dark:border-amber-700 animate-slideIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-xl mr-2">💾</span>
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                      You have unsaved changes in this section
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() =>
                        setPendingChanges((prev) => ({
                          ...prev,
                          [activeSection]: {},
                        }))
                      }
                      className="px-4 py-2 text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors duration-200"
                    >
                      Discard
                    </button>
                    <button
                      onClick={() => handleBulkUpdate(activeSection)}
                      disabled={isLoading}
                      className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-50 bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Saving...
                        </div>
                      ) : (
                        "Save Changes"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Section Content */}
            <div className="space-y-6 animate-fadeIn">
              {renderSectionContent(activeSection)}
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && <LoadingOverlay show={true} />}
    </div>
  );
};

export default PreferencesManager;
