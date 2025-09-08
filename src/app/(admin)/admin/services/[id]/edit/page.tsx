// pages/services/[id]/edit.tsx (Edit Service Page)
import React, { useState } from "react";
import { CategoryWithServices } from "@/types/category.types";
import { Service } from "@/types/service.types";
import { ArrowLeft, Loader } from "lucide-react";
import { toast } from "react-hot-toast";
import ServiceForm from "@/components/admin/services/service-form";
import { useRouter } from "next/navigation";
import LoadingOverlay from "@/components/ui/LoadingOverlay";

const EditServicePage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;

  const [service, setService] = useState<Service | null>(null);
  const [categories, setCategories] = useState<CategoryWithServices[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = (updatedService: Service) => {
    toast.success("Service updated successfully!");
    // Redirect to service detail page
    router.push(`/services/${updatedService._id}`);
  };

  const handleCancel = () => {
    // Go back to service detail page or services list
    if (service) {
      router.push(`/services/${service._id}`);
    } else {
    }
    router.push("/services");
  };

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    // Re-fetch data
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  // Loading state
  if (isLoading) {
    return (
      <LoadingOverlay message="getting service ..."/>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={handleCancel}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 mb-4">
              <ArrowLeft size={20} />
              <span>Back</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Edit Service
            </h1>
          </div>

          {/* Error content */}
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {error.includes("not found")
                  ? "Service Not Found"
                  : "Failed to Load Service"}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
              <div className="space-x-4">
                {!error.includes("not found") && (
                  <button
                    onClick={handleRetry}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Try Again
                  </button>
                )}
                <button
                  onClick={() => router.push("/services")}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  Go to Services
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleCancel}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 mb-4 transition-colors">
            <ArrowLeft size={20} />
            <span>Back to Service</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Edit Service
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Update your service information and settings.
          </p>
          {service && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Editing: {service.title}
            </p>
          )}
        </div>

        {/* Service Form */}
        {service && (
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
        )}
      </div>
    </div>
  );
};

export default EditServicePage;
