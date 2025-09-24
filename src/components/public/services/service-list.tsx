"use client";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
// import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { useUserService } from "@/hooks/public/services/use-service";
import { Loader2 } from "lucide-react";
import React, { useEffect } from "react";

export default function PublicServiceList() {
  const { services, getAllServices, isLoading, error } = useUserService();

  useEffect(() => {
    getAllServices();
  }, [getAllServices]);

  // loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <div className="text-sm text-muted-foreground">
          {"Getting services ready..."}
        </div>
      </div>
    );
  }

  // error state
  if (error) {
    return <ErrorState message={error} />;
  }

  // empty state
  if (!error && !isLoading && services.length === 0) {
    return <EmptyState message="no service found!" />;
  }

  return (
    <div className="w-full h-auto">
      {/* Debug JSON Output */}
      {process.env.NODE_ENV === "development" && (
        <pre className="text-sm">{JSON.stringify(services[1], null, 2)}</pre>
      )}

      {/* Render services */}
      {services.map((service) => (
        <div
          key={service._id.toString()}
          className="p-4 mb-4 border rounded shadow-sm">
          <h2 className="text-xl font-semibold mb-2">{service.title}</h2>
          <p className="text-gray-600 mb-2">{service.description}</p>
          <p className="text-sm text-gray-500">
            Category: {service.category?.name}
          </p>
        </div>
      ))}
    </div>
  );
}
