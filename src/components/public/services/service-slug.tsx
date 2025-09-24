// components/services-list.tsx
"use client";

import { useUserService } from "@/hooks/public/services/use-service";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

interface ServicesListProps {
  slug: string;
}

export default function ServicesList({ slug }: ServicesListProps) {
  const { currentService, getServiceBySlug, isLoading, error } =
    useUserService();

  useEffect(() => {
    getServiceBySlug(slug);
  }, [getServiceBySlug, slug]);

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <div className="text-sm text-muted-foreground">
          {"Loading services..."}
        </div>
      </div>
    );
  if (error) return <p className="text-red-500">Error: {error}</p>;
  if (!isLoading && !error && !currentService)
    return <p className="text-gray-500">Service not found.</p>;

  console.log("ServicesList currentService:", currentService);

  // If you want to display a single service
  if (currentService) {
    return (
      <div className="border rounded-2xl shadow p-4 hover:shadow-md transition">
        <h3 className="text-xl font-semibold">{currentService.title}</h3>
        <p className="text-gray-600">{currentService.description}</p>
      </div>
    );
  }

  return null;
}
