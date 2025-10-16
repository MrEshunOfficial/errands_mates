// components/user/dashboard/client.dashboard/ClientProfileForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, X, UserPlus, Save, Search, Check } from "lucide-react";
import {
  CreateClientProfileRequest,
  UpdateClientProfileRequest,
} from "@/types";
import { useUserService } from "@/hooks/public/services/use-service";
import { usePublicProviderProfiles } from "@/hooks/providerProfiles/use-provider-profile";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type FormMode = "create" | "update";

interface ClientProfileFormProps {
  mode: FormMode;
  initialData?: {
    preferredContactMethod?: string;
    preferredServices?: string[];
    preferredProviders?: string[];
  };
  onSubmit: (
    data: CreateClientProfileRequest | UpdateClientProfileRequest
  ) => Promise<void>;
  onCancel?: () => void;
  isSubmitting: boolean;
}

// Helper function to normalize IDs (convert objects to strings)
const normalizeId = (id: unknown): string => {
  if (typeof id === "string") return id.trim();
  if (typeof id === "object" && id !== null) {
    const obj = id as Record<string, unknown>;
    const candidate =
      (obj as { _id?: unknown; id?: unknown })._id ??
      (obj as { id?: unknown }).id;
    return candidate ? String(candidate).trim() : String(obj).trim();
  }
  return String(id).trim();
};

// Helper function to normalize an array of IDs
const normalizeIdArray = (arr: unknown[]): string[] => {
  if (!Array.isArray(arr)) return [];
  return arr.map(normalizeId).filter((id) => id && id !== "[object Object]");
};

