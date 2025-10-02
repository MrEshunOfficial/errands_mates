// components/profile/AccountInfoCard.tsx
"use client";

import React from "react";
import { easeOut, motion, Variants } from "framer-motion";
import { UserCircle, Shield, Settings, Calendar, Clock } from "lucide-react";
import type { IUserProfile } from "@/types/profile.types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getRoleDisplay } from "@/lib/utils/profileUtils";
import { format } from "date-fns";
import { InfoItem } from "./InfoItem";

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

interface AccountInfoCardProps {
  profile?: Partial<IUserProfile> | null;
}

export const AccountInfoCard: React.FC<AccountInfoCardProps> = ({
  profile,
}) => {
  return (
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
              value={
                profile?.createdAt
                  ? format(new Date(profile.createdAt), "PPP")
                  : "—"
              }
            />
            <InfoItem
              icon={<Clock className="w-4 h-4" />}
              label="Last Updated"
              value={
                profile?.updatedAt
                  ? format(new Date(profile.updatedAt), "PPP p")
                  : "—"
              }
            />
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
