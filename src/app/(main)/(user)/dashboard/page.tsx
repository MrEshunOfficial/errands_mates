"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useMyProviderProfile } from "@/hooks/providerProfiles/use-provider-profile";
import ProviderProfileDashboard from "@/components/user/provider-profile/provider.profile.dashboard/ProviderDashboard";

export default function MyProviderProfilePage() {
  const router = useRouter();
  const { profile, profileLoading, initialized, error, loadProfile } =
    useMyProviderProfile({ autoLoad: true });

  const handleEdit = () => {
    router.push("/dashboard/my-profile/edit");
  };

  const handleRefresh = async () => {
    await loadProfile();
  };

  return (
    <ProviderProfileDashboard
      profile={profile}
      loading={profileLoading}
      error={error}
      isOwnProfile={true}
      initialized={initialized}
      onRefresh={handleRefresh}
      onEdit={handleEdit}
      onRetry={loadProfile}
      visibleTabs={["overview", "analytics", "profile", "services"]}
      showEditControls={true}
      showRiskAssessment={true}
      showPerformanceMetrics={true}
    />
  );
}
