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
  Eye,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ClientProfileCard,
  ClientPreferences,
  ClientRiskIndicator,
} from "@/components/user/dashboard/client.dashboard/ClientDashboard";
import { usePublicClientProfile } from "@/hooks/clientProfiles/use-public-client-profile";

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
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
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
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
          >
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
            className="mb-6"
          >
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Client Profile
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <Eye className="h-4 w-4 text-gray-500" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Public view • Limited information available
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    / 5.0
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
            <ClientProfileCard profile={profile} isPublicView />
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
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Section - Reliability Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <CardHeader className="border-b border-gray-200 dark:border-gray-800 pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Reliability Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {profile.trustScore !== undefined && (
                <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                      Trust Score
                    </p>
                  </div>
                  <p className="text-4xl font-bold text-emerald-900 dark:text-emerald-100">
                    {profile.trustScore.toFixed(1)}
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-2">
                    High trust indicates reliable client behavior
                  </p>
                </div>
              )}
              {profile.averageRating !== undefined && (
                <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3 mb-2">
                    <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Average Rating
                    </p>
                  </div>
                  <p className="text-4xl font-bold text-blue-900 dark:text-blue-100">
                    {profile.averageRating.toFixed(1)} / 5.0
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                    Based on {profile.totalReviews || 0} verified reviews
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <CardHeader className="border-b border-gray-200 dark:border-gray-800 pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Activity Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Total Reviews
                      </p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                        {profile.totalReviews ?? 0}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {profile.loyaltyTier && (
                    <div className="flex justify-between items-center p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Loyalty Status
                        </span>
                      </div>
                      <span className="font-semibold text-amber-700 dark:text-amber-300 capitalize">
                        {profile.loyaltyTier}
                      </span>
                    </div>
                  )}
                  {profile.memberSince && (
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Account Age
                      </span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {Math.floor(
                          (new Date().getTime() -
                            new Date(profile.memberSince).getTime()) /
                            (1000 * 60 * 60 * 24 * 30)
                        )}{" "}
                        months
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
