"use client";
import React, { useEffect } from "react";
import { useMyProviderProfile } from "@/hooks/providerProfiles/use-provider-profile";

export default function ProviderProfile() {
  const { profile, loading, profileLoading, error, initialized, loadProfile } =
    useMyProviderProfile({
      autoLoad: true,
    });

  // Debug logs to help troubleshoot
  useEffect(() => {
    console.log("Provider Profile Debug:", {
      profile,
      loading,
      profileLoading,
      error,
      initialized,
    });
  }, [profile, loading, profileLoading, error, initialized]);

  // Combined loading state
  const isLoading = loading || profileLoading;

  // Loading state
  if (isLoading) return <div>Please wait...</div>;

  // Error state
  if (error) return <div>An error occurred: {error}</div>;

  // No profile found (but API call completed successfully)
  if (initialized && !profile && !isLoading) {
    return (
      <div>
        <p>No provider profile found.</p>
        <button
          onClick={loadProfile}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry Loading Profile
        </button>
      </div>
    );
  }

  // Profile exists
  if (profile) {
    console.log("Registered provider profile:", profile);
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Provider Profile</h1>
        <div className="space-y-4">
          <div>
            <strong>Business Name:</strong> {profile.businessName || "N/A"}
          </div>
          <div>
            <strong>Available for Work:</strong>{" "}
            {profile.isAvailableForWork ? "Yes" : "No"}
          </div>
          <div>
            <strong>Service Offerings:</strong>{" "}
            {profile.serviceOfferings?.length || 0} services
          </div>
          <div>
            <strong>Status:</strong> {profile.operationalStatus || "N/A"}
          </div>
          {/* Add more profile fields as needed */}
        </div>
      </div>
    );
  }

  // Fallback - should not reach here normally
  return <div>Loading profile...</div>;
}