export const ClientProfileForm: React.FC<ClientProfileFormProps> = ({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const [formData, setFormData] = useState<CreateClientProfileRequest>({
    preferredContactMethod: initialData?.preferredContactMethod || "",
    preferredServices: normalizeIdArray(initialData?.preferredServices || []),
    preferredProviders: normalizeIdArray(initialData?.preferredProviders || []),
  });

  const [serviceSearchQuery, setServiceSearchQuery] = useState("");
  const [providerSearchQuery, setProviderSearchQuery] = useState("");
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        preferredContactMethod: initialData.preferredContactMethod || "",
        preferredServices: normalizeIdArray(
          initialData.preferredServices || []
        ),
        preferredProviders: normalizeIdArray(
          initialData.preferredProviders || []
        ),
      });
    }
  }, [initialData]);

  const {
    services,
    isLoading: loadingServices,
    getAllServices,
  } = useUserService();

  const {
    providers,
    loading: loadingProviders,
    hasNext,
    loadMore,
    initialized,
    error: providerError,
  } = usePublicProviderProfiles({ limit: 50, page: 1 });

  const hasLoadedServices = React.useRef(false);

  React.useEffect(() => {
    if (!hasLoadedServices.current) {
      hasLoadedServices.current = true;
      getAllServices({ limit: 100 });
    }
  }, [getAllServices]);

  const isLoading =
    (loadingServices || loadingProviders) &&
    (!initialized || services.length === 0);

  const filteredServices = React.useMemo(() => {
    if (!serviceSearchQuery.trim()) return services;
    return services.filter((service) =>
      service.title?.toLowerCase().includes(serviceSearchQuery.toLowerCase())
    );
  }, [services, serviceSearchQuery]);

  const filteredProviders = React.useMemo(() => {
    if (!providerSearchQuery.trim()) return providers;
    return providers.filter((provider) =>
      provider.businessName
        ?.toLowerCase()
        .includes(providerSearchQuery.toLowerCase())
    );
  }, [providers, providerSearchQuery]);

  const getServiceById = (id: string) => {
    return services.find((s) => s._id?.toString() === id);
  };

  const getProviderById = (id: string) => {
    return providers.find((p) => p._id?.toString() === id);
  };

  const toggleService = (serviceId: string) => {
    const serviceIdStr = normalizeId(serviceId);
    const isSelected = formData.preferredServices?.some(
      (s) => normalizeId(s) === serviceIdStr
    );
    setFormData({
      ...formData,
      preferredServices: isSelected
        ? formData.preferredServices?.filter(
            (s) => normalizeId(s) !== serviceIdStr
          )
        : [...(formData.preferredServices || []), serviceIdStr],
    });
  };

  const toggleProvider = (providerId: string) => {
    const providerIdStr = normalizeId(providerId);
    const isSelected = formData.preferredProviders?.some(
      (p) => normalizeId(p) === providerIdStr
    );
    setFormData({
      ...formData,
      preferredProviders: isSelected
        ? formData.preferredProviders?.filter(
            (p) => normalizeId(p) !== providerIdStr
          )
        : [...(formData.preferredProviders || []), providerIdStr],
    });
  };

  const removeService = (serviceId: string) => {
    const serviceIdStr = normalizeId(serviceId);
    setFormData({
      ...formData,
      preferredServices: formData.preferredServices?.filter(
        (s) => normalizeId(s) !== serviceIdStr
      ),
    });
  };

  const removeProvider = (providerId: string) => {
    const providerIdStr = normalizeId(providerId);
    setFormData({
      ...formData,
      preferredProviders: formData.preferredProviders?.filter(
        (p) => normalizeId(p) !== providerIdStr
      ),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Loader2 size={20} className="animate-spin" />
          <span>Loading services and providers...</span>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanedData: CreateClientProfileRequest | UpdateClientProfileRequest =
      {};

    if (formData.preferredContactMethod) {
      cleanedData.preferredContactMethod = formData.preferredContactMethod;
    }

    if (formData.preferredServices && formData.preferredServices.length > 0) {
      cleanedData.preferredServices = normalizeIdArray(
        formData.preferredServices
      );
    }

    if (formData.preferredProviders && formData.preferredProviders.length > 0) {
      cleanedData.preferredProviders = normalizeIdArray(
        formData.preferredProviders
      );
    }

    await onSubmit(cleanedData);
  };

  const isCreateMode = mode === "create";
  const Icon = isCreateMode ? UserPlus : Save;
  const title = isCreateMode ? "Create Your Client Profile" : "Edit Profile";
  const description = isCreateMode
    ? "Set up your profile to get started with personalized services"
    : "Update your communication preferences and service interests";
  const submitLabel = isCreateMode ? "Create Profile" : "Save Changes";

  return (
    <div className="w-full">
      {isCreateMode && (
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
            <Icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">{description}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Preferred Contact Method */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Preferred Contact Method
            <span className="text-gray-500 dark:text-gray-400 font-normal ml-1">
              (Optional)
            </span>
          </Label>
          <Select
            value={formData.preferredContactMethod}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                preferredContactMethod: value,
              })
            }
          >
            <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700">
              <SelectValue placeholder="Select contact method" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800">
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="phone">Phone</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Preferred Services */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Preferred Services
            <span className="text-gray-500 dark:text-gray-400 font-normal ml-1">
              (Optional)
            </span>
          </Label>
          {isCreateMode && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Select services you&apos;re interested in to get personalized
              recommendations
            </p>
          )}

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              value={serviceSearchQuery}
              onChange={(e) => {
                setServiceSearchQuery(e.target.value);
                setShowServiceDropdown(true);
              }}
              onFocus={() => setShowServiceDropdown(true)}
              placeholder="Search services..."
              className="pl-9 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
            />
          </div>

          {/* Dropdown List */}
          {showServiceDropdown && (
            <div className="relative">
              <div
                className="absolute top-0 left-0 right-0 max-h-64 overflow-y-auto border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 shadow-lg z-10"
                onMouseLeave={() => setShowServiceDropdown(false)}
              >
                {services.length > 0 ? (
                  filteredServices.map((service) => {
                    const serviceIdStr = service._id?.toString() || "";
                    const isSelected = formData.preferredServices?.some(
                      (s) => normalizeId(s) === serviceIdStr
                    );
                    return (
                      <button
                        key={serviceIdStr}
                        type="button"
                        onClick={() => {
                          toggleService(serviceIdStr);
                          setServiceSearchQuery("");
                          setShowServiceDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-start justify-between border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                          isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""
                        }`}
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                            {service.title}
                          </div>
                          {service.description && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                              {service.description}
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <Check className="h-5 w-5 text-blue-600 dark:text-blue-400 ml-2 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    No services found
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Selected Services */}
          {formData.preferredServices &&
            formData.preferredServices.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-md border border-blue-200 dark:border-blue-800/30">
                {formData.preferredServices.map((serviceId) => {
                  const serviceIdStr = normalizeId(serviceId);
                  const service = getServiceById(serviceIdStr);
                  return (
                    <Badge
                      key={serviceIdStr}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600"
                    >
                      <span className="text-sm">
                        {service?.title || serviceIdStr}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeService(serviceIdStr)}
                        className="hover:bg-blue-500 dark:hover:bg-blue-600 rounded p-0.5 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
        </div>

        {/* Preferred Providers */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Preferred Providers
            <span className="text-gray-500 dark:text-gray-400 font-normal ml-1">
              (Optional)
            </span>
          </Label>
          {isCreateMode && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Select providers you&apos;ve worked with or would like to work
              with
            </p>
          )}

          {providerError && (
            <p className="text-xs text-red-600 dark:text-red-400">
              Error loading providers: {providerError}
            </p>
          )}

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              value={providerSearchQuery}
              onChange={(e) => {
                setProviderSearchQuery(e.target.value);
                setShowProviderDropdown(true);
              }}
              onFocus={() => setShowProviderDropdown(true)}
              placeholder="Search providers..."
              className="pl-9 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
            />
          </div>

          {/* Dropdown List */}
          {showProviderDropdown && (
            <div className="relative">
              <div
                className="absolute top-0 left-0 right-0 max-h-64 overflow-y-auto border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 shadow-lg z-10"
                onMouseLeave={() => setShowProviderDropdown(false)}
              >
                {providers.length > 0 ? (
                  <>
                    {filteredProviders.map((provider) => {
                      const providerIdStr = provider._id?.toString() || "";
                      const isSelected = formData.preferredProviders?.some(
                        (p) => normalizeId(p) === providerIdStr
                      );
                      return (
                        <button
                          key={providerIdStr}
                          type="button"
                          onClick={() => {
                            toggleProvider(providerIdStr);
                            setProviderSearchQuery("");
                            setShowProviderDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-start justify-between border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                            isSelected
                              ? "bg-emerald-50 dark:bg-emerald-900/20"
                              : ""
                          }`}
                        >
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                              {provider.businessName}
                            </div>
                            {provider.performanceMetrics?.averageRating && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Rating:{" "}
                                {provider.performanceMetrics.averageRating.toFixed(
                                  1
                                )}{" "}
                                ★
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400 ml-2 flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                    {hasNext && (
                      <button
                        type="button"
                        onClick={() => loadMore()}
                        disabled={loadingProviders}
                        className="w-full px-4 py-2 text-center text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-t border-gray-100 dark:border-gray-700"
                      >
                        {loadingProviders ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 size={16} className="animate-spin" />
                            Loading...
                          </span>
                        ) : (
                          "Load More"
                        )}
                      </button>
                    )}
                  </>
                ) : (
                  <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    No providers found
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Selected Providers */}
          {formData.preferredProviders &&
            formData.preferredProviders.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-md border border-emerald-200 dark:border-emerald-800/30">
                {formData.preferredProviders.map((providerId) => {
                  const providerIdStr = normalizeId(providerId);
                  const provider = getProviderById(providerIdStr);
                  return (
                    <Badge
                      key={providerIdStr}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-600 dark:bg-emerald-700 text-white hover:bg-emerald-700 dark:hover:bg-emerald-600"
                    >
                      <span className="text-sm">
                        {provider?.businessName || providerIdStr}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeProvider(providerIdStr)}
                        className="hover:bg-emerald-500 dark:hover:bg-emerald-600 rounded p-0.5 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
        </div>

        {/* Form Actions */}
        <div
          className={
            isCreateMode
              ? "pt-4 border-t border-gray-200 dark:border-gray-800"
              : "pt-4"
          }
        >
          {isCreateMode && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              You can update these preferences anytime from your dashboard
            </p>
          )}

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {submitLabel}
            </Button>
            {onCancel && (
              <Button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                variant="outline"
                className="flex-1 border-gray-300 dark:border-gray-700"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
