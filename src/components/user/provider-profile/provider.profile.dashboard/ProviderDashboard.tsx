"use client";
import React, { useMemo } from "react";
import {
  User,
  Star,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Briefcase,
  Edit,
  Zap,
  Plus,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { ProviderProfile, ProviderOperationalStatus, Service } from "@/types";

import {
  OverviewTab,
  AnalyticsTab,
  ProfileTab,
  ServicesTab,
} from "./ConsolidatedProviderTabs";
import { useRouter } from "next/navigation";

interface ProviderProfileDashboardProps {
  profile: ProviderProfile | null;
  loading?: boolean;
  error?: string | null;
  isOwnProfile?: boolean;
  initialized?: boolean;
  onRefresh?: () => Promise<void>;
  onEdit?: () => void;
  onRetry?: () => void;
  visibleTabs?: Array<"overview" | "analytics" | "profile" | "services">;
  showEditControls?: boolean;
  showRiskAssessment?: boolean;
  showPerformanceMetrics?: boolean;
}

const getStatusVariant = (
  status: ProviderOperationalStatus
):
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "success"
  | "warning" => {
  const variants: Record<
    ProviderOperationalStatus,
    "default" | "destructive" | "outline" | "secondary" | "success" | "warning"
  > = {
    [ProviderOperationalStatus.PROBATIONARY]: "warning",
    [ProviderOperationalStatus.ACTIVE]: "success",
    [ProviderOperationalStatus.RESTRICTED]: "warning",
    [ProviderOperationalStatus.SUSPENDED]: "destructive",
    [ProviderOperationalStatus.INACTIVE]: "outline",
  };
  return variants[status] ?? "default";
};

const generatePerformanceData = (profile: ProviderProfile) => {
  return [
    { month: "Jan", jobs: 12, rating: 4.2, revenue: 2400 },
    { month: "Feb", jobs: 18, rating: 4.5, revenue: 3600 },
    { month: "Mar", jobs: 25, rating: 4.6, revenue: 5000 },
    { month: "Apr", jobs: 22, rating: 4.7, revenue: 4400 },
    { month: "May", jobs: 30, rating: 4.8, revenue: 6000 },
    {
      month: "Jun",
      jobs: profile.performanceMetrics.totalJobs,
      rating: profile.performanceMetrics.averageRating,
      revenue: 7200,
    },
  ];
};

const generateMetricsComparisonData = (profile: ProviderProfile) => {
  const metrics = profile.performanceMetrics;
  return [
    {
      metric: "Completion",
      value: metrics.completionRate * 100,
      fullMark: 100,
    },
    {
      metric: "Response",
      value: Math.max(0, 100 - (metrics.averageResponseTime / 60) * 100),
      fullMark: 100,
    },
    {
      metric: "Retention",
      value: metrics.clientRetentionRate * 100,
      fullMark: 100,
    },
    {
      metric: "Quality",
      value: (metrics.averageRating / 5) * 100,
      fullMark: 100,
    },
    {
      metric: "Reliability",
      value: Math.max(0, 100 - metrics.cancellationRate * 100),
      fullMark: 100,
    },
  ];
};

const generateResponseTimeData = (profile: ProviderProfile) => {
  return [
    { day: "Mon", time: 25 },
    { day: "Tue", time: 30 },
    { day: "Wed", time: 22 },
    { day: "Thu", time: 28 },
    { day: "Fri", time: 35 },
    { day: "Sat", time: profile.performanceMetrics.averageResponseTime },
    { day: "Sun", time: 20 },
  ];
};

const ProviderProfileDashboard: React.FC<ProviderProfileDashboardProps> = ({
  profile,
  loading = false,
  error = null,
  isOwnProfile = false,
  onEdit,
  onRetry,
  visibleTabs = ["overview", "analytics", "profile", "services"],
  showEditControls,
  showRiskAssessment,
  showPerformanceMetrics = true,
}) => {
  const shouldShowEditControls = showEditControls ?? isOwnProfile;
  const shouldShowRiskAssessment = showRiskAssessment ?? isOwnProfile;
  const router = useRouter();

  const performanceData = useMemo(() => {
    return profile ? generatePerformanceData(profile) : [];
  }, [profile]);

  const metricsComparisonData = useMemo(() => {
    return profile ? generateMetricsComparisonData(profile) : [];
  }, [profile]);

  const responseTimeData = useMemo(() => {
    return profile ? generateResponseTimeData(profile) : [];
  }, [profile]);

  const serviceOfferingsCount = useMemo(() => {
    return profile?.serviceOfferings?.length ?? 0;
  }, [profile]);

  const hasWorkingHours = useMemo(() => {
    const workingHours = profile?.workingHours;
    return !!workingHours && Object.keys(workingHours).length > 0;
  }, [profile]);

  const hasContactInfo = useMemo(() => {
    return !!profile?.providerContactInfo?.businessContact;
  }, [profile]);

  const hasBusinessInfo = useMemo(() => {
    return !!(
      profile?.businessName || (profile?.serviceOfferings?.length ?? 0) > 0
    );
  }, [profile]);

  const contactInfo = useMemo(() => {
    return {
      businessEmail: profile?.providerContactInfo?.businessEmail,
      businessContact: profile?.providerContactInfo?.businessContact,
    };
  }, [profile]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl"
                ></div>
              ))}
            </div>
            <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
        <div className="max-w-7xl mx-auto">
          <Alert variant="destructive" className="border-2">
            <AlertTriangle className="h-5 w-5" />
            <AlertDescription className="ml-2">
              <div className="font-semibold mb-2">Error Loading Profile</div>
              <p className="text-sm mb-4">{error}</p>
              {onRetry && (
                <Button onClick={onRetry} variant="outline" size="sm">
                  Retry
                </Button>
              )}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // No profile state
  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="text-center p-12 border-2 border-dashed">
            <CardContent className="pt-6">
              <Avatar className="h-24 w-24 mx-auto mb-4">
                <AvatarFallback>
                  <User className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>
              <CardTitle className="mb-2">
                {isOwnProfile ? "No Provider Profile" : "Profile Not Found"}
              </CardTitle>
              <CardDescription className="mb-6">
                {isOwnProfile
                  ? "You haven't created a provider profile yet. Get started by creating one now."
                  : "This provider profile could not be found or is not available."}
              </CardDescription>
              {isOwnProfile && (
                <Button
                  size="lg"
                  onClick={() => router.push("profile/provider-profile/create")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Provider Profile
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const metrics = profile.performanceMetrics;

  // Main render
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent mb-2">
              {profile.businessName || "Provider Dashboard"}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                {serviceOfferingsCount} Service
                {serviceOfferingsCount !== 1 ? "s" : ""}
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                {metrics.averageRating.toFixed(1)} Rating
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span>{metrics.totalJobs} Jobs Completed</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {profile.operationalStatus && (
              <Badge
                variant={getStatusVariant(profile.operationalStatus)}
                className="text-sm px-4 py-2"
              >
                {profile.operationalStatus.replace("_", " ").toUpperCase()}
              </Badge>
            )}
            {shouldShowEditControls && onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {/* Key Metrics Cards */}
        {showPerformanceMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Average Rating
                </CardTitle>
                <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Star className="h-5 w-5 text-amber-600 dark:text-amber-400 fill-amber-600 dark:fill-amber-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {metrics.averageRating.toFixed(1)}
                </div>
                <div className="flex items-center mt-2 text-sm text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span>Based on {metrics.totalJobs} jobs</span>
                </div>
                <div className="flex gap-1 mt-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(metrics.averageRating)
                          ? "text-amber-500 fill-amber-500"
                          : "text-slate-300 dark:text-slate-700"
                      }`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Completion Rate
                </CardTitle>
                <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {(metrics.completionRate * 100).toFixed(0)}%
                </div>
                <Progress
                  value={metrics.completionRate * 100}
                  className="mt-3 h-2"
                />
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                  Excellent performance
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Response Time
                </CardTitle>
                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {metrics.averageResponseTime}
                  <span className="text-lg text-slate-500 dark:text-slate-400 ml-1">
                    min
                  </span>
                </div>
                <div className="flex items-center mt-2">
                  {metrics.averageResponseTime < 30 ? (
                    <Badge variant="default" className="bg-emerald-500">
                      <Zap className="h-3 w-3 mr-1" />
                      Excellent
                    </Badge>
                  ) : metrics.averageResponseTime < 60 ? (
                    <Badge variant="secondary">Good</Badge>
                  ) : (
                    <Badge variant="destructive">Needs improvement</Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Total Jobs
                </CardTitle>
                <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {metrics.totalJobs}
                </div>
                <div className="flex items-center justify-between mt-3 text-sm">
                  <span className="text-slate-600 dark:text-slate-400">
                    Retention:
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {(metrics.clientRetentionRate * 100).toFixed(0)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs Section */}
        <Tabs defaultValue={visibleTabs[0]} className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4 h-12">
            {visibleTabs.includes("overview") && (
              <TabsTrigger value="overview" className="text-sm">
                Overview
              </TabsTrigger>
            )}
            {visibleTabs.includes("analytics") && (
              <TabsTrigger value="analytics" className="text-sm">
                Analytics
              </TabsTrigger>
            )}
            {visibleTabs.includes("profile") && (
              <TabsTrigger value="profile" className="text-sm">
                Profile
              </TabsTrigger>
            )}
            {visibleTabs.includes("services") && (
              <TabsTrigger value="services" className="text-sm">
                Services
              </TabsTrigger>
            )}
          </TabsList>

          {visibleTabs.includes("overview") && (
            <TabsContent value="overview" className="space-y-6">
              <OverviewTab
                profile={profile}
                performanceData={performanceData}
                metricsComparisonData={metricsComparisonData}
                showPerformanceMetrics={showPerformanceMetrics}
              />
            </TabsContent>
          )}

          {visibleTabs.includes("analytics") && (
            <TabsContent value="analytics" className="space-y-6">
              <AnalyticsTab responseTimeData={responseTimeData} />
            </TabsContent>
          )}

          {visibleTabs.includes("profile") && (
            <TabsContent value="profile" className="space-y-6">
              <ProfileTab
                profile={profile}
                contactInfo={contactInfo}
                hasContactInfo={hasContactInfo}
                hasBusinessInfo={hasBusinessInfo}
                hasWorkingHours={hasWorkingHours}
                shouldShowEditControls={shouldShowEditControls}
                shouldShowRiskAssessment={shouldShowRiskAssessment}
                onEdit={onEdit}
              />
            </TabsContent>
          )}

          {visibleTabs.includes("services") && (
            <TabsContent value="services" className="space-y-6">
              <ServicesTab
                services={(profile.serviceOfferings || []) as Service[]}
                shouldShowEditControls={shouldShowEditControls}
                onEdit={onEdit}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default ProviderProfileDashboard;
