"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  User,
  Settings,
  MapPin,
  Phone,
  Mail,
  Shield,
  Clock,
  ExternalLink,
  AlertCircle,
  Home,
  Calendar,
  UserCircle,
  Edit3,
  X,
  ChevronRight,
  ChevronDown,
  Building,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { UserRole } from "@/types/base.types";
import type { ProfilePicture } from "@/types/base.types";
import { useProfile } from "@/hooks/profiles/useProfile";
import { useAuth } from "@/hooks/auth/useAuth";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import Loading from "@/components/ui/loading";

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.23, 1, 0.32, 1],
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] },
  },
  hover: {
    y: -2,
    scale: 1.01,
    transition: { duration: 0.2, ease: "easeOut" },
  },
};

// Collapsible header variants
const headerContentVariants: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0.0, 0.2, 1],
    },
  },
  expanded: {
    height: "auto",
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: [0.4, 0.0, 0.2, 1],
    },
  },
};

// Utility function to get image URL
const getImageUrl = (
  avatar: string | ProfilePicture | undefined
): string | undefined => {
  if (!avatar) return undefined;
  if (typeof avatar === "string") return avatar;
  return avatar.url;
};

interface CardProps {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
}

const Card: React.FC<CardProps & React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = "",
  gradient = false,
  ...props
}) => (
  <div
    className={`
      bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 
      shadow-sm hover:shadow-lg dark:shadow-gray-900/20 dark:hover:shadow-gray-900/40
      transition-all duration-300 ease-out backdrop-blur-sm
      ${
        gradient
          ? "bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-800 dark:via-gray-850 dark:to-gray-800"
          : ""
      }
      ${className}
    `}
    {...props}
  >
    {children}
  </div>
);

const CardHeader: React.FC<CardProps> = ({ children, className = "" }) => (
  <div className={`p-6 pb-3 ${className}`}>{children}</div>
);

const CardContent: React.FC<CardProps> = ({ children, className = "" }) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
);

const CardTitle: React.FC<CardProps> = ({ children, className = "" }) => (
  <h3
    className={`text-lg font-bold text-gray-900 dark:text-gray-100 ${className}`}
  >
    {children}
  </h3>
);

const Avatar: React.FC<CardProps> = ({ children, className = "" }) => (
  <div
    className={`relative inline-flex items-center justify-center ${className}`}
  >
    {children}
  </div>
);

const AvatarFallback: React.FC<CardProps> = ({ children, className = "" }) => (
  <div
    className={`
      flex h-full w-full items-center justify-center rounded-full 
      bg-gradient-to-br from-blue-500 via-purple-500 to-teal-500 
      dark:from-blue-400 dark:via-purple-400 dark:to-teal-400 
      text-white font-bold shadow-inner
      ${className}
    `}
  >
    {children}
  </div>
);

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "secondary" | "success" | "warning" | "danger";
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  className = "",
}) => {
  const variants = {
    default:
      "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50",
    secondary:
      "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600/50",
    success:
      "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50",
    warning:
      "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50",
    danger:
      "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700/50",
  };

  return (
    <span
      className={`
        inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold 
        transition-all duration-200 hover:scale-105
        ${variants[variant]} ${className}
      `}
    >
      {children}
    </span>
  );
};

interface ProgressProps {
  value: number;
  className?: string;
}

const Progress: React.FC<ProgressProps> = ({ value, className = "" }) => (
  <div
    className={`w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 ${className}`}
  >
    <div
      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500 ease-out"
      style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
    />
  </div>
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) => {
  const variants = {
    primary:
      "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg",
    secondary:
      "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100",
    outline:
      "border-2 border-gray-200 dark:border-gray-600 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={`
        inline-flex items-center justify-center rounded-xl font-semibold 
        transition-all duration-200 hover:scale-105 active:scale-95
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

// Breadcrumb components
const Breadcrumb: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <nav className="flex items-center space-x-1 text-sm mb-6">{children}</nav>
);

interface BreadcrumbItemProps {
  href?: string;
  children: React.ReactNode;
  isLast?: boolean;
}

const BreadcrumbItem: React.FC<BreadcrumbItemProps> = ({
  href,
  children,
  isLast = false,
}) => (
  <div className="flex items-center space-x-1">
    {href ? (
      <Link
        href={href}
        className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
      >
        {children}
      </Link>
    ) : (
      <span className="text-gray-900 dark:text-gray-100 font-medium">
        {children}
      </span>
    )}
    {!isLast && (
      <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
    )}
  </div>
);

// Info item component
interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | React.ReactNode;
  className?: string;
}

