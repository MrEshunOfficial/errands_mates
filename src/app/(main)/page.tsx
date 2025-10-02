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
import { AlertCircle, ArrowRight, Sparkles } from "lucide-react";
import { useUserService } from "@/hooks/public/services/use-service";
import { AutoScrollCategoryCarousel } from "@/components/categories/CategoryCarousel";

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

  const { isLoading: servicesLoading } = useUserService();

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

  // Services loading state
  if (servicesLoading && !categoriesLoading) {
    return (
      <div className="flex flex-col gap-1">
        {/* Show categories while services load */}
        <section className="w-full border rounded-md p-3">
          <div className="flex items-center justify-between mb-6 group">
            {/* Left side - Title with accent */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
                <div className="relative flex items-center gap-2 bg-background px-3 py-1.5 rounded-lg border border-primary/10">
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                    Service Categories
                  </h2>
                </div>
              </div>
            </div>

            {/* Right side - CTA Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/services/category")}
              className="group/btn relative overflow-hidden bg-gradient-to-r from-primary/5 to-purple-500/5 hover:from-primary/10 hover:to-purple-500/10 border border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
            >
              <span className="relative z-10 flex items-center gap-2 font-medium">
                View All
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
              </span>
              <div className="absolute inset-0 -z-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
            </Button>
          </div>
          <AutoScrollCategoryCarousel
            categories={categories.slice(0, 8)}
            isLoading={categoriesLoading}
            onCategoryAction={handleCategoryAction}
          />
        </section>

        {/* Services Loading Skeleton */}
        <section className="w-full border rounded-md p-2 mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 dark:bg-gray-700 rounded h-28 mb-1"></div>
                <div className="bg-gray-200 dark:bg-gray-700 h-3 rounded w-3/4 mb-0.5"></div>
                <div className="bg-gray-200 dark:bg-gray-700 h-2 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  // Error state for categories
  if (categoriesError) {
    return (
      <div className="flex flex-col gap-1">
        <section className="w-full border rounded-md p-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Service Categories</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/services/category")}
              className="text-sm"
            >
              View All
            </Button>
          </div>
          <div className="flex items-center justify-center h-28 text-center">
            <div className="space-y-2">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
              <p className="text-red-600 font-medium">
                Failed to load categories
              </p>
              <p className="text-sm text-gray-500">{categoriesError}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  clearCategoriesError();
                  fetchParentCategoriesWithServices(3, true);
                }}
              >
                Retry
              </Button>
            </div>
          </div>
        </section>

        <div className="flex mt-2">
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
            containerClassName="w-full border rounded-md p-3"
            cardVariant="default"
          />
        </div>
      </div>
    );
  }

  const displayCategories = categories.slice(0, 8);

  return (
    <div className="flex flex-col gap-1">
      {/* Service Categories Section */}
      <section className="w-full border rounded-md p-3">
        <section className="w-full border rounded-md p-3">
          <ModernSectionHeader
            title="Service Categories"
            subtitle="Discover our wide range of professional services"
          />

          <AutoScrollCategoryCarousel
            categories={displayCategories}
            isLoading={categoriesLoading}
            onCategoryAction={handleCategoryAction}
          />
        </section>

        {displayCategories.length > 0 &&
          displayCategories.some(
            (cat) =>
              "servicesCount" in cat && cat.servicesCount && cat.servicesCount
          ) && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-gray-500">
                Explore services across {displayCategories.length} categories
              </p>
            </div>
          )}
      </section>

      {/* Featured Services Section */}
      <div className="flex mt-2">
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
      </div>
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  showViewAll?: boolean;
  viewAllLink?: string;
  className?: string;
}

export function ModernSectionHeader({
  title,
  subtitle,
  showViewAll = true,
  viewAllLink = "/services/category",
  className = "",
}: SectionHeaderProps) {
  const router = useRouter();

  return (
    <div className={`relative mb-6 ${className}`}>
      {/* Background gradient decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent rounded-2xl blur-3xl -z-10" />

      <div className="flex items-center justify-between gap-4">
        {/* Left side - Title and subtitle */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
            <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 dark:from-gray-100 dark:via-gray-200 dark:to-gray-400 bg-clip-text text-transparent">
              {title}
            </h2>
            <Sparkles className="w-5 h-5 text-primary/60 animate-pulse" />
          </div>

          {subtitle && (
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 ml-3 max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right side - View All button */}
        {showViewAll && (
          <Button
            onClick={() => router.push(viewAllLink)}
            className="group relative overflow-hidden bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-full px-6 py-2.5"
            size="sm"
          >
            {/* Button shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

            <span className="relative flex items-center gap-2 font-medium">
              View All
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </span>
          </Button>
        )}
      </div>

      {/* Bottom decorative line */}
      <div className="mt-4 h-px bg-gradient-to-r from-primary/20 via-primary/40 to-transparent" />
    </div>
  );
}

// // Alternative minimal modern style
// export function MinimalSectionHeader({
//   title,
//   subtitle,
//   showViewAll = true,
//   viewAllLink = "/services/category",
//   className = "",
// }: SectionHeaderProps) {
//   const router = useRouter();

//   return (
//     <div className={`relative mb-5 ${className}`}>
//       <div className="flex items-end justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
//         {/* Left side */}
//         <div className="flex-1 min-w-0">
//           <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
//             {title}
//           </h2>
//           {subtitle && (
//             <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
//               {subtitle}
//             </p>
//           )}
//         </div>

//         {/* Right side */}
//         {showViewAll && (
//           <Button
//             variant="ghost"
//             onClick={() => router.push(viewAllLink)}
//             className="group text-primary hover:text-primary/80 hover:bg-primary/5 transition-all duration-200"
//             size="sm"
//           >
//             <span className="font-medium">View All</span>
//             <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
//           </Button>
//         )}
//       </div>
//     </div>
//   );
// }

// // Alternative glass morphism style
// export function GlassSectionHeader({
//   title,
//   subtitle,
//   showViewAll = true,
//   viewAllLink = "/services/category",
//   className = "",
// }: SectionHeaderProps) {
//   const router = useRouter();

//   return (
//     <div className={`relative mb-6 ${className}`}>
//       <div className="backdrop-blur-xl bg-white/50 dark:bg-gray-900/50 border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-4 shadow-lg">
//         <div className="flex items-center justify-between gap-4">
//           {/* Left side */}
//           <div className="flex-1 min-w-0">
//             <div className="flex items-center gap-3">
//               <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
//                 <Sparkles className="w-5 h-5 text-primary" />
//               </div>
//               <div>
//                 <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
//                   {title}
//                 </h2>
//                 {subtitle && (
//                   <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-0.5">
//                     {subtitle}
//                   </p>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Right side */}
//           {showViewAll && (
//             <Button
//               onClick={() => router.push(viewAllLink)}
//               className="group bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl"
//               size="sm"
//             >
//               <span className="font-medium">View All</span>
//               <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
//             </Button>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
