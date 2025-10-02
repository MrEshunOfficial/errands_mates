"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useProviderProfile } from "@/hooks/providerProfiles/use-provider-profile";
import ProviderProfileDashboard, {
  ExtendedProviderProfile,
} from "@/components/user/provider-profile/provider.profile.dashboard/ProviderDashboard";

export default function PublicProviderProfilePage() {
  const params = useParams();
  const providerId = params.id as string;

  const [profile, setProfile] = useState<ExtendedProviderProfile | null>(null);
  const { loading, error, getPublicProfile } = useProviderProfile();

  useEffect(() => {
    const loadPublicProfile = async () => {
      try {
        const response = await getPublicProfile(providerId);
        if (response.data) {
          // The API returns data directly, not wrapped in another data property
          setProfile(response.data);
        }
      } catch (err) {
        console.error("Failed to load public profile:", err);
      }
    };

    if (providerId) {
      loadPublicProfile();
    }
  }, [providerId, getPublicProfile]);

  const handleRefresh = async () => {
    const response = await getPublicProfile(providerId);
    if (response.data) {
      setProfile(response.data);
    }
  };

  return (
    <ProviderProfileDashboard
      profile={profile}
      loading={loading}
      error={error}
      isOwnProfile={false}
      initialized={true}
      onRefresh={handleRefresh}
      onRetry={handleRefresh}
      visibleTabs={["overview", "profile", "services"]} // Hide analytics for public
      showEditControls={false}
      showRiskAssessment={false} // Don't show risk assessment to public
      showPerformanceMetrics={true}
    />
  );
}
