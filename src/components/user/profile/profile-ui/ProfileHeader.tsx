"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, Variants, cubicBezier } from "framer-motion";
import { Mail, ChevronDown, TrendingUp } from "lucide-react";
import Image from "next/image";
import type { IUserProfile } from "@/types/profile.types";
import { getInitials, getRoleDisplay } from "@/lib/utils/profileUtils";
import { StatusBadge } from "./StatusBadge";

const headerContentVariants: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: cubicBezier(0.4, 0.0, 0.2, 1),
    },
  },
  expanded: {
    height: "auto",
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: cubicBezier(0.4, 0.0, 0.2, 1),
    },
  },
};

const getImageUrl = (
  avatar: string | { url: string } | undefined
): string | undefined => {
  if (!avatar) return undefined;
  if (typeof avatar === "string") return avatar;
  return avatar.url;
};

// Simple Progress component
const Progress: React.FC<{ value: number }> = ({ value }) => (
  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
    <div
      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500 ease-out"
      style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
    />
  </div>
);

interface ProfileHeaderProps {
  profile?: Partial<IUserProfile> | null;
  userName?: string;
  userEmail?: string;
  completeness: number;
  isLoading: boolean;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  userName,
  userEmail,
  completeness,
}) => {
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);

  const displayName = userName || "User Profile";
  const avatarUrl = getImageUrl(profile?.profilePicture);

  const toggleExpanded = () => {
    setIsHeaderExpanded(!isHeaderExpanded);
  };

  return (
    <div className="p-1">
      <div className="bg-white dark:bg-gray-800 rounded-xl">
        {/* Always visible header section */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Profile Avatar */}
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
                <div className="w-16 h-16 rounded-full overflow-hidden ring-4 ring-white dark:ring-gray-700 shadow-xl bg-gradient-to-br from-blue-500 via-purple-500 to-teal-500">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt="Profile picture"
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                      style={{ width: "64px", height: "64px" }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                      {getInitials(displayName)}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Profile Info */}
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 capitalize">
                    {displayName}
                  </h1>
                </div>

                {userEmail && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Mail className="w-4 h-4" />
                    <span className="font-medium text-sm">{userEmail}</span>
                  </div>
                )}

                {profile?.role && (
                  <div className="flex items-center gap-2">
                    <StatusBadge
                      role={getRoleDisplay(profile.role)}
                      type="role"
                    />
                  </div>
                )}

                {profile?.verificationStatus === "verified" && (
                  <div className="flex items-center gap-2">
                    <StatusBadge
                      role={getRoleDisplay(profile.verificationStatus)}
                      type="verification"
                    />
                  </div>
                )}
              </div>
            </div>
            {completeness !== undefined && completeness < 100 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleExpanded}
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
            )}
          </div>
        </div>

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
              <div className="px-6 pb-6">
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
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
