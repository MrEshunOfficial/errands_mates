import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export default function ProfileCard({
  isEditing,
  currentCompleteness,
  hasIdDetails,
  isIdComplete,
}: {
  isEditing: boolean;
  currentCompleteness: number;
  hasIdDetails: boolean;
  isIdComplete: () => boolean;
}) {
  const [isOpen, setIsOpen] = useState(false); // collapsed by default

  return (
    <div className="mb-8">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header (always visible, compact) */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 text-white"
        >
          <div className="flex items-center gap-3">
            {isOpen ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
            <span className="font-semibold text-lg">
              {isEditing ? "Edit Your Profile" : "Build Your Profile"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm">{currentCompleteness}% Complete</span>
            {hasIdDetails && (
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  isIdComplete()
                    ? "bg-green-500 text-white"
                    : "bg-yellow-500 text-white"
                }`}
              >
                ID: {isIdComplete() ? "Verified" : "Pending"}
              </span>
            )}
          </div>
        </button>

        {/* Collapsible Body */}
        <div
          className={`transition-all duration-500 overflow-hidden ${
            isOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="p-6">
            {/* Progress Section */}
            <div className="flex justify-between text-sm mb-2">
              <span>Progress</span>
              <span>{currentCompleteness}% Complete</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-yellow-400 to-green-400 h-3 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${currentCompleteness}%` }}
              />
            </div>

            {/* Extra content could go here */}
            <div className="mt-6 text-gray-700 dark:text-gray-300">
              <p>
                Fill out your profile details to unlock features and improve
                your account visibility.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
