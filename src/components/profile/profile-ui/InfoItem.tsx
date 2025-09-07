// components/profile/InfoItem.tsx
"use client";

import React from "react";
import { motion, Variants, cubicBezier } from "framer-motion";

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: cubicBezier(0.23, 1, 0.32, 1),
    },
  },
};

interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | React.ReactNode;
  className?: string;
}

export const InfoItem: React.FC<InfoItemProps> = ({
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
