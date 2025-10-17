// components/client/ClientProfileCard.tsx
import { ClientProfile, RiskLevel } from "@/types";
import {
  getLoyaltyTierColor,
  getClientStatusBadge,
} from "@/lib/api/clientProfiles/clientProfile.api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Calendar,
  Shield,
  Star,
  Clock,
  AlertTriangle,
  Briefcase,
  Package,
  MessageCircle,
} from "lucide-react";

interface ClientProfileCardProps {
  profile: Partial<ClientProfile>;
  isPublicView?: boolean;
}

export const ClientProfileCard = ({
  profile,
  isPublicView = false,
}: ClientProfileCardProps) => {
  const statusBadge = getClientStatusBadge(profile as ClientProfile);
  const loyaltyColor = getLoyaltyTierColor(profile.loyaltyTier || "bronze");

  return (
    <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
      <CardHeader className="pb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 dark:from-blue-700 dark:via-blue-600 dark:to-indigo-700 flex items-center justify-center shadow-lg">
                <User className="h-8 w-8 text-white" />
              </div>
              <div
                className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-white dark:border-gray-800 shadow-sm"
                style={{ backgroundColor: loyaltyColor }}
              />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Client Profile
              </CardTitle>
              <div className="flex items-center gap-2 mt-1.5">
                <Calendar className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Member since{" "}
                  {new Date(profile.memberSince || "").toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      year: "numeric",
                    }
                  )}
                </p>
              </div>
            </div>
          </div>
          <Badge
            variant={statusBadge.color === "green" ? "default" : "secondary"}
            className="text-xs px-3 py-1 font-medium bg-green-600 dark:bg-green-700 text-white dark:text-gray-100">
            {statusBadge.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Loyalty Tier */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-900/50 dark:to-gray-800/50 border border-gray-100 dark:border-gray-700">
            <div className="p-2.5 rounded-lg bg-white dark:bg-gray-700 shadow-sm">
              <Star className="h-5 w-5" style={{ color: loyaltyColor }} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Loyalty Tier
              </p>
              <p
                className="text-base font-bold capitalize"
                style={{ color: loyaltyColor }}>
                {profile.loyaltyTier || "Bronze"}
              </p>
            </div>
          </div>

          {/* Rating */}
          {profile.averageRating !== undefined && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50/50 dark:from-amber-900/50 dark:to-yellow-900/50 border border-amber-100 dark:border-amber-800">
              <div className="p-2.5 rounded-lg bg-white dark:bg-gray-700 shadow-sm">
                <Star className="h-5 w-5 text-amber-500 dark:text-amber-400 fill-amber-500 dark:fill-amber-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Rating
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-base font-bold text-gray-900 dark:text-gray-100">
                    {profile.averageRating.toFixed(1)}
                  </p>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    ({profile.totalReviews || 0} reviews)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Last Active */}
        {profile.lastActiveDate && !isPublicView && (
          <div className="flex items-center gap-2 mt-4 px-4 py-3 rounded-xl bg-green-50/50 dark:bg-green-900/50 border border-green-100 dark:border-green-800">
            <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm text-gray-700 dark:text-gray-200">
              Last active:{" "}
              <span className="font-medium">
                {new Date(profile.lastActiveDate).toLocaleDateString()}
              </span>
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// components/client/ClientReliabilityScore.tsx
import { ReliabilityMetrics } from "@/types";
import { Progress } from "@/components/ui/progress";

interface ClientReliabilityScoreProps {
  metrics: ReliabilityMetrics;
  verification?: VerificationStatus;
}

export const ClientReliabilityScore = ({
  metrics,
  verification,
}: ClientReliabilityScoreProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 60) return "text-amber-600 dark:text-amber-400";
    if (score >= 40) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80)
      return "from-emerald-50 to-green-50 dark:from-emerald-900/50 dark:to-green-900/50";
    if (score >= 60)
      return "from-amber-50 to-yellow-50 dark:from-amber-900/50 dark:to-yellow-900/50";
    if (score >= 40)
      return "from-orange-50 to-red-50 dark:from-orange-900/50 dark:to-red-900/50";
    return "from-red-50 to-pink-50 dark:from-red-900/50 dark:to-pink-900/50";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Poor";
  };

  const score = metrics.reliabilityScore;
  const scoreColor = getScoreColor(score);
  const scoreBg = getScoreBgColor(score);
  const scoreLabel = getScoreLabel(score);

  return (
    <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm overflow-hidden">
      <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/50 dark:to-indigo-900/50">
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <div className="p-2 rounded-lg bg-white dark:bg-gray-700 shadow-sm">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          Reliability Score
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Main Score */}
        <div
          className={`text-center space-y-3 p-6 rounded-2xl bg-gradient-to-br ${scoreBg}`}>
          <div className={`text-7xl font-black ${scoreColor} tracking-tight`}>
            {score.toFixed(0)}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              {scoreLabel}
            </p>
            <Progress
              value={score}
              className="h-2 mt-3 bg-gray-200 dark:bg-gray-700"
            />
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
            Performance Metrics
          </h4>

          <div className="space-y-2">
            {verification?.verificationLevel && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-white dark:bg-gray-700">
                    <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Verification Level
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100 capitalize">
                  {verification.verificationLevel}
                </span>
              </div>
            )}

            {metrics.reputation.averageRating !== undefined && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-white dark:bg-gray-700">
                    <Star className="h-4 w-4 text-amber-500 dark:text-amber-400 fill-amber-500 dark:fill-amber-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Average Rating
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {metrics.reputation.averageRating.toFixed(1)} / 5.0
                </span>
              </div>
            )}

            {metrics.engagement.responseTime !== undefined && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-white dark:bg-gray-700">
                    <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Response Time
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {metrics.engagement.responseTime}h
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        {verification && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/50 dark:to-green-900/50 rounded-xl border border-emerald-100 dark:border-emerald-800">
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {verification.totalReviews}
              </p>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mt-1">
                Total Reviews
              </p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/50 dark:to-yellow-900/50 rounded-xl border border-amber-100 dark:border-amber-800">
              <p className="text-3xl font-black text-amber-600 dark:text-amber-400">
                {verification.averageRating !== undefined
                  ? verification.averageRating.toFixed(1)
                  : "N/A"}
              </p>
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide mt-1">
                Rating
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// components/client/ClientActivityTimeline.tsx
interface ClientActivityTimelineProps {
  profile: Partial<ClientProfile>;
}

export const ClientActivityTimeline = ({
  profile,
}: ClientActivityTimelineProps) => {
  const activities = [
    {
      icon: Calendar,
      label: "Member Since",
      value: new Date(profile.memberSince || "").toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      color: "text-blue-600 dark:text-blue-400",
      bgColor:
        "from-blue-50 to-indigo-50 dark:from-blue-900/50 dark:to-indigo-900/50",
      iconBg: "bg-blue-100 dark:bg-blue-900/50",
    },
    ...(profile.lastActiveDate
      ? [
          {
            icon: Clock,
            label: "Last Active",
            value: new Date(profile.lastActiveDate).toLocaleDateString(
              "en-US",
              {
                month: "long",
                day: "numeric",
                year: "numeric",
              }
            ),
            color: "text-emerald-600 dark:text-emerald-400",
            bgColor:
              "from-emerald-50 to-green-50 dark:from-emerald-900/50 dark:to-green-900/50",
            iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
          },
        ]
      : []),
  ];

  return (
    <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="text-gray-900 dark:text-gray-100">
          Activity Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <div
              key={index}
              className={`flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r ${activity.bgColor} border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow`}>
              <div className={`p-3 rounded-xl ${activity.iconBg} shadow-sm`}>
                <activity.icon className={`h-5 w-5 ${activity.color}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {activity.label}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                  {activity.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// components/client/ClientRiskIndicator.tsx
import { getClientRiskColor } from "@/lib/api/clientProfiles/clientProfile.api";

interface ClientRiskIndicatorProps {
  profile: Partial<ClientProfile>;
  showDetails?: boolean;
}

export const ClientRiskIndicator = ({
  profile,
  showDetails = true,
}: ClientRiskIndicatorProps) => {
  const riskLevel = (profile.riskLevel ?? RiskLevel.LOW) as RiskLevel;
  const riskColor = getClientRiskColor(riskLevel);

  const getRiskIcon = () => {
    if (riskLevel === RiskLevel.HIGH || riskLevel === RiskLevel.CRITICAL) {
      return (
        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
      );
    }
    return (
      <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
    );
  };

  const getRiskBg = () => {
    if (riskLevel === RiskLevel.HIGH || riskLevel === RiskLevel.CRITICAL) {
      return "from-red-50 to-orange-50 dark:from-red-900/50 dark:to-orange-900/50";
    }
    return "from-emerald-50 to-green-50 dark:from-emerald-900/50 dark:to-green-900/50";
  };

  const getRiskDescription = () => {
    switch (riskLevel) {
      case RiskLevel.LOW:
        return "This client has a good track record with minimal issues.";
      case RiskLevel.MEDIUM:
        return "This client has some concerns that should be monitored.";
      case RiskLevel.HIGH:
        return "Exercise caution when working with this client.";
      case RiskLevel.CRITICAL:
        return "High-risk client. Proceed with extreme caution.";
      default:
        return "Risk level not assessed.";
    }
  };

  if (!showDetails) {
    return (
      <Badge
        variant="outline"
        style={{ borderColor: riskColor, color: riskColor }}
        className="capitalize font-semibold text-gray-900 dark:text-gray-100">
        {profile.riskLevel || "Low"} Risk
      </Badge>
    );
  }

  return (
    <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <div className="p-2 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 shadow-sm">
            {getRiskIcon()}
          </div>
          Risk Assessment
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div
          className={`p-5 rounded-xl bg-gradient-to-br ${getRiskBg()} border border-gray-100 dark:border-gray-700`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
              Risk Level
            </span>
            <Badge
              variant="outline"
              style={{
                borderColor: riskColor,
                color: riskColor,
                backgroundColor: "white",
              }}
              className="capitalize text-base font-bold px-3 py-1 bg-white dark:bg-gray-700">
              {profile.riskLevel || "Low"}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            {getRiskDescription()}
          </p>
        </div>

        {profile.warningsCount !== undefined && profile.warningsCount > 0 && (
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/50 dark:to-red-900/50 rounded-xl border border-orange-200 dark:border-orange-800">
            <div className="p-2 rounded-lg bg-white dark:bg-gray-700 shadow-sm">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-orange-900 dark:text-orange-200">
                {profile.warningsCount} Active Warning
                {profile.warningsCount > 1 ? "s" : ""}
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-400">
                Requires attention
              </p>
            </div>
          </div>
        )}

        {profile.trustScore !== undefined && (
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                Trust Score
              </span>
              <span
                className="text-3xl font-black"
                style={{ color: riskColor }}>
                {profile.trustScore}
                <span className="text-lg text-gray-400 dark:text-gray-500">
                  /100
                </span>
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// components/client/ClientPreferences.tsx
import { MessageSquare, Phone, Mail } from "lucide-react";
import {
  isPreferredService,
  PreferredService,
  VerificationStatus,
} from "@/types/client-profile.types";

interface ClientPreferencesProps {
  profile: Partial<ClientProfile>;
}

export const ClientPreferences = ({ profile }: ClientPreferencesProps) => {
  const getContactIcon = (method?: string) => {
    switch (method?.toLowerCase()) {
      case "phone":
        return (
          <Phone className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        );
      case "email":
        return <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      case "sms":
        return (
          <MessageCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
        );
      case "whatsapp":
        return (
          <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
        );
      default:
        return (
          <Phone className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        );
    }
  };

  const getContactBg = (method?: string) => {
    switch (method?.toLowerCase()) {
      case "phone":
        return "from-purple-50 to-pink-50 dark:from-purple-900/50 dark:to-pink-900/50";
      case "email":
        return "from-blue-50 to-cyan-50 dark:from-blue-900/50 dark:to-cyan-900/50";
      case "sms":
        return "from-green-50 to-emerald-50 dark:from-green-900/50 dark:to-emerald-900/50";
      case "whatsapp":
        return "from-green-50 to-teal-50 dark:from-green-900/50 dark:to-teal-900/50";
      default:
        return "from-indigo-50 to-purple-50 dark:from-indigo-900/50 dark:to-purple-900/50";
    }
  };

  return (
    <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="text-gray-900 dark:text-gray-100">
          Communication Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {profile.preferredContactMethod && (
          <div
            className={`p-5 rounded-xl bg-gradient-to-br ${getContactBg(
              profile.preferredContactMethod
            )} border border-gray-100 dark:border-gray-700`}>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Preferred Contact Method
            </p>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-white dark:bg-gray-700 shadow-sm">
                {getContactIcon(profile.preferredContactMethod)}
              </div>
              <span className="text-base font-bold text-gray-900 dark:text-gray-100 capitalize">
                {profile.preferredContactMethod === "all"
                  ? "Any Preferred Method"
                  : profile.preferredContactMethod}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface ClientServicesCardProps {
  profile: Partial<ClientProfile>;
}

export const ClientServicesCard = ({ profile }: ClientServicesCardProps) => {
  // Filter to only show populated services
  const services = (profile.preferredServices || []).filter(
    isPreferredService
  ) as PreferredService[];

  if (services.length === 0) {
    return (
      <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <div className="p-2 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 shadow-sm">
              <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            Preferred Services
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No preferred services selected yet
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/50 dark:to-indigo-900/50 shadow-sm">
            <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          Preferred Services
          <Badge variant="secondary" className="ml-auto">
            {services.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {services.map((service) => (
            <div
              key={service._id}
              className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-900/50 dark:to-gray-800/50 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white dark:bg-gray-700 shadow-sm mt-0.5">
                  <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">
                    {service.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {service.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-2 mt-2">
                      <Link
                        href={`/services/${service.slug}`}
                        className="group">
                        <Badge
                          variant="outline"
                          className="text-xs px-3 py-1.5 cursor-pointer transition-all duration-200 border-primary/30 hover:shadow-md group-hover:scale-105">
                          Explore →
                        </Badge>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// components/client/ClientProvidersCard.tsx
import { Building2, Store } from "lucide-react";
import {
  isPreferredProvider,
  PreferredProvider,
} from "@/types/client-profile.types";
import Link from "next/link";

interface ClientProvidersCardProps {
  profile: Partial<ClientProfile>;
}

export const ClientProvidersCard = ({ profile }: ClientProvidersCardProps) => {
  // Filter to only show populated providers
  const providers = (profile.preferredProviders || []).filter(
    isPreferredProvider
  ) as PreferredProvider[];

  if (providers.length === 0) {
    return (
      <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <div className="p-2 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 shadow-sm">
              <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            Preferred Providers
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Store className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No preferred providers selected yet
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/50 dark:to-pink-900/50 shadow-sm">
            <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          Preferred Providers
          <Badge variant="secondary" className="ml-auto">
            {providers.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {providers.map((provider) => (
            <div
              key={provider._id}
              className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50/50 dark:from-purple-900/50 dark:to-pink-900/50 border border-purple-100 dark:border-purple-800 hover:shadow-md transition-all">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white dark:bg-gray-700 shadow-sm mt-0.5">
                  <Store className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">
                    {provider.businessName}
                  </h4>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-2 mt-2">
                      <Link
                        href={`/providers/${provider._id}`}
                        className="group">
                        <Badge
                          variant="outline"
                          className="text-xs px-3 py-1.5 cursor-pointer transition-all duration-200 border-primary/30 hover:shadow-md group-hover:scale-105">
                          Explore →
                        </Badge>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
