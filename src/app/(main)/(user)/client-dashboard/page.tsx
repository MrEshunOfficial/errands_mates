// app/client-dashboard/page.tsx
"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Settings,
  Edit,
  TrendingUp,
  Award,
  Activity,
  ChevronRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ClientProfileCard,
  ClientActivityTimeline,
  ClientRiskIndicator,
  ClientPreferences,
  ClientReliabilityScore,
} from "@/components/user/dashboard/client.dashboard/ClientDashboard";
import { useClientProfile } from "@/hooks/clientProfiles/use-client-profile";
import type {
  ReliabilityMetrics,
  CreateClientProfileRequest,
  UpdateClientProfileRequest,
} from "@/types";
import { VerificationStatus } from "@/types/client-profile.types";
import { ClientProfileForm } from "@/components/user/dashboard/client.dashboard/ClientProfileForm";

export default function ClientDashboardPage() {
  const {
    profile,
    loading,
    error,
    isUpdating,
    isCreating,
    updateProfile,
    createProfile,
    refreshProfile,
    clearError,
  } = useClientProfile();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const reliabilityMetrics = useMemo<ReliabilityMetrics | null>(() => {
    if (!profile) return null;

    return {
      reliabilityScore: profile.trustScore || 0,
      engagement: {
        memberSince: profile.memberSince,
        lastActiveDate: profile.lastActiveDate,
        responseTime: undefined,
        loyaltyTier: profile.loyaltyTier,
      },
      reputation: {
        averageRating: profile.averageRating,
        totalReviews: profile.totalReviews,
      },
    };
  }, [profile]);

  const verificationStatus = useMemo<VerificationStatus | null>(() => {
    if (!profile) return null;

    return {
      isVerified: true,
      verificationLevel: "partial",
      verifiedAspects: {
        phone: false,
        email: true,
        address: false,
      },
      loyaltyTier: profile.loyaltyTier,
      memberSince: profile.memberSince,
      averageRating: profile.averageRating,
      totalReviews: profile.totalReviews,
    };
  }, [profile]);

  const handleUpdateProfile = async (data: UpdateClientProfileRequest) => {
    try {
      await updateProfile(data);
      setIsEditDialogOpen(false);
      await refreshProfile();
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  const handleCreateProfile = async (data: CreateClientProfileRequest) => {
    try {
      await createProfile(data);
      await refreshProfile();
    } catch (error) {
      console.error("Failed to create profile:", error);
    }
  };

  const getProfileName = () => {
    if (!profile?.profileId) return "User";
    if (typeof profile.profileId === "string") return "User";
    if (
      typeof profile.profileId === "object" &&
      "userId" in profile.profileId
    ) {
      const userId = profile.profileId.userId;
      if (typeof userId === "object" && userId && "name" in userId) {
        return userId.name;
      }
    }
    return "User";
  };

  // Loading State
  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto" />
          <div>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Loading your dashboard
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Please wait...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error State (without profile)
  if (error && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-4">
          <Alert
            variant="destructive"
            className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
          >
            <AlertDescription className="text-red-800 dark:text-red-200">
              {error}
            </AlertDescription>
          </Alert>
          <Button
            onClick={clearError}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // No Profile State - Show Create Form
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <Card className="border border-gray-200 dark:border-gray-800">
            <CardContent className="pt-6">
              {error && (
                <Alert
                  variant="destructive"
                  className="mb-6 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
                >
                  <AlertDescription className="text-red-800 dark:text-red-200">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              <ClientProfileForm
                mode="create"
                onSubmit={handleCreateProfile}
                isSubmitting={isCreating}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main Dashboard with Profile
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                <span>Dashboard</span>
                <ChevronRight className="h-4 w-4" />
                <span className="text-gray-900 dark:text-gray-100">
                  Client Profile
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {getProfileName()}
              </h1>
            </div>
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Edit Profile
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 dark:text-gray-400">
                    Update your communication preferences and service interests
                  </DialogDescription>
                </DialogHeader>
                <ClientProfileForm
                  mode="update"
                  initialData={{
                    preferredContactMethod: profile.preferredContactMethod,
                    preferredServices: profile.preferredServices,
                    preferredProviders: profile.preferredProviders,
                  }}
                  onSubmit={handleUpdateProfile}
                  onCancel={() => setIsEditDialogOpen(false)}
                  isSubmitting={isUpdating}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert
            variant="destructive"
            className="mb-6 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
          >
            <AlertDescription className="text-red-800 dark:text-red-200">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Trust Score
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {profile.trustScore}
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                  <Settings className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
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
                    {profile.loyaltyTier}
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
                    Average Rating
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {profile.averageRating !== undefined
                      ? profile.averageRating.toFixed(1)
                      : "N/A"}
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
                    Total Reviews
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {profile.totalReviews}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            <ClientProfileCard profile={profile} />

            {reliabilityMetrics && (
              <ClientReliabilityScore
                metrics={reliabilityMetrics}
                verification={verificationStatus ?? undefined}
              />
            )}

            <ClientActivityTimeline profile={profile} />
          </div>

          {/* Sidebar Column */}
          <div className="space-y-8">
            <ClientRiskIndicator profile={profile} />

            <ClientPreferences profile={profile} />

            {/* Verification Card */}
            <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <CardHeader className="border-b border-gray-200 dark:border-gray-800 pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Verification Status
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email
                      </span>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${
                          verificationStatus?.verifiedAspects.email
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {verificationStatus?.verifiedAspects.email
                          ? "Verified"
                          : "Pending"}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all"
                        style={{
                          width: verificationStatus?.verifiedAspects.email
                            ? "100%"
                            : "0%",
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Phone
                      </span>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${
                          verificationStatus?.verifiedAspects.phone
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        }`}
                      >
                        {verificationStatus?.verifiedAspects.phone
                          ? "Verified"
                          : "Pending"}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-amber-500 h-2 rounded-full transition-all"
                        style={{
                          width: verificationStatus?.verifiedAspects.phone
                            ? "100%"
                            : "60%",
                        }}
                      />
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
                  Complete all verifications to unlock premium features
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
