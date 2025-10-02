"use client";

import React from "react";
import { easeOut, motion, Variants } from "framer-motion";
import type { IUserProfile } from "@/types/profile.types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getRoleDisplay } from "@/lib/utils/profileUtils";
import { format } from "date-fns";
import { InfoItem } from "./InfoItem";

import { User, Settings, Building, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

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

const cardVariants: Variants = {
  hover: {
    y: -2,
    scale: 1.01,
    transition: { duration: 0.2, ease: easeOut },
  },
};

interface ProfileDetailsCardProps {
  profile?: Partial<IUserProfile> | null;
}

export const ProfileDetailsCard: React.FC<ProfileDetailsCardProps> = ({
  profile,
}) => {
  // limit visible bio text length
  const getShortBio = (bio: string) => {
    const maxLength = 60; // characters to show before truncating
    return bio.length > maxLength ? bio.slice(0, maxLength) + "…" : bio;
  };

  return (
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
                  value={
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help">
                            {getShortBio(profile.bio)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          {profile.bio}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  }
                />
              )}
              {profile.isActiveInMarketplace !== undefined && (
                <InfoItem
                  icon={<Building className="w-4 h-4" />}
                  label="Marketplace Status"
                  value={
                    <Badge
                      variant={
                        profile.isActiveInMarketplace ? "success" : "secondary"
                      }
                    >
                      {profile.isActiveInMarketplace ? "Active" : "Inactive"}
                    </Badge>
                  }
                />
              )}
              <InfoItem
                icon={<Calendar className="w-4 h-4" />}
                label="Last Updated"
                value={
                  profile?.createdAt
                    ? format(new Date(profile.createdAt), "PPP")
                    : "—"
                }
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
              <Button variant={"outline"}>Complete Profile</Button>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
