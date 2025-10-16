// app/service-offered/[id]/page.tsx
"use client";

import React, { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Briefcase } from "lucide-react";
import ServiceDetails from "@/components/services/service-details";
import type { Service } from "@/types/service.types";
import { toast } from "sonner";
import { useUserService } from "@/hooks/public/services/use-service";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ServicePage({ params }: PageProps) {
  const router = useRouter();
  const { currentService, getServiceById } = useUserService();

  // Unwrap the params promise
  const { id } = use(params);

  // Fetch service only once when id changes
  React.useEffect(() => {
    getServiceById(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleEdit = (service: Service) => {
    // Navigate to edit page or open edit modal
    router.push(`/service-offered/${service._id}/edit`);
  };

  const handleDelete = async () => {
    try {
      // The actual deletion is handled by the ServiceDetails component's hook
      // This callback is called after successful deletion
      toast.success("Service deleted successfully");

      // Navigate back to services list
      router.push("/service-offered");
    } catch (error) {
      toast.error("Failed to delete service");
      console.error("Delete error:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link
          href="/service-offered"
          className="hover:text-foreground transition-colors flex items-center gap-2"
        >
          <LayoutDashboard size={14} />
          Service
        </Link>
        <span>/</span>
        <Link
          href={`/service-offered/${id}`}
          className="hover:text-foreground transition-colors flex items-center gap-2"
        >
          <Briefcase size={14} />
          {id}
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium line-clamp-1">
          {currentService?.title || "Loading..."}
        </span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {currentService?.title || "Service Details"}
        </h1>
        <p className="text-muted-foreground">
          View and manage your service details
        </p>
      </div>

      {/* Service Details Component - PASS THE serviceId PROP */}
      <ServiceDetails
        serviceId={id}
        isUserView={true}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
