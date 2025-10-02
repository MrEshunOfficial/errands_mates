"use client";
import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Trash2,
  Search,
  RefreshCw,
  Grid,
  List,
  Package,
  Calendar,
  Activity,
  Settings,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { CategoryDetails } from "@/types/category.types";
import { Service } from "@/types";
import { useCategoryDetail } from "@/hooks/public/categories/userCategory.hook";
import Image from "next/image";
import CategoryCard from "@/components/categories/CategoryCard";

interface CategoryDetailsProps {
  className?: string;
  isDeleted?: boolean;
}

// Custom stats for CategoryCard
const createCategoryStats = (category: CategoryDetails | null) => (
  <div className="flex items-center gap-4 text-sm text-muted-foreground">
    <div className="flex items-center gap-1">
      <Package className="w-4 h-4" />
      <span>{category?.servicesCount || 0} services</span>
    </div>
    <div className="flex items-center gap-1">
      <Grid className="w-4 h-4" />
      <span>{category?.subcategories?.length || 0} subcategories</span>
    </div>
    <div className="flex items-center gap-1">
      <Calendar className="w-4 h-4" />
      <span>
        Created{" "}
        {category
          ? new Date(category.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "2-digit",
            })
          : "N/A"}
      </span>
    </div>
    {category?.isDeleted && category.deletedAt && (
      <div className="flex items-center gap-1 text-destructive">
        <Trash2 className="w-4 h-4" />
        <span>
          Deleted{" "}
          {new Date(category.deletedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "2-digit",
          })}
        </span>
      </div>
    )}
  </div>
);

