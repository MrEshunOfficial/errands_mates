// components/profile/MainProfile.tsx - Refactored with modular components
"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Home, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { useProfile } from "@/hooks/profiles/useProfile";
import { useAuth } from "@/hooks/auth/useAuth";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { EmptyState } from "@/components/ui/EmptyState";

// Import modular components
import { ProfileHeader } from "./ProfileHeader";
import { AccountInfoCard } from "./AccountInfoCard";
import { ProfileDetailsCard } from "./ProfileDetailsCard";
import { ContactDetailsCard } from "./ContactDetailsCard";
import { LocationCard } from "./LocationCard";
import { SocialMediaCard } from "./SocialMediaCard";
import { IdVerificationCard } from "./IdVerificationCard";
import { WarningsCard } from "./WarningsCard";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

// Card component
const Card: React.FC<
  {
    children: React.ReactNode;
    className?: string;
    gradient?: boolean;
  } & React.HTMLAttributes<HTMLDivElement>
> = ({ children, className = "", gradient = false, ...props }) => (
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

const CardContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
);

// Breadcrumb components
const Breadcrumb: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <nav className="flex items-center space-x-1 text-sm mb-6">{children}</nav>
);

const BreadcrumbItem: React.FC<{
  href?: string;
  children: React.ReactNode;
  isLast?: boolean;
}> = ({ href, children, isLast = false }) => (
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

export const MainProfile: React.FC = () => {
  const {
    profile,
    completeness,
    isLoading,
    error,
    isInitialized,
    clearError,
    hasRole,
  } = useProfile();
  const { user } = useAuth();

  if (!isInitialized && isLoading) {
    return <LoadingOverlay show={true} message="loading please wait..." />;
  }

  if (isInitialized && !profile) {
    return <EmptyState message="No profile found" />;
  }

  return (
    <div className="max-h-screen overflow-auto hide-scrollbar bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/20">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4 p-4 rounded-xl"
      >
        {/* Breadcrumb */}
        <motion.div>
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

        {/* Profile Header */}
        <motion.div>
          <ProfileHeader
            profile={profile}
            userEmail={user?.email}
            completeness={completeness}
            isLoading={isLoading}
          />
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Account Information */}
          <AccountInfoCard profile={profile} />

          {/* Profile Details */}
          <ProfileDetailsCard profile={profile} />

          {/* Contact Details */}
          <ContactDetailsCard profile={profile} hasRole={hasRole} />
        </div>

        {/* Location Information - Full Width */}
        <LocationCard profile={profile} />

        {/* Social Media - Full Width */}
        <SocialMediaCard profile={profile} />

        {/* Two Column Layout for ID and Warnings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ID Verification Details */}
          <IdVerificationCard profile={profile} />

          {/* Warnings Section */}
          <WarningsCard profile={profile} />
        </div>
      </motion.div>
    </div>
  );
};
