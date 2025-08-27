import React from "react";

import { UserRole } from "@/types";

type SocialHandle = {
  nameOfSocial: string;
  userName: string;
};

export interface ProfileContactTipsProps {
  getCompletionPercentage: () => number;
  validateGhanaPhone: (phone: string) => boolean;
  primaryContact: string;
  secondaryContact?: string;
  businessEmail?: string;
  socialHandles: SocialHandle[];
}

const ProfileContactTipsComponent: React.FC<ProfileContactTipsProps> = ({
  getCompletionPercentage,
  primaryContact,
  secondaryContact,
  businessEmail,
  socialHandles,
  validateGhanaPhone,
}) => {
  return (
    <div className="space-y-2">
      {/* Contact Preferences */}
      <div className="w-full bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="text-start text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
          📞 Contact Preferences
        </h4>
        <div className="text-start text-sm text-blue-800 dark:text-blue-200 space-y-2">
          <p>
            • <strong>Phone calls:</strong> Fastest way to reach you for urgent
            matters
          </p>
          <p>
            • <strong>WhatsApp:</strong> Great for sharing photos and quick
            messages
          </p>
          <p>
            • <strong>Social media:</strong> Helps build trust and showcase your
            work
          </p>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Contact Section Progress
          </h4>
          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
            {Math.round(getCompletionPercentage())}%
          </span>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
          <div
            className="bg-blue-500 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${getCompletionPercentage()}%` }}
          ></div>
        </div>

        <div className="space-y-2 text-sm">
          {/* Primary Phone */}
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">
              Primary Phone
            </span>
            <span
              className={
                validateGhanaPhone(primaryContact)
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }
            >
              {validateGhanaPhone(primaryContact) ? "✅ Valid" : "❌ Required"}
            </span>
          </div>

          {/* Secondary Phone */}
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">
              Secondary Phone
            </span>
            <span
              className={
                secondaryContact
                  ? "text-green-600 dark:text-green-400"
                  : "text-gray-400"
              }
            >
              {secondaryContact ? "✅ Added" : "⭕ Optional"}
            </span>
          </div>

          {/* Business Email */}
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">
              Business Email
            </span>
            <span
              className={
                businessEmail
                  ? "text-green-600 dark:text-green-400"
                  : "text-gray-400"
              }
            >
              {businessEmail ? "✅ Added" : "⭕ Optional"}
            </span>
          </div>

          {/* Social Media */}
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">
              Social Media
            </span>
            <span
              className={
                socialHandles.filter((h) => h.nameOfSocial && h.userName)
                  .length > 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-gray-400"
              }
            >
              {socialHandles.filter((h) => h.nameOfSocial && h.userName)
                .length > 0
                ? `✅ ${
                    socialHandles.filter((h) => h.nameOfSocial && h.userName)
                      .length
                  } added`
                : "⭕ Optional"}
            </span>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <span className="text-yellow-600 dark:text-yellow-400 text-lg">
            🔒
          </span>
          <div>
            <h4 className="text-start text-sm font-medium text-yellow-900 dark:text-yellow-100">
              Privacy & Security
            </h4>
            <div className="text-start text-sm text-yellow-800 dark:text-yellow-200 mt-1 space-y-1">
              <p>• Your phone numbers are verified and kept secure</p>
              <p>• Social media handles are public and help build trust</p>
              <p>• You can update or remove contact info anytime</p>
              <p>• We never share your personal details without permission</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tips for Service Providers */}
      {UserRole.PROVIDER && (
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <h4 className="text-start text-sm font-medium text-green-900 dark:text-green-100 mb-2">
            💼 Tips for Service Providers
          </h4>
          <ul className="text-start text-sm text-green-800 dark:text-green-200 space-y-1">
            <li>
              • Keep your phone number active - customers need to reach you
            </li>
            <li>• WhatsApp Business is great for sharing work photos</li>
            <li>• Social media profiles showcase your previous work</li>
            <li>• Quick response times lead to more bookings</li>
          </ul>
        </div>
      )}
    </div>
  );
};

// ✅ Export memoized version
export const ProfileContactTips = React.memo(ProfileContactTipsComponent);
