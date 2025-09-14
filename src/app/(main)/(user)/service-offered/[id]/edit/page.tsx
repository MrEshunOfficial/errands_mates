"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";
import ServiceForm from "@/components/admin/services/service-form";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { useCategory } from "@/hooks/public/categories/userCategory.hook";
import { CategoryWithServices } from "@/types/category.types";
import { Service } from "@/types/service.types";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { useUserService } from "@/hooks/public/services/use-service";

const EditServicePage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const serviceId = params?.id as string;

  // Local state for this component only
  const [service, setService] = useState<Service | null>(null);
  const [categories, setCategories] = useState<CategoryWithServices[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with true since we're fetching data
  const [isInitialized, setIsInitialized] = useState(false);

  const { getServiceById } = useUserService();
  const { categories: fetchedCategories, fetchParentCategories } =
    useCategory();

  // Fetch service and categories
  useEffect(() => {
    const abortController = new AbortController();

    const fetchServiceData = async () => {
      if (!serviceId) {
        setError("Service ID is required");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch service and categories in parallel
        const [serviceData, categoriesData] = await Promise.all([
          getServiceById(serviceId),
          fetchedCategories?.length
            ? Promise.resolve(fetchedCategories)
            : fetchParentCategories({
                includeSubcategories: true,
                includeServicesCount: true,
              }),
        ]);

        if (!abortController.signal.aborted) {
          if (!serviceData) {
            throw new Error("Service not found");
          }

          // Filter and validate categories
          const validCategories = (categoriesData ?? []).filter(
            (cat): cat is CategoryWithServices =>
              "services" in cat &&
              Array.isArray(cat.services) &&
              "servicesCount" in cat &&
              typeof cat.servicesCount === "number"
          );

          setService(serviceData);
          setCategories(validCategories);
          setIsInitialized(true);
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to load service";
          console.error("Error fetching service data:", err);
          setError(errorMessage);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchServiceData();

    return () => {
      abortController.abort();
    };
  }, [serviceId, getServiceById, fetchParentCategories, fetchedCategories]);

  // Handle success and cancel
  const handleSuccess = (updatedService: Service) => {
    toast.success("Service updated successfully!");
    router.push(`/services/${updatedService._id}`);
  };

  const handleCancel = () => {
    router.push(service ? `/services/${service._id}` : "/services");
  };

  const handleRetry = () => {
    // Reset state and refetch
    setError(null);
    setIsLoading(true);
    setIsInitialized(false);
    // The useEffect will automatically run again due to dependency array
    window.location.reload();
  };

  // Loading state - show while fetching data
  if (isLoading && !isInitialized) {
    return <LoadingOverlay message="Loading service data..." />;
  }

  // Error state
  if (error) {
    return (
      <ErrorState
        message="Service Data Unavailable"
        title={error}
        onRetry={handleRetry}
      />
    );
  }

  // Fallback for missing service after loading is complete
  if (!service && !isLoading) {
    return <EmptyState message="Service not found or has been deleted" />;
  }

  // Don't render form until we have both service and categories
  if (!service || categories.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Loading service form...</p>
        </div>
      </div>
    );
  }

  // Main UI
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={handleCancel}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 mb-4 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Service</span>
        </button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Edit Service
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Update your service information and settings.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Editing: {service.title}
          </p>
        </div>

        <ServiceForm
          service={service}
          categories={categories}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          mode="edit"
          showCancelButton={true}
          submitButtonText="Update Service"
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm"
        />
      </div>
    </div>
  );
};

export default EditServicePage;
