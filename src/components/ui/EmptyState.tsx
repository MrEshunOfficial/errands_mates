import React from "react";

interface EmptyStateProps {
  searchQuery?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSearch?: () => void;
  message?: string;
  searchNotFoundMessage?: (query: string) => string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  searchQuery,
  showSearch,
  searchPlaceholder = "Search...",
  onSearchChange,
  onClearSearch,
  message = "No results found",
  searchNotFoundMessage = (query) => `No results found for "${query}"`,
}) => {
  const isSearchEmpty = searchQuery && searchQuery.trim().length > 0;

  return (
    <div className="space-y-4">
      {showSearch && (
        <div className="mb-6">
          <input
            type="text"
            placeholder={searchPlaceholder}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchQuery}
            onChange={onSearchChange}
          />
        </div>
      )}
      <div className="text-center p-8 text-gray-500">
        {isSearchEmpty ? (
          <div>
            <p className="mb-2">{searchNotFoundMessage(searchQuery)}</p>
            {onClearSearch && (
              <button
                onClick={onClearSearch}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          message
        )}
      </div>
    </div>
  );
};

// {error && displayCategories.length === 0 && (
//   <ErrorState
//     title="Failed to load categories"
//     message={error}
//     onRetry={handleRetry}
//     showSearch={showSearch}
//     searchPlaceholder={searchPlaceholder}
//   />
// )}

// {!error && displayCategories.length === 0 && (
//   <EmptyState
//     showSearch={showSearch}
//     searchQuery={search.query}
//     onSearchChange={handleSearchChange}
//     onClearSearch={search.clearSearch}
//     message="No categories found"
//     searchNotFoundMessage={(q) => `No categories found for "${q}"`}
//   />
// )}
