// components/popular-services.tsx
"use client";

import { useUserService } from "@/hooks/public/services/use-service";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

interface PopularServicesProps {
  limit?: number; // Optional limit for number of services to display
  title?: string; // Optional title for the section
  showTitle?: boolean; // Whether to show the title
  className?: string; // Additional CSS classes
}

export default function PopularServices({
  limit = 10,
  title = "Popular Services",
  showTitle = true,
  className = "",
}: PopularServicesProps) {
  const { popularServices, getPopularServices, isLoading, error } =
    useUserService();

  useEffect(() => {
    getPopularServices(limit);
  }, [getPopularServices, limit]);

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <div className="text-sm text-muted-foreground">
          {"Loading popular services..."}
        </div>
      </div>
    );
  if (error)
    return (
      <p className="text-red-500 dark:text-red-400">
        Error loading popular services: {error}
      </p>
    );
  if (!popularServices || popularServices.length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400">
        No popular services available.
      </p>
    );
  }

  console.log("PopularServices:", popularServices);

  return (
    <div className={className}>
      {showTitle && (
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          {title}
        </h2>
      )}
      <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {popularServices.map((service) => (
          <li
            key={service._id.toString()}
            className="border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm dark:shadow-gray-800/25 p-4 hover:shadow-md dark:hover:shadow-gray-800/40 transition-all bg-white dark:bg-gray-800">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {service.title}
              </h3>
              {/* Optional: Add a popularity indicator */}
              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full">
                Popular
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-3">
              {service.description}
            </p>

            {/* Optional: Add more service details */}
            <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
              <span className="capitalize bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
                {service.status}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
