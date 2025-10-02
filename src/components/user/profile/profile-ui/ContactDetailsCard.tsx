// components/profile/ContactDetailsCard.tsx
"use client";

import React from "react";
import { easeOut, motion, Variants } from "framer-motion";
import { Phone, Mail } from "lucide-react";
import type { IUserProfile } from "@/types/profile.types";
import { UserRole } from "@/types/base.types";
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

interface ContactDetailsCardProps {
  profile?: Partial<IUserProfile> | null;
  hasRole: (role: UserRole) => boolean;
}

export const ContactDetailsCard: React.FC<ContactDetailsCardProps> = ({
  profile,
  hasRole,
}) => {
  if (!profile?.contactDetails) return null;

  return (
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
  );
};
