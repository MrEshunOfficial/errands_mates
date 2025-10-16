"use client";
import * as React from "react";
import PublicServiceList from "@/components/services/service-list";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Category,
  CategoryDetails,
  CategoryWithServices,
} from "@/types/category.types";
import { CategoryCardAction } from "@/components/categories/SharedCategoryCard";
import { useCategories } from "@/hooks/public/categories/userCategory.hook";
import { AlertCircle, ArrowRight, Grid3x3, Sparkles } from "lucide-react";
import { useUserService } from "@/hooks/public/services/use-service";
import { AutoScrollCategoryCarousel } from "@/components/categories/CategoryCarousel";
import { ServicesLoadingSkeleton } from "@/components/services/service-extras";

export default function HomePage() {
  const router = useRouter();

  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
    fetchParentCategoriesWithServices,
    clearError: clearCategoriesError,
  } = useCategories(
    { limit: 8 },
    {
      includeServices: true,
      servicesLimit: 3,
      popularOnly: true,
    }
  );

  const { isLoading: servicesLoading, services } = useUserService();
  const isInitialServicesLoad = servicesLoading && services.length === 0;

  const handleCategoryAction = React.useCallback(
    (
      action: CategoryCardAction,
      category: Category | CategoryWithServices | CategoryDetails
    ) => {
      switch (action) {
        case "explore":
          router.push(`services/category/${category.slug || category._id}`);
          break;
        case "share":
          if (navigator.share) {
            navigator.share({
              title: category.name,
              text:
                category.description || `Check out ${category.name} services`,
              url: `${window.location.origin}/categories/${
                category.slug || category._id
              }`,
            });
          } else {
            navigator.clipboard.writeText(
              `${window.location.origin}/categories/${
                category.slug || category._id
              }`
            );
          }
          break;
        default:
          console.log(`Action ${action} not implemented for public categories`);
      }
    },
    [router]
  );

  if (categoriesError) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto px-4 py-8">
        <CategoryErrorState
          error={categoriesError}
          onRetry={() => {
            clearCategoriesError();
            fetchParentCategoriesWithServices(3, true);
          }}
          onViewAll={() => router.push("/services/category")}
        />

        <FeaturedServicesSection
          isLoading={isInitialServicesLoad}
          router={router}
        />
      </div>
    );
  }

  const displayCategories = categories.slice(0, 8);

  return (
    <div className="p-2 space-y-4">
      {/* Hero Section with Categories */}
      <section className="space-y-6">
        <SectionHeader
          icon={<Grid3x3 className="w-6 h-6" />}
          title="Explore Service Categories"
          subtitle="Explore our curated collection of service categories"
          accentColor="bg-blue-500"
        />

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-2xl p-2 shadow-sm border border-blue-100 dark:border-blue-900/30">
          <AutoScrollCategoryCarousel
            categories={displayCategories}
            isLoading={categoriesLoading}
            onCategoryAction={handleCategoryAction}
          />

          {displayCategories.length > 0 &&
            displayCategories.some(
              (cat) =>
                "servicesCount" in cat && cat.servicesCount && cat.servicesCount
            ) && (
              <div className="mt-6 pt-6 border-t border-blue-200 dark:border-blue-800/30">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Discover services across{" "}
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {displayCategories.length}
                    </span>{" "}
                    categories
                  </p>
                  <Button
                    onClick={() => router.push("/services/category")}
                    variant="outline"
                    size="sm"
                    className="gap-2 border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-950/30"
                  >
                    Explore All
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
        </div>
      </section>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white dark:bg-gray-950 px-4 text-sm text-gray-500 dark:text-gray-400">
            Featured Services
          </span>
        </div>
      </div>

      {/* Featured Services Section */}
      <FeaturedServicesSection
        isLoading={isInitialServicesLoad}
        router={router}
      />
    </div>
  );
}

interface SectionHeaderProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  accentColor?: string;
}

function SectionHeader({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  accentColor = "bg-primary",
}: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          {icon && (
            <div
              className={`${accentColor} text-white p-2 rounded-lg shadow-sm`}
            >
              {icon}
            </div>
          )}
          <h2 className="text-2xl font-bold dark:text-white tracking-tight text-muted-foreground">
            {title}
          </h2>
        </div>
        {subtitle && (
          <p className="text-base text-gray-600 dark:text-gray-400 pl-14">
            {subtitle}
          </p>
        )}
      </div>

      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          variant="outline"
          className="group gap-2 font-medium shadow-sm hover:shadow"
          size="lg"
        >
          {actionLabel}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      )}
    </div>
  );
}

interface FeaturedServicesSectionProps {
  isLoading: boolean;
  router: ReturnType<typeof useRouter>;
}

function FeaturedServicesSection({
  isLoading,
  router,
}: FeaturedServicesSectionProps) {
  return (
    <section className="space-y-6">
      <SectionHeader
        icon={<Sparkles className="w-6 h-6" />}
        title="Featured Services"
        subtitle="Hand-picked services tailored for you"
        actionLabel="View All Services"
        onAction={() => router.push("/services")}
        accentColor="bg-purple-500"
      />

      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-2xl p-2 shadow-sm border border-purple-100 dark:border-purple-900/30">
        {isLoading ? (
          <ServicesLoadingSkeleton
            count={8}
            gridCols={{
              default: 1,
              md: 2,
              lg: 4,
              xl: 4,
            }}
          />
        ) : (
          <PublicServiceList
            showHeader={false}
            showFilters={false}
            showPagination={false}
            showResultsSummary={false}
            maxItems={8}
            gridCols={{
              default: 1,
              md: 2,
              lg: 4,
              xl: 4,
            }}
            containerClassName="w-full"
            cardVariant="default"
          />
        )}
      </div>
    </section>
  );
}

interface CategoryErrorStateProps {
  error: string;
  onRetry: () => void;
  onViewAll: () => void;
}

function CategoryErrorState({
  error,
  onRetry,
  onViewAll,
}: CategoryErrorStateProps) {
  return (
    <section className="space-y-6">
      <SectionHeader
        icon={<Grid3x3 className="w-6 h-6" />}
        title="Browse by Category"
        subtitle="Explore our curated collection of service categories"
        actionLabel="View All Categories"
        onAction={onViewAll}
        accentColor="bg-blue-500"
      />

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-2xl p-8 shadow-sm border border-blue-100 dark:border-blue-900/30">
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
          <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-full">
            <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Unable to Load Categories
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
              {error}
            </p>
          </div>
          <Button onClick={onRetry} className="gap-2 shadow-sm" size="lg">
            Try Again
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