const InfoItem: React.FC<InfoItemProps> = ({
  icon,
  label,
  value,
  className = "",
}) => (
  <motion.div
    variants={itemVariants}
    className={`flex items-start gap-4 py-3 border-b border-gray-100 dark:border-gray-700/50 last:border-b-0 ${className}`}
  >
    <div className="flex-shrink-0 mt-0.5 text-gray-400 dark:text-gray-500 w-5 h-5">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
        {label}
      </p>
      <div className="text-base text-gray-900 dark:text-gray-100 break-words">
        {value}
      </div>
    </div>
  </motion.div>
);

// Status badge component
interface StatusBadgeProps {
  role: string;
  type?: "role" | "verification" | "status";
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ role, type = "role" }) => {
  const getVariant = (
    role: string,
    type: string
  ): "default" | "secondary" | "success" | "warning" | "danger" => {
    const roleLower = role.toLowerCase();

    if (type === "verification") {
      if (roleLower.includes("verified")) return "success";
      if (roleLower.includes("pending")) return "warning";
      if (roleLower.includes("rejected")) return "danger";
    }

    if (roleLower.includes("admin")) return "secondary";
    if (roleLower.includes("provider")) return "default";
    return "default";
  };

  const getIcon = () => {
    if (type === "verification")
      return <CheckCircle className="w-3 h-3 mr-1" />;
    if (type === "role") return <Shield className="w-3 h-3 mr-1" />;
    return null;
  };

  return (
    <Badge variant={getVariant(role, type)}>
      {getIcon()}
      {role}
    </Badge>
  );
};

// Utility functions
const getInitials = (name: string): string => {
  if (!name || typeof name !== "string") return "NA";
  const parts = name.trim().split(/\s+/);
  return (
    parts
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2) || "NA"
  );
};

const formatDate = (date: string | Date | undefined): string => {
  if (!date) return "N/A";
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return "Invalid Date";
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "Invalid Date";
  }
};

