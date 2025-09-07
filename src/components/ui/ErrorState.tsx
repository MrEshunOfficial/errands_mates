import React from "react";

interface ErrorStateProps {
  message?: string; // error message
  title?: string; // heading
  onRetry?: () => void; // retry handler
  showSearch?: boolean;
  searchPlaceholder?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  title = "Failed to load data",
  onRetry,
  showSearch,
  searchPlaceholder = "Search...",
}) => {
  return (
    <div className="space-y-4">
      {showSearch && (
        <div className="mb-6">
          <input
            type="text"
            placeholder={searchPlaceholder}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled
          />
        </div>
      )}
      <div className="text-center p-8">
        <div className="text-red-500 mb-4">
          <svg
            className="w-12 h-12 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <p className="text-gray-900 font-medium mb-2">{title}</p>
        {message && <p className="text-gray-600 mb-4">{message}</p>}
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};
