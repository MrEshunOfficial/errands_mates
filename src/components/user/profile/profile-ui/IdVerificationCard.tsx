"use client";

import React from "react";
import { easeOut, motion, Variants } from "framer-motion";
import { Shield, ExternalLink } from "lucide-react";
import type { IUserProfile } from "@/types/profile.types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getRoleDisplay } from "@/lib/utils/profileUtils";
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

interface IdVerificationCardProps {
  profile?: Partial<IUserProfile> | null;
}

export const IdVerificationCard: React.FC<IdVerificationCardProps> = ({
  profile,
}) => {
  if (!profile?.idDetails) return null;

  return (
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
            className="space-y-2"
          >
            {/* ID Type + ID Number on the same row */}
            <InfoItem
              icon={<Shield className="w-4 h-4" />}
              label="ID Details"
              value={
                <div className="flex flex-wrap items-center gap-6">
                  {/* ID Type */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Type:
                    </span>
                    <span className="px-2 py-1 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                      {getRoleDisplay(profile.idDetails.idType)}
                    </span>
                  </div>

                  {/* ID Number */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Number:
                    </span>
                    <span className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {profile.idDetails.idNumber}
                    </span>
                  </div>
                </div>
              }
            />

            {/* ID File (Document) */}
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
  );
};
