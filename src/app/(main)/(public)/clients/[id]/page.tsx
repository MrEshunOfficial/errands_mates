// app/clients/[id]/page.tsx
"use client";

import { useParams } from "next/navigation";
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Loader2,
  Shield,
  TrendingUp,
  Award,
  Activity,
  Calendar,
  InfoIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ClientProfileCard,
  ClientPreferences,
  ClientRiskIndicator,
  ClientServicesCard,
} from "@/components/user/dashboard/client.dashboard/ClientDashboard";
import { usePublicClientProfile } from "@/hooks/clientProfiles/use-public-client-profile";
import { ClientProfile, isProfileIdObject, isUserIdObject } from "@/types";
import Image from "next/image";

export default function PublicClientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const {
    profile,
    loading,
    error,
    fetchPublicProfile,
    fetchPublicStats,
    clearError,
  } = usePublicClientProfile();

  useEffect(() => {
    if (clientId) {
      fetchPublicProfile(clientId);
      fetchPublicStats(clientId);
    }
  }, [clientId, fetchPublicProfile, fetchPublicStats]);

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading client profile...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          <Alert
            variant="destructive"
            className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
            <AlertDescription className="text-red-800 dark:text-red-200">
              {error}
            </AlertDescription>
          </Alert>
          <Button
            onClick={clearError}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              Client profile not found
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Helper function to safely extract user name
  const getUserName = (profile: Partial<ClientProfile>): string => {
    if (profile.profileId && isProfileIdObject(profile.profileId)) {
      const userId = profile.profileId.userId;
      if (userId && isUserIdObject(userId)) {
        return userId.name;
      }
    }
    return "Client Profile";
  };

  // Helper function to safely extract profile picture
  const getProfilePicture = (
    profile: Partial<ClientProfile>
  ): string | null => {
    if (profile.profileId && isProfileIdObject(profile.profileId)) {
      return profile.profileId.profilePicture?.url || null;
    }
    return null;
  };

  // Helper function to safely extract location
  const getLocation = (profile: Partial<ClientProfile>): string | null => {
    if (profile.profileId && isProfileIdObject(profile.profileId)) {
      const location = profile.profileId.location;
      if (location?.city) return location.city;
      if (location?.region) return location.region;
    }
    return null;
  };

  // helper function to safely extract bio
  const getBio = (profile: Partial<ClientProfile>): string | null => {
    if (profile.profileId && isProfileIdObject(profile.profileId)) {
      return profile.profileId.bio || null;
    }
    return null;
  };

  const userName = getUserName(profile);
  const profilePicture = getProfilePicture(profile);
  const location = getLocation(profile);
  const bio = getBio(profile);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Profile Picture */}
              {profilePicture ? (
                <Image
                  src={profilePicture}
                  alt={userName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                  width={64}
                  height={64}
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  <span className="text-white text-xl font-semibold">
                    {userName?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                </div>
              )}

              {/* Header Info */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {userName}
                </h1>
                <div className="flex items-center gap-2 mt-2">
                  <InfoIcon className="h-4 w-4 text-gray-500" />
                  {bio && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {bio.charAt(0).toUpperCase() + bio.slice(1)}
                    </p>
                  )}
                </div>
                {location && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    📍 {location}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {/* Stats Grid - Top Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Trust Score
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {profile.trustScore?.toFixed(1) ?? "N/A"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                  <Shield className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Average Rating
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {profile.averageRating?.toFixed(1) ?? "N/A"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                  <Activity className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Loyalty Tier
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 capitalize">
                    {profile.loyaltyTier ?? "N/A"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                  <Award className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Total Reviews
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {profile.totalReviews ?? 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left Column - Profile and Preferences */}
          <div className="lg:col-span-2 space-y-8">
            <ClientProfileCard profile={profile} />
            <ClientPreferences profile={profile} />
          </div>

          {/* Right Column - Risk and Details */}
          <div className="space-y-8">
            <ClientRiskIndicator profile={profile} />

            <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <CardHeader className="border-b border-gray-200 dark:border-gray-800 pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Engagement Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {profile.memberSince && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Member Since
                    </span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {new Date(profile.memberSince).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {profile.lastActiveDate && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Last Active
                    </span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {new Date(profile.lastActiveDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {profile.loyaltyTier && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Current Tier
                    </span>
                    <span className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                      {profile.loyaltyTier}
                    </span>
                  </div>
                )}
                {profile.warningsCount !== undefined && (
                  <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">
                      Active Warnings
                    </span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {profile.warningsCount}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Services Section */}
        <div className="mb-8">
          <ClientServicesCard profile={profile} />
        </div>
      </div>
    </div>
  );
}
