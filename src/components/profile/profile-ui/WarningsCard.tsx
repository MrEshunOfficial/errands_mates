import React from "react";
import { easeOut, motion, Variants, cubicBezier } from "framer-motion";
import { AlertTriangle, Clock } from "lucide-react";
import type { IUserProfile } from "@/types/profile.types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; // ✅ your Badge, not lucide-react
import { format } from "date-fns";

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

const cardVariants: Variants = {
  hover: {
    y: -2,
    scale: 1.01,
    transition: { duration: 0.2, ease: easeOut },
  },
};

interface WarningsCardProps {
  profile?: Partial<IUserProfile> | null;
}

export const WarningsCard: React.FC<WarningsCardProps> = ({ profile }) => {
  if (!profile?.warnings || profile.warnings.length === 0) {
    return null;
  }

  return (
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
                            ? "destructive"
                            : warning.severity === "medium"
                            ? "secondary"
                            : "outline"
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
                        Issued on{" "}
                        {warning.issuedAt
                          ? format(new Date(warning.issuedAt), "PPP")
                          : "—"}
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
  );
};