const getRoleDisplay = (role: string | undefined): string => {
  if (!role) return "N/A";
  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const MainProfile: React.FC = () => {
  const {
    profile,
    completeness,
    isLoading,
    error,
    isInitialized,
    refreshProfile,
    clearError,
    hasRole,
  } = useProfile();
  const { user } = useAuth();

  const [showImageUpload, setShowImageUpload] = useState(false);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false); // Collapsed by default

  const displayName: string =
    user?.name ?? profile?.verificationStatus ?? "User Profile";
  const avatarUrl = getImageUrl(profile?.profilePicture);
  const userEmail = user?.email;

  if (!isInitialized && isLoading) {
    return <LoadingOverlay show={true} message="loading please wait..." />;
  }

  if (isInitialized && !profile) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
      >
        <User className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Profile Not Found
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6 text-center max-w-md">
          We couldn&apos;t load your profile data. Please try refreshing or
          contact support if the issue persists.
        </p>
        <Button onClick={refreshProfile} variant="primary">
          Try Again
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="max-h-screen overflow-auto hide-scrollbar bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/20">
      <>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4 p-4 rounded-xl"
        >
          {/* Breadcrumb */}
          <motion.div variants={itemVariants}>
            <Breadcrumb>
              <BreadcrumbItem href="/">
                <Home className="w-4 h-4 mr-1" />
                Home
              </BreadcrumbItem>
              <BreadcrumbItem isLast>Profile</BreadcrumbItem>
            </Breadcrumb>
          </motion.div>

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                className="mb-6"
              >
                <Card className="border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/30">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-red-700 dark:text-red-300">
                        <AlertCircle className="w-5 h-5" />
                        <p className="font-medium">{error}</p>
                      </div>
                      <button
                        onClick={clearError}
                        className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200 rounded-lg hover:bg-red-100 dark:hover:bg-red-800/50 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapsible Profile Header */}
          <motion.div variants={cardVariants}>
            <Card
              gradient
              className="overflow-hidden border-0 shadow-xl"
              onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
            >
              <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 p-1">
                <div className="bg-white dark:bg-gray-800 rounded-xl">
                  {/* Always visible header section */}
                  <CardContent className="p-6 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{
                            delay: 0.3,
                            type: "spring",
                            stiffness: 200,
                          }}
                          className="relative"
                        >
                          <Avatar className="w-16 h-16 ring-4 ring-white dark:ring-gray-700 shadow-xl rounded-full">
                            {avatarUrl ? (
                              <Image
                                src={avatarUrl}
                                alt="Profile picture"
                                width={64}
                                height={64}
                                className="w-full h-full object-cover rounded-full"
                              />
                            ) : (
                              <AvatarFallback className="text-lg">
                                {getInitials(displayName)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setShowImageUpload(true)}
                            className="absolute -bottom-1 -right-1 w-7 h-7 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200"
                          >
                            <Edit3 className="w-3 h-3" />
                          </motion.button>
                        </motion.div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 capitalize">
                              {displayName}
                            </h1>
                            {isLoading && <Loading />}
                          </div>

                          {userEmail && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <Mail className="w-4 h-4" />
                              <span className="font-medium text-sm">
                                {userEmail}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Toggle Button */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        aria-label={
                          isHeaderExpanded ? "Collapse header" : "Expand header"
                        }
                      >
                        <motion.div
                          animate={{ rotate: isHeaderExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-5 h-5" />
                        </motion.div>
                      </motion.button>
                    </div>
                  </CardContent>

                  {/* Collapsible Content */}
                  <AnimatePresence>
                    {isHeaderExpanded && (
                      <motion.div
                        initial="collapsed"
                        animate="expanded"
                        exit="collapsed"
                        variants={headerContentVariants}
                        className="overflow-hidden"
                      >
                        <CardContent className="pt-0 pb-6">
                          {/* Badges */}
                          <div className="flex items-center gap-2 flex-wrap mb-4">
                            {profile?.role && (
                              <StatusBadge
                                role={getRoleDisplay(profile.role)}
                                type="role"
                              />
                            )}
                            {profile?.verificationStatus && (
                              <StatusBadge
                                role={getRoleDisplay(
                                  profile.verificationStatus
                                )}
                                type="verification"
                              />
                            )}
                          </div>

                          {/* Profile Completeness */}
                          {completeness !== undefined && completeness < 100 && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 }}
                              className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-100 dark:border-blue-700/30"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                                    Profile Completeness
                                  </span>
                                </div>
                                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                  {completeness}%
                                </span>
                              </div>
                              <Progress value={completeness} />
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                Complete your profile to unlock all features
                              </p>
                            </motion.div>
                          )}
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Account Information */}
            <motion.div variants={cardVariants} whileHover="hover">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <UserCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    Account Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-1"
                  >
                    {profile?.verificationStatus && (
                      <InfoItem
                        icon={<Shield className="w-4 h-4" />}
                        label="Verification Status"
                        value={getRoleDisplay(profile.verificationStatus)}
                      />
                    )}
                    {profile?.moderationStatus && (
                      <InfoItem
                        icon={<Settings className="w-4 h-4" />}
                        label="Moderation Status"
                        value={getRoleDisplay(profile.moderationStatus)}
                      />
                    )}
                    <InfoItem
                      icon={<Calendar className="w-4 h-4" />}
                      label="Profile Created"
                      value={formatDate(profile?.createdAt)}
                    />
                    <InfoItem
                      icon={<Clock className="w-4 h-4" />}
                      label="Last Updated"
                      value={formatDate(profile?.updatedAt)}
                    />
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Profile Details */}
            <motion.div variants={cardVariants} whileHover="hover">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    Profile Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {profile ? (
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="space-y-1"
                    >
                      {profile.role && (
                        <InfoItem
                          icon={<User className="w-4 h-4" />}
                          label="Profile Role"
                          value={getRoleDisplay(profile.role)}
                        />
                      )}
                      {profile.bio && (
                        <InfoItem
                          icon={<Settings className="w-4 h-4" />}
                          label="Bio"
                          value={profile.bio}
                        />
                      )}
                      {profile.isActiveInMarketplace !== undefined && (
                        <InfoItem
                          icon={<Building className="w-4 h-4" />}
                          label="Marketplace Status"
                          value={
                            <Badge
                              variant={
                                profile.isActiveInMarketplace
                                  ? "success"
                                  : "secondary"
                              }
                            >
                              {profile.isActiveInMarketplace
                                ? "Active"
                                : "Inactive"}
                            </Badge>
                          }
                        />
                      )}
                      <InfoItem
                        icon={<Calendar className="w-4 h-4" />}
                        label="Last Updated"
                        value={formatDate(profile.updatedAt)}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8"
                    >
                      <User className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        No profile details
                      </h4>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        Complete your profile to get started.
                      </p>
                      <Button variant="primary">Complete Profile</Button>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Contact Details */}
            {profile?.contactDetails && (
              <motion.div
                variants={cardVariants}
                whileHover="hover"
                className="xl:col-span-1 lg:col-span-2 xl:col-start-3 xl:row-start-1"
              >
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                        <Phone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="space-y-1"
                    >
                      <InfoItem
                        icon={<Phone className="w-4 h-4" />}
                        label={
                          hasRole(UserRole.PROVIDER)
                            ? "Business Contact"
                            : "Primary Contact"
                        }
                        value={profile.contactDetails.primaryContact}
                      />
                      {profile.contactDetails.secondaryContact && (
                        <InfoItem
                          icon={<Phone className="w-4 h-4" />}
                          label="Secondary Contact"
                          value={profile.contactDetails.secondaryContact}
                        />
                      )}
                      {profile.contactDetails.businessEmail && (
                        <InfoItem
                          icon={<Mail className="w-4 h-4" />}
                          label="Business Email"
                          value={profile.contactDetails.businessEmail}
                        />
                      )}
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Location Information - Full Width */}
          {profile?.location && (
            <motion.div variants={cardVariants} whileHover="hover">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <MapPin className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    Location Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    <InfoItem
                      icon={<MapPin className="w-4 h-4" />}
                      label="Ghana Post GPS"
                      value={profile.location.ghanaPostGPS}
                    />
                    {profile.location.region && (
                      <InfoItem
                        icon={<MapPin className="w-4 h-4" />}
                        label="Region"
                        value={profile.location.region}
                      />
                    )}
                    {profile.location.city && (
                      <InfoItem
                        icon={<MapPin className="w-4 h-4" />}
                        label="City"
                        value={profile.location.city}
                      />
                    )}
                    {profile.location.district && (
                      <InfoItem
                        icon={<MapPin className="w-4 h-4" />}
                        label="District"
                        value={profile.location.district}
                      />
                    )}
                    {profile.location.nearbyLandmark && (
                      <InfoItem
                        icon={<MapPin className="w-4 h-4" />}
                        label="Nearby Landmark"
                        value={profile.location.nearbyLandmark}
                      />
                    )}
                    {profile.location.gpsCoordinates && (
                      <InfoItem
                        icon={<MapPin className="w-4 h-4" />}
                        label="GPS Coordinates"
                        value={`${profile.location.gpsCoordinates.latitude}, ${profile.location.gpsCoordinates.longitude}`}
                      />
                    )}
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Social Media - Full Width */}
          {profile?.socialMediaHandles &&
            profile.socialMediaHandles.length > 0 && (
              <motion.div variants={cardVariants} whileHover="hover">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <ExternalLink className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      Social Media Profiles
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                      {profile.socialMediaHandles.map((social, index) => (
                        <InfoItem
                          key={`${social.nameOfSocial}-${social.userName}-${index}`}
                          icon={<ExternalLink className="w-4 h-4" />}
                          label={social.nameOfSocial}
                          value={
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                @{social.userName}
                              </span>
                              <ExternalLink className="w-3 h-3 text-gray-400" />
                            </div>
                          }
                        />
                      ))}
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

          {/* Two Column Layout for ID and Warnings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ID Verification Details */}
            {profile?.idDetails && (
              <motion.div variants={cardVariants} whileHover="hover">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      ID Verification
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="space-y-1"
                    >
                      <InfoItem
                        icon={<Shield className="w-4 h-4" />}
                        label="ID Type"
                        value={
                          <Badge variant="secondary">
                            {getRoleDisplay(profile.idDetails.idType)}
                          </Badge>
                        }
                      />
                      <InfoItem
                        icon={<User className="w-4 h-4" />}
                        label="ID Number"
                        value={
                          <span className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {profile.idDetails.idNumber}
                          </span>
                        }
                      />
                      {profile.idDetails.idFile && (
                        <InfoItem
                          icon={<ExternalLink className="w-4 h-4" />}
                          label="Document"
                          value={
                            <div className="flex items-center gap-2">
                              <span className="text-blue-600 dark:text-blue-400 font-medium">
                                {profile.idDetails.idFile.fileName}
                              </span>
                              <ExternalLink className="w-3 h-3 text-gray-400" />
                            </div>
                          }
                        />
                      )}
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Warnings Section */}
            {profile?.warnings && profile.warnings.length > 0 && (
              <motion.div variants={cardVariants} whileHover="hover">
                <Card className="h-full border-amber-200 dark:border-amber-700/50 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-amber-800 dark:text-amber-200">
                      <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      Profile Warnings ({profile.warnings.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="space-y-4"
                    >
                      {profile.warnings.map((warning, index) => (
                        <motion.div
                          key={`warning-${index}`}
                          variants={itemVariants}
                          className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-amber-200 dark:border-amber-700/30 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Badge
                                  variant={
                                    warning.severity === "high"
                                      ? "danger"
                                      : warning.severity === "medium"
                                      ? "warning"
                                      : "secondary"
                                  }
                                >
                                  {warning.severity === "high" && (
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                  )}
                                  {warning.severity.charAt(0).toUpperCase() +
                                    warning.severity.slice(1)}{" "}
                                  Severity
                                </Badge>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 mb-2">
                                {warning.reason}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <Clock className="w-3 h-3" />
                                <span>
                                  Issued on {formatDate(warning.issuedAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Image Upload Modal */}
          <AnimatePresence>
            {showImageUpload && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={() => setShowImageUpload(false)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      Update Profile Picture
                    </h2>
                    <button
                      onClick={() => setShowImageUpload(false)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center">
                      <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                        <User className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowImageUpload(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button variant="primary" className="flex-1">
                      Upload
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </>
    </div>
  );
};

export default MainProfile;
