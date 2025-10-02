// OverviewTab.tsx
import React from "react";
import {
  TrendingUp,
  Activity,
  XCircle,
  AlertTriangle,
  Phone,
  Clock,
  Ban,
  Briefcase,
  Building,
  Calendar,
  CheckCircle,
  Edit,
  FileText,
  Mail,
  Shield,
  ExternalLink,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ContactDetails, RiskLevel, Service, ServiceStatus } from "@/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Separator } from "@radix-ui/react-dropdown-menu";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useRouter } from "next/navigation";
import { ExtendedProviderProfile } from "./ProviderDashboard";

interface OverviewTabProps {
  profile: ExtendedProviderProfile;
  performanceData: Array<{
    month: string;
    jobs: number;
    rating: number;
    revenue: number;
  }>;
  metricsComparisonData: Array<{
    metric: string;
    value: number;
    fullMark: number;
  }>;
  showPerformanceMetrics?: boolean;
}

interface ProfileTabProps {
  profile: ExtendedProviderProfile;
  contactInfo?: ContactDetails;
  hasContactInfo: boolean;
  hasBusinessInfo: boolean;
  hasWorkingHours: boolean;
  shouldShowEditControls: boolean;
  shouldShowRiskAssessment: boolean;
  onEdit?: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  profile,
  performanceData,
  metricsComparisonData,
  showPerformanceMetrics = true,
}) => {
  const metrics = profile.performanceMetrics;

  return (
    <div className="space-y-6">
      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Performance Trends
            </CardTitle>
            <CardDescription>
              Performance over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorJobs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="jobs"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorJobs)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-600" />
              Performance Radar
            </CardTitle>
            <CardDescription>
              Multi-dimensional performance analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={metricsComparisonData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="metric" stroke="#64748b" />
                <PolarRadiusAxis stroke="#64748b" />
                <Radar
                  name="Performance"
                  dataKey="value"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.5}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics Detail */}
      {showPerformanceMetrics && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>
              Detailed breakdown of performance indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Cancellation Rate
                  </span>
                  <XCircle className="h-4 w-4 text-red-500" />
                </div>
                <p className="text-2xl font-bold">
                  {((metrics?.cancellationRate ?? 0) * 100).toFixed(1)}%
                </p>
                <Progress
                  value={(metrics?.cancellationRate ?? 0) * 100}
                  className="h-1.5"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Dispute Rate
                  </span>
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                </div>
                <p className="text-2xl font-bold">
                  {((metrics?.disputeRate ?? 0) * 100).toFixed(1)}%
                </p>
                <Progress
                  value={(metrics?.disputeRate ?? 0) * 100}
                  className="h-1.5"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Client Retention
                  </span>
                  <Phone className="h-4 w-4 text-blue-500" />
                </div>
                <p className="text-2xl font-bold">
                  {((metrics?.clientRetentionRate ?? 0) * 100).toFixed(0)}%
                </p>
                <Progress
                  value={(metrics?.clientRetentionRate ?? 0) * 100}
                  className="h-1.5"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Response Time
                  </span>
                  <Clock className="h-4 w-4 text-purple-500" />
                </div>
                <p className="text-2xl font-bold">
                  {metrics?.responseTimeMinutes}m
                </p>
                <p className="text-xs text-slate-500">
                  Avg: {metrics?.averageResponseTime}m
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

interface AnalyticsTabProps {
  responseTimeData: Array<{ day: string; time: number }>;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  responseTimeData,
}) => {
  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Weekly Response Time Analysis</CardTitle>
          <CardDescription>
            Response efficiency throughout the week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={responseTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="time" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

const getRiskVariant = (
  riskLevel: RiskLevel
):
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "success"
  | "warning" => {
  const variants: Record<
    RiskLevel,
    "default" | "destructive" | "outline" | "secondary" | "success" | "warning"
  > = {
    [RiskLevel.LOW]: "success",
    [RiskLevel.MEDIUM]: "warning",
    [RiskLevel.HIGH]: "warning",
    [RiskLevel.CRITICAL]: "destructive",
  };
  return variants[riskLevel] ?? "default";
};

export const ProfileTab: React.FC<ProfileTabProps> = ({
  profile,
  contactInfo,
  hasContactInfo,
  hasBusinessInfo,
  hasWorkingHours,
  shouldShowEditControls,
  shouldShowRiskAssessment,
  onEdit,
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <Card className="lg:col-span-2 border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Profile Information</CardTitle>
              {shouldShowEditControls && onEdit && (
                <Button variant="ghost" size="sm" onClick={onEdit}>
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {hasContactInfo || hasBusinessInfo ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact Information */}
                {hasContactInfo && contactInfo && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                      Contact Details
                    </h3>
                    <div className="space-y-3">
                      {contactInfo.primaryContact && (
                        <div className="flex items-start gap-3">
                          <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center flex-shrink-0">
                            <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Primary Contact
                            </p>
                            <p className="text-sm font-medium">
                              {contactInfo.primaryContact}
                            </p>
                          </div>
                        </div>
                      )}

                      {contactInfo.secondaryContact && (
                        <div className="flex items-start gap-3">
                          <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center flex-shrink-0">
                            <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Secondary Contact
                            </p>
                            <p className="text-sm font-medium">
                              {contactInfo.secondaryContact}
                            </p>
                          </div>
                        </div>
                      )}

                      {contactInfo.businessEmail && (
                        <div className="flex items-start gap-3">
                          <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center flex-shrink-0">
                            <Mail className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Business Email
                            </p>
                            <p className="text-sm font-medium">
                              {contactInfo.businessEmail}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Business Information */}
                {hasBusinessInfo && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                      Business Details
                    </h3>
                    <div className="space-y-3">
                      {profile.businessName && (
                        <div className="flex items-start gap-3">
                          <div className="h-9 w-9 rounded-lg bg-purple-100 dark:bg-purple-950/30 flex items-center justify-center flex-shrink-0">
                            <Building className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Business Name
                            </p>
                            <p className="text-sm font-medium">
                              {profile.businessName}
                            </p>
                          </div>
                        </div>
                      )}

                      {profile.businessRegistration && (
                        <div className="flex items-start gap-3">
                          <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center flex-shrink-0">
                            <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Registration Number
                            </p>
                            <p className="text-sm font-medium">
                              {profile.businessRegistration.registrationNumber}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <p className="text-sm">No profile information available</p>
              </div>
            )}

            {hasWorkingHours && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-slate-500" />
                      <span className="text-sm font-medium">
                        Working Hours Schedule
                      </span>
                    </div>
                    {shouldShowEditControls && onEdit && (
                      <Button variant="outline" size="sm" onClick={onEdit}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>

                  {profile.workingHours && (
                    <div className="space-y-2">
                      {Object.entries(profile.workingHours).map(
                        ([day, hours]) => (
                          <div
                            key={day}
                            className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-20">
                                <span className="text-sm font-medium capitalize">
                                  {day}
                                </span>
                              </div>
                              {hours.isAvailable ? (
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                  <Clock className="h-4 w-4" />
                                  <span>
                                    {hours.start} - {hours.end}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-sm text-slate-500 dark:text-slate-500">
                                  Closed
                                </span>
                              )}
                            </div>
                            {hours.isAvailable ? (
                              <Badge variant="success" className="text-xs">
                                Open
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                Closed
                              </Badge>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {profile.isAlwaysAvailable && (
              <Alert className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
                <Activity className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-emerald-900 dark:text-emerald-300 ml-2">
                  Available 24/7
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Risk Assessment & Safety */}
        <div className="space-y-6">
          {shouldShowRiskAssessment && profile.riskLevel && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Risk Assessment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-950/30 dark:to-green-950/30">
                    <Shield className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <Badge
                    variant={getRiskVariant(profile.riskLevel)}
                    className="text-lg px-4 py-1 mb-2"
                  >
                    {profile.riskLevel}
                  </Badge>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Risk Level
                  </p>
                </div>

                {profile.lastRiskAssessmentDate && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">
                        Last Assessment
                      </span>
                      <span className="font-medium">
                        {new Date(
                          profile.lastRiskAssessmentDate
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </>
                )}

                {(profile?.penaltiesCount ?? 0) > 0 && (
                  <Alert variant="destructive">
                    <Ban className="h-4 w-4" />
                    <AlertDescription className="ml-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Penalties</span>
                        <span className="text-lg font-bold">
                          {profile.penaltiesCount ?? 0}
                        </span>
                      </div>
                      {profile?.lastPenaltyDate && (
                        <p className="text-xs mt-1">
                          Last:{" "}
                          {new Date(
                            profile.lastPenaltyDate
                          ).toLocaleDateString()}
                        </p>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Safety Measures */}
          {profile.safetyMeasures && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Safety Measures
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                  <span className="text-sm font-medium">Requires Deposit</span>
                  {profile.safetyMeasures.requiresDeposit ? (
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-slate-400" />
                  )}
                </div>

                {profile.safetyMeasures.requiresDeposit &&
                  profile.safetyMeasures.depositAmount && (
                    <div className="pl-4 text-sm text-slate-600 dark:text-slate-400">
                      Amount:{" "}
                      <span className="font-semibold">
                        GHS {profile.safetyMeasures.depositAmount}
                      </span>
                    </div>
                  )}

                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                  <span className="text-sm font-medium">Has Insurance</span>
                  {profile.safetyMeasures.hasInsurance ? (
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-slate-400" />
                  )}
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                  <span className="text-sm font-medium">
                    Emergency Contact Verified
                  </span>
                  {profile.safetyMeasures.emergencyContactVerified ? (
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-slate-400" />
                  )}
                </div>

                {profile.insurance && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center flex-shrink-0">
                          <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Insurance Provider
                          </p>
                          <p className="text-sm font-medium">
                            {profile.insurance.provider}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Policy: {profile.insurance.policyNumber}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Expires:{" "}
                            {new Date(
                              profile.insurance.expiryDate
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

interface ServicesTabProps {
  services: Service[];
  shouldShowEditControls: boolean;
  onEdit?: () => void;
}

export const ServicesTab: React.FC<ServicesTabProps> = ({
  services,
  shouldShowEditControls,
  onEdit,
}) => {
  const router = useRouter();
  console.log(services[0].slug);
  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-indigo-600" />
                Services Overview
              </CardTitle>
              <CardDescription>
                Active services offered by this provider
              </CardDescription>
            </div>
            {shouldShowEditControls && onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Manage Services
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {services.length > 0 ? (
            <div className="grid gap-4">
              {services.map((service: Service) => (
                <div
                  key={service._id.toString()}
                  className="group relative p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900/50 dark:to-slate-900/30 shadow-lg hover:border-indigo-200 dark:hover:border-indigo-900 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-950/50 dark:to-indigo-950/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform overflow-hidden">
                      {service.images && service.images.length > 0 ? (
                        <div className="relative w-full h-full">
                          <Image
                            src={service.images[0]?.url ?? "/placeholder.png"}
                            alt={service.title}
                            className="rounded-xl object-cover"
                            fill
                          />
                        </div>
                      ) : (
                        <Briefcase className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4
                          className="hover:text-blue-500 hover:underline cursor-pointer duration-200 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100"
                          onClick={() =>
                            router.push(`/services/${service.slug}`)
                          }
                        >
                          {service.title}
                          <ExternalLink size={14} />
                        </h4>
                        <Badge
                          variant={
                            service.status === ServiceStatus.APPROVED
                              ? "success"
                              : "outline"
                          }
                          className="text-xs flex-shrink-0"
                        >
                          {service.status}
                        </Badge>
                      </div>
                      {service.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                          {service.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 flex-wrap">
                        {service.category && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400">
                            <span className="font-medium">Category:</span>
                            <span>{service.category.name}</span>
                          </div>
                        )}
                        {service.basePrice && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-100 dark:bg-emerald-950/30 text-xs text-emerald-700 dark:text-emerald-400">
                            <span className="font-medium">Price:</span>
                            <span className="font-semibold">
                              GHS {service.basePrice}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                <Briefcase className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                No Services Available
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                This provider hasn&apos;t added any services yet.
              </p>
              {shouldShowEditControls && onEdit && (
                <Button onClick={onEdit}>
                  <Briefcase className="h-4 w-4 mr-2" />
                  Add Your First Service
                </Button>
              )}
            </div>
          )}

          {shouldShowEditControls && services.length > 0 && onEdit && (
            <div className="mt-6">
              <Button variant="outline" className="w-full" onClick={onEdit}>
                <Briefcase className="h-4 w-4 mr-2" />
                Add New Service
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
