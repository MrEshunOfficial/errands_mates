"use client";
import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  Search,
  RefreshCw,
  Grid,
  List,
  Package,
  Calendar,
  MoreVertical,
  Activity,
  Settings,
  ExternalLink,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { CategoryDetails } from "@/types/category.types";
import { Service } from "@/types";
import { useAdminCategory } from "@/hooks/categories/adminCategory.hook";
import CategoryCard from "./CategoryCard";

interface CategoryDetailsProps {
  className?: string;
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
  </div>
);

// Service Item Component (simplified)
const ServiceItem = ({
  service,
  onView,
  onEdit,
}: {
  service: Service;
  onView: (service: Service) => void;
  onEdit: (service: Service) => void;
}) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-sm truncate">{service.title}</h3>
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
          <p className="text-xs text-muted-foreground truncate mb-2">
            {service.description}
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>
              Created: {new Date(service.createdAt).toLocaleDateString()}
            </span>
            {service.basePrice && <span>Price: GHS {service.basePrice}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Button variant="ghost" size="sm" onClick={() => onView(service)}>
            <ExternalLink className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(service)}>
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

const CategoryDetailsComponent: React.FC<CategoryDetailsProps> = ({
  className,
}) => {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;

  const [activeTab, setActiveTab] = useState<
    "overview" | "services" | "subcategories"
  >("overview");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);

  // Hooks - Updated to fetch full details with services
  const {
    category,
    isLoading: categoryLoading,
    error: categoryError,
    updateLoading,
    deleteLoading,
    deleteCategory,
    restoreCategory,
    toggleCategoryStatus,
    fetchCategoryWithFullDetails,
    clearError,
    refetch,
  } = useAdminCategory(categoryId, {
    autoFetch: true,
    includeInactive: true,
    defaultParams: {
      includeUserData: true,
      includeServices: true,
      includeSubcategories: true,
      servicesLimit: 50, // Fetch more services for local filtering
    },
  });

  // Derived state - Now directly from category data
  const categoryDetails = category as CategoryDetails;
  const services = useMemo(
    () => categoryDetails?.services || [],
    [categoryDetails?.services]
  );

  const subcategories = categoryDetails?.subcategories || [];
  const serviceCount = categoryDetails?.servicesCount || 0;

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

  // Category operations
  const handleCategoryDelete = useCallback(async () => {
    if (!categoryDetails) return;
    try {
      const success = await deleteCategory(categoryId);
      if (success) {
        toast.success(
          `"${categoryDetails.name}" has been successfully deleted.`
        );
        router.push("/admin/services/categories");
      }
    } catch (error) {
      toast.error(`Failed to delete category: ${error}`);
    }
  }, [categoryDetails, deleteCategory, categoryId, router]);

  const handleCategoryRestore = useCallback(async () => {
    if (!categoryDetails) return;
    try {
      const restoredCategory = await restoreCategory(categoryId);
      if (restoredCategory) {
        toast.success(
          `"${categoryDetails.name}" has been successfully restored.`
        );
      }
    } catch (error) {
      toast.error(`Failed to restore category: ${error}`);
    }
  }, [categoryDetails, restoreCategory, categoryId]);

  const handleCategoryToggleStatus = useCallback(async () => {
    if (!categoryDetails) return;
    try {
      const updatedCategory = await toggleCategoryStatus(categoryId);
      if (updatedCategory) {
        const newStatus = updatedCategory.isActive
          ? "activated"
          : "deactivated";
        toast.success(
          `Category "${categoryDetails.name}" has been ${newStatus}.`
        );
      }
    } catch (error) {
      toast.error(`Failed to update category status: ${error}`);
    }
  }, [categoryDetails, toggleCategoryStatus, categoryId]);

  const handleRetry = useCallback(() => {
    clearError();
    fetchCategoryWithFullDetails(categoryId);
  }, [clearError, fetchCategoryWithFullDetails, categoryId]);

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

  // Navigation handlers
  const navigationHandlers = useMemo(
    () => ({
      handleServiceView: (service: Service) =>
        router.push(`/admin/services/${service._id}`),
      handleServiceEdit: (service: Service) =>
        router.push(`/admin/services/${service._id}/edit`),
      handleCreateService: () =>
        router.push(`/admin/services/create?categoryId=${categoryId}`),
      handleCreateSubcategory: () =>
        router.push(
          `/admin/services/categories/${categoryId}/subcategories/create`
        ),
      handleSubcategoryView: (subcategory: CategoryDetails) =>
        router.push(`/admin/services/categories/${subcategory._id}`),
      handleCategoryEdit: () =>
        router.push(`/admin/services/categories/${categoryId}/edit`),
      handleCategoryModerate: () =>
        router.push(`/admin/services/categories/${categoryId}/moderate`),
    }),
    [router, categoryId]
  );

  if (categoryError && !categoryDetails && !categoryLoading) {
    return (
      <ErrorState
        title="Failed to load category"
        message={categoryError}
        onRetry={handleRetry}
      />
    );
  }

  if (categoryLoading && !categoryDetails) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Loading category details...</p>
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
          The requested category could not be found or may have been deleted.
        </p>
        <Button onClick={() => router.push("/admin/services/categories")}>
          Back to Categories
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
            onClick={() => router.push("/admin/services/categories")}
            className="px-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{categoryDetails.name}</h1>
              {!categoryDetails.isActive && (
                <Badge
                  variant="secondary"
                  className="bg-orange-100 text-orange-700"
                >
                  Inactive
                </Badge>
              )}
              {categoryDetails.isDeleted && (
                <Badge variant="destructive">Deleted</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {categoryDetails.description || "No description provided"}
            </p>
          </div>
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={navigationHandlers.handleCategoryEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Category
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={navigationHandlers.handleCategoryModerate}
              >
                <Settings className="w-4 h-4 mr-2" />
                Moderate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {categoryDetails.isDeleted ? (
                <DropdownMenuItem
                  onClick={handleCategoryRestore}
                  className="text-green-600"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Restore Category
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={handleCategoryToggleStatus}>
                  <Activity className="w-4 h-4 mr-2" />
                  {categoryDetails.isActive ? "Deactivate" : "Activate"}{" "}
                  Category
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Category
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Category Details using CategoryCard */}
      <CategoryCard
        category={categoryDetails}
        userLevel="admin"
        viewMode="list"
        showStats={true}
        showModerationInfo={true}
        showDescription={true}
        showTags={true}
        customStats={createCategoryStats(categoryDetails)}
        className="border-2 border-primary/20"
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
              <Button
                onClick={navigationHandlers.handleCreateService}
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Service
              </Button>
            </div>
          )}

          {activeTab === "subcategories" && (
            <Button
              onClick={navigationHandlers.handleCreateSubcategory}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Subcategory
            </Button>
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
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Package className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {serviceCount}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Services
                    </div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <Grid className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {subcategories.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Subcategories
                    </div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
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
                <Button onClick={navigationHandlers.handleCreateService}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Service
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredServices.map((service) => (
                <ServiceItem
                  key={service._id.toString()}
                  service={service}
                  onView={navigationHandlers.handleServiceView}
                  onEdit={navigationHandlers.handleServiceEdit}
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
              <Button onClick={navigationHandlers.handleCreateSubcategory}>
                <Plus className="w-4 h-4 mr-2" />
                Create Subcategory
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subcategories.map((subcategory) => (
                <CategoryCard
                  key={subcategory._id.toString()}
                  category={subcategory}
                  userLevel="admin"
                  viewMode="grid"
                  onView={navigationHandlers.handleSubcategoryView}
                  onEdit={(cat) =>
                    router.push(`/admin/services/categories/${cat._id}/edit`)
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{categoryDetails.name}
              &quot;? This will remove {serviceCount} services and{" "}
              {subcategories.length} subcategories.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCategoryDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {(updateLoading || deleteLoading) && (
        <LoadingOverlay
          message={
            updateLoading ? "Updating category..." : "Deleting category..."
          }
        />
      )}
    </div>
  );
};

export default CategoryDetailsComponent;
