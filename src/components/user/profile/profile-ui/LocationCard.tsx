// components/profile/LocationCard.tsx
"use client";

import React from "react";
import { easeOut, motion, Variants } from "framer-motion";
import { MapPin } from "lucide-react";
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

interface LocationCardProps {
  profile?: Partial<IUserProfile> | null;
}

export const LocationCard: React.FC<LocationCardProps> = ({ profile }) => {
  if (!profile?.location) return null;

  return (
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
  );
};
