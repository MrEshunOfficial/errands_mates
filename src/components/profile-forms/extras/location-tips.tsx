// LocationTips.tsx - Tips component with popover
"use client";

import React, { useState, useRef, useEffect } from "react";

export const LocationTips: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        !triggerRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen]);

  const tips = [
    "Accurate Ghana Post GPS helps customers find you easily",
    "Mention popular landmarks that locals recognize",
    "GPS coordinates enable precise mapping for services",
    "Complete location details build trust with customers",
  ];

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-3 py-2 text-sm font-medium text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/40 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true">
        <span className="mr-2">💡</span>
        Tips
        <svg
          className={`ml-1 h-4 w-4 transform transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 animate-in slide-in-from-top-2 duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tips-title">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3
                id="tips-title"
                className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                <span className="mr-2">💡</span>
                Location Tips for Better Visibility
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close tips">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              {tips.map((tip, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-yellow-500 mt-0.5 flex-shrink-0">
                    •
                  </span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                <span className="font-medium">Pro tip:</span> Complete all
                required fields to maximize your profile visibility
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