// Service Item Component
const ServiceItem = ({
  service,
  onView,
}: {
  service: Service;
  onView: (service: Service) => void;
}) => (
  <Card className={cn("transition-shadow")}>
    <CardContent className="p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {service.images &&
          service.images.length > 0 &&
          service.images[0]?.url ? (
            <Image
              src={service.images[0].url}
              alt={service.title}
              width={64}
              height={64}
              className="w-16 h-16 object-cover rounded-md flex-shrink-0"
              onError={(e) => {
                e.currentTarget.src =
                  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="%23f0f0f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="12">No image</text></svg>';
              }}
            />
          ) : (
            <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={cn("font-medium text-sm truncate")}>
                {service.title}
              </h3>
              <Badge
                variant={
                  service.status === "approved"
                    ? "default"
                    : service.status === "rejected"
                    ? "destructive"
                    : "secondary"
                }
              >
                {service.status}
              </Badge>
            </div>
            <p className={cn("text-xs text-muted-foreground truncate mb-2")}>
              {service.description}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                Created: {new Date(service.createdAt).toLocaleDateString()}
              </span>
              {service.basePrice && <span>Price: GHS {service.basePrice}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={() => onView(service)}>
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

const PublicCategoryDetailsComponent: React.FC<CategoryDetailsProps> = ({
  className,
  isDeleted = false,
}) => {
  const params = useParams();
  const router = useRouter();
  const categorySlugOrId = params.slug as string;

  const [activeTab, setActiveTab] = useState<
    "overview" | "services" | "subcategories"
  >("overview");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);

  // Determine if the param is a slug (contains hyphens) or an ID (MongoDB ObjectId format)
  const isSlug = categorySlugOrId?.includes("-");

  // Memoize category options to prevent unnecessary re-renders
  const categoryOptions = useMemo(
    () => ({
      slug: isSlug ? categorySlugOrId : undefined,
      includeSubcategories: true,
      includeUserData: true,
      includeServices: true,
      servicesLimit: 50,
      autoFetch: true,
    }),
    [categorySlugOrId, isSlug]
  );

  // Use the detail hook which supports both ID and slug
  const {
    category,
    loading: categoryLoading,
    error: categoryError,
    refetch,
  } = useCategoryDetail(isSlug ? undefined : categorySlugOrId, categoryOptions);

  // Derived state - Now directly from category data
  const categoryDetails = category as CategoryDetails;
  const services = useMemo(
    () => categoryDetails?.services || [],
    [categoryDetails?.services]
  );

  const subcategories = categoryDetails?.subcategories || [];
  const serviceCount = categoryDetails?.servicesCount || 0;

  const navigationHandlers = useMemo(
    () => ({
      handleServiceView: (service: Service) =>
        router.push(`/services/${service.slug}`),
      handleSubcategoryView: (subcategory: CategoryDetails) =>
        router.push(`/services/categories/${subcategory._id}`),
    }),
    [router]
  );

  // Filter services locally based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredServices(services);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = services.filter(
      (service) =>
        service.title?.toLowerCase().includes(query) ||
        service.description?.toLowerCase().includes(query) ||
        service.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
    setFilteredServices(filtered);
  }, [services, searchQuery]);

  const handleRefresh = useCallback(async () => {
    try {
      await refetch();
      toast.success("Category data refreshed successfully.");
    } catch (error) {
      toast.error(`Failed to refresh data: ${error}`);
    }
  }, [refetch]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    []
  );

  // Back navigation handler
  const handleBackNavigation = useCallback(() => {
    router.push("/services/category");
  }, [router]);

  if (categoryError && !categoryDetails && !categoryLoading) {
    return (
      <ErrorState title={`Failed to load category`} message={categoryError} />
    );
  }

  if (categoryLoading && !categoryDetails) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">
            Loading {isDeleted ? "deleted " : ""}category details...
          </p>
        </div>
      </div>
    );
  }

  if (!categoryDetails) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Package className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Category not found</h3>
        <p className="text-muted-foreground mb-6">
          The requested {isDeleted ? "deleted " : ""}category could not be found
          or may have been permanently deleted.
        </p>
        <Button onClick={handleBackNavigation}>
          Back to {isDeleted ? "Deleted " : ""}Categories
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackNavigation}
            className="px-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={categoryLoading}
          >
            <RefreshCw
              className={cn("w-4 h-4 mr-2", categoryLoading && "animate-spin")}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Category Details using CategoryCard */}
      <CategoryCard
        category={categoryDetails}
        userLevel="public"
        viewMode="list"
        showStats={true}
        showModerationInfo={false}
        showDescription={true}
        showTags={true}
        customStats={createCategoryStats(categoryDetails)}
      />

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as "overview" | "services" | "subcategories")
        }
        className="w-full"
      >
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2">
              Services
              {serviceCount > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {serviceCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="subcategories"
              className="flex items-center gap-2"
            >
              Subcategories
              {subcategories.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {subcategories.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {activeTab === "services" && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-10 w-64"
                />
              </div>
              <div className="flex items-center border rounded-lg p-1">
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="px-3"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="px-3"
                >
                  <Grid className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Category Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div
                    className={cn(
                      "text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg",
                      categoryDetails.isDeleted && "opacity-60"
                    )}
                  >
                    <Package className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {serviceCount}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Services
                    </div>
                  </div>
                  <div
                    className={cn(
                      "text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg",
                      categoryDetails.isDeleted && "opacity-60"
                    )}
                  >
                    <Grid className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {subcategories.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Subcategories
                    </div>
                  </div>
                  <div
                    className={cn(
                      "text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg",
                      categoryDetails.isDeleted && "opacity-60"
                    )}
                  >
                    <Calendar className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {new Date(categoryDetails.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "2-digit",
                        }
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">Created</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    <span>
                      Last modified:{" "}
                      {new Date(categoryDetails.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>
                      Created:{" "}
                      {new Date(categoryDetails.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {categoryDetails.deletedAt && (
                    <div className="flex items-center gap-3 text-sm text-destructive">
                      <Trash2 className="w-4 h-4" />
                      <span>
                        Deleted:{" "}
                        {new Date(
                          categoryDetails.deletedAt
                        ).toLocaleDateString()}
                        {categoryDetails.deletedBy && (
                          <span className="ml-1">
                            by{" "}
                            {categoryDetails.deletedBy.displayName ||
                              categoryDetails.deletedBy.name ||
                              "Unknown Admin"}
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  {categoryDetails.lastModifiedBy && (
                    <div className="flex items-center gap-3 text-sm">
                      <Settings className="w-4 h-4 text-muted-foreground" />
                      <span>
                        Last modified by:{" "}
                        {(
                          categoryDetails.lastModifiedBy as CategoryDetails["lastModifiedBy"]
                        )?.displayName || "System"}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services" className="mt-6">
          {filteredServices.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery
                  ? `No services found for "${searchQuery}"`
                  : "No services found"}
              </h3>
              <div className="flex items-center justify-center gap-3">
                {searchQuery && (
                  <Button variant="outline" onClick={() => setSearchQuery("")}>
                    Clear search
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredServices.map((service) => (
                <ServiceItem
                  key={service._id.toString()}
                  service={service}
                  onView={navigationHandlers.handleServiceView}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="subcategories" className="mt-6">
          {subcategories.length === 0 ? (
            <div className="text-center py-12">
              <Grid className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                No subcategories found
              </h3>
              <p className="text-muted-foreground">
                This category doesn&apos;t have any subcategories yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subcategories.map((subcategory) => (
                <CategoryCard
                  key={subcategory._id.toString()}
                  category={subcategory}
                  userLevel="public"
                  viewMode="grid"
                  onView={navigationHandlers.handleSubcategoryView}
                  className={cn(categoryDetails.isDeleted && "opacity-75")}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PublicCategoryDetailsComponent;
