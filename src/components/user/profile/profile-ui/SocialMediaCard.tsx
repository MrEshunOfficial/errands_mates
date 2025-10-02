// components/profile/SocialMediaCard.tsx
"use client";

import React from "react";
import { easeOut, motion, Variants } from "framer-motion";
import { ExternalLink } from "lucide-react";
import type { IUserProfile } from "@/types/profile.types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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

interface SocialMediaCardProps {
  profile?: Partial<IUserProfile> | null;
}

export const SocialMediaCard: React.FC<SocialMediaCardProps> = ({
  profile,
}) => {
  if (!profile?.socialMediaHandles || profile.socialMediaHandles.length === 0) {
    return null;
  }

  return (
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
  );
};
