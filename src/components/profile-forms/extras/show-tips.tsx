import { UserRole } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, AlertCircle } from "lucide-react";
import { LucideProps } from "lucide-react";
import { ForwardRefExoticComponent, RefAttributes } from "react";

interface RoleOption {
  value: UserRole;
  label: string;
  shortLabel: string;
  description: string;
  detailedDescription: string;
  icon: string;
  iconComponent: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
  benefits: string[];
  color: string;
}

interface CompletionStatus {
  role: boolean;
  bio: boolean;
}

interface ProfileRoleTipsProps {
  selectedRole?: UserRole;
  completionStatus: CompletionStatus;
  selectedRoleOption?: RoleOption;
}

export function ProfileRoleTips({
  selectedRole,
  completionStatus,
  selectedRoleOption,
}: ProfileRoleTipsProps) {
  if (!selectedRole) return null;

  // Calculate completion percentage
  const getCompletionPercentage = (): number => {
    const requiredFields = ["role"]; // Role is required
    const optionalFields = ["bio"]; // Bio is optional but contributes to progress

    const completedRequired = requiredFields.filter(
      (field) => completionStatus[field as keyof CompletionStatus]
    ).length;
    const completedOptional = optionalFields.filter(
      (field) => completionStatus[field as keyof CompletionStatus]
    ).length;

    const totalFields = requiredFields.length + optionalFields.length;
    const totalCompleted = completedRequired + completedOptional;

    return Math.round((totalCompleted / totalFields) * 100);
  };

  // Get progress status for individual fields
  const getFieldStatus = (
    fieldKey: keyof CompletionStatus,
    required: boolean
  ) => {
    const isCompleted = completionStatus[fieldKey];

    if (isCompleted) {
      return {
        bgColor: "bg-green-100 dark:bg-green-900/30",
        textColor: "text-green-700 dark:text-green-300",
        icon: <CheckCircle className="w-3 h-3" />,
      };
    } else if (required) {
      return {
        bgColor: "bg-red-100 dark:bg-red-900/30",
        textColor: "text-red-700 dark:text-red-300",
        icon: <AlertCircle className="w-3 h-3" />,
      };
    } else {
      return {
        bgColor: "bg-gray-100 dark:bg-gray-700",
        textColor: "text-gray-600 dark:text-gray-400",
        icon: <div className="w-3 h-3 rounded-full border border-current" />,
      };
    }
  };

  // Progress fields configuration
  const progressFields = [
    { key: "role" as keyof CompletionStatus, label: "Role", required: true },
    { key: "bio" as keyof CompletionStatus, label: "Bio", required: false },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-2"
    >
      <div className="flex items-start gap-3 mb-3">
        <div>
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Tips for a great bio:
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            {selectedRole === UserRole.PROVIDER ? (
              <>
                <li>• Highlight your experience and skills</li>
                <li>• Mention what makes your service unique</li>
                <li>• Include your service areas or specialties</li>
                <li>• Keep it professional but friendly</li>
              </>
            ) : (
              <>
                <li>• Keep it professional but personal</li>
                <li>• Mention your interests or preferences</li>
                <li>• Include what you value in service providers</li>
                <li>• Be authentic and approachable</li>
              </>
            )}
          </ul>
        </div>
      </div>

      {/* Completion Summary */}
      <AnimatePresence>
        {selectedRole && completionStatus.role && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4"
          >
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                  Great progress! 🎉
                </h4>
                <p className="text-sm text-green-800 dark:text-green-200">
                  {selectedRole === UserRole.PROVIDER
                    ? "As a service provider, make sure to complete your location and contact details to help customers find and reach you easily."
                    : "As a customer, adding your location will help you discover and connect with nearby service providers."}
                </p>

                {selectedRoleOption && (
                  <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-800">
                    <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">
                      Next up for {selectedRoleOption.shortLabel}s:
                    </p>
                    <div className="text-xs text-green-600 dark:text-green-400">
                      📍 Location details • 📞 Contact information
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section Progress */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Section Progress
          </h4>
          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            {getCompletionPercentage()}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
          <motion.div
            className="bg-blue-500 dark:bg-blue-400 h-2 rounded-full transition-all duration-500"
            initial={{ width: 0 }}
            animate={{ width: `${getCompletionPercentage()}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        {/* Field Status Indicators */}
        <div className="flex flex-wrap gap-2">
          {progressFields.map(({ key, label, required }) => {
            const status = getFieldStatus(key, required);

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-all duration-200 ${status.bgColor} ${status.textColor}`}
              >
                {status.icon}
                <span>{label}</span>
                {required && !completionStatus[key] && (
                  <span className="text-xs opacity-75">(required)</span>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Progress Status Message */}
        <motion.div
          className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {getCompletionPercentage() === 100 ? (
              <span className="text-green-600 dark:text-green-400 font-medium">
                ✨ Profile section complete! Ready to move to the next step.
              </span>
            ) : getCompletionPercentage() >= 50 ? (
              <span className="text-blue-600 dark:text-blue-400">
                📝 Great start!{" "}
                {completionStatus.bio
                  ? "Consider adding more details to your bio."
                  : "Add a bio to complete this section."}
              </span>
            ) : completionStatus.role ? (
              <span className="text-yellow-600 dark:text-yellow-400">
                👋 Welcome! Adding a bio will help others get to know you
                better.
              </span>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">
                🚀 Let&apos;s get started by selecting your role above.
              </span>
            )}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
