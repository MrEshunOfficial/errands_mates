"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useProviderProfile } from "@/hooks/providerProfiles/use-provider-profile";
import ProviderProfileDashboard from "@/components/user/provider-profile/provider.profile.dashboard/ProviderDashboard";
import { ProviderProfile } from "@/types/provider-profile.types";
import { Loader2 } from "lucide-react";

export default function PublicProviderProfilePage() {
  const params = useParams();
  const providerId = params.id as string;

  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const { loading, error, getPublicProfile } = useProviderProfile();

  const loadPublicProfile = useCallback(async () => {
    if (!providerId) return;

    try {
      const response = await getPublicProfile(providerId);
      if (response.data) {
        setProfile(response.data as ProviderProfile);
      }
    } catch (err) {
      console.error("Failed to load public profile:", err);
    } finally {
      setIsInitialized(true);
    }
  }, [providerId, getPublicProfile]);

  useEffect(() => {
    loadPublicProfile();
  }, [loadPublicProfile]);

  const handleRefresh = useCallback(async () => {
    await loadPublicProfile();
  }, [loadPublicProfile]);

  // Show initial loading state
  if (!isInitialized && loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Loading Provider Profile
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Please wait while we fetch the provider information...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if profile not found
  if (isInitialized && !profile && !loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center space-y-4 max-w-md px-4">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Provider Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {error ||
                "The provider profile you're looking for doesn't exist or has been removed."}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProviderProfileDashboard
      profile={profile}
      loading={loading}
      error={error}
      isOwnProfile={false}
      initialized={isInitialized}
      onRefresh={handleRefresh}
      onRetry={handleRefresh}
      visibleTabs={["overview", "profile", "services"]}
      showEditControls={false}
      showRiskAssessment={false}
      showPerformanceMetrics={true}
    />
  );
}
