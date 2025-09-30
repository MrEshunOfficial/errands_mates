"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, useAnimation } from "framer-motion";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import {
  Category,
  CategoryDetails,
  CategoryWithServices,
} from "@/types/category.types";
import {
  CategoryCardAction,
  SharedCategoryCard,
} from "@/components/public/SharedCategoryCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface AutoScrollCategoryCarouselProps {
  categories: (Category | CategoryWithServices | CategoryDetails)[];
  isLoading?: boolean;
  autoScrollSpeed?: number; // pixels per second
  onCategoryAction?: (
    action: CategoryCardAction,
    category: Category | CategoryWithServices | CategoryDetails
  ) => void;
}

export function AutoScrollCategoryCarousel({
  categories,
  isLoading = false,
  autoScrollSpeed = 50,
  onCategoryAction,
}: AutoScrollCategoryCarouselProps) {
  const router = useRouter();
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoPlay, setAutoPlay] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Duplicate categories for infinite loop
  const extendedCategories = [...categories, ...categories];

  const handleCategoryAction = useCallback(
    (
      action: CategoryCardAction,
      category: Category | CategoryWithServices | CategoryDetails
    ) => {
      if (onCategoryAction) {
        onCategoryAction(action, category);
        return;
      }

      switch (action) {
        case "view":
        case "explore":
          router.push(`/categories/${category.slug || category._id}`);
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
          console.log(`Action ${action} not implemented`);
      }
    },
    [onCategoryAction, router]
  );

  // Start conveyor belt animation
  const startAutoScroll = useCallback(() => {
    if (!containerRef.current || categories.length === 0) return;

    const containerWidth = containerRef.current.scrollWidth / 2; // half since doubled
    const duration = containerWidth / autoScrollSpeed;

    controls.start({
      x: -containerWidth,
      transition: {
        duration,
        ease: "linear",
        repeat: Infinity,
      },
    });
  }, [controls, autoScrollSpeed, categories]);

  // Stop animation
  const stopAutoScroll = useCallback(() => {
    controls.stop();
  }, [controls]);

  // Initialize and start animation immediately on mount
  useEffect(() => {
    if (categories.length > 0 && !isInitialized) {
      setIsInitialized(true);
      // Use a small timeout to ensure the DOM is ready
      const timer = setTimeout(() => {
        startAutoScroll();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [categories, isInitialized, startAutoScroll]);

  // Handle autoPlay state changes
  useEffect(() => {
    if (!isInitialized) return;

    if (autoPlay) {
      startAutoScroll();
    } else {
      stopAutoScroll();
    }
  }, [autoPlay, isInitialized, startAutoScroll, stopAutoScroll]);

  // Manual navigation → resume autoplay after delay
  const handleNext = () => {
    setAutoPlay(false);
    controls
      .start({
        x: "-=250",
        transition: { duration: 0.6, ease: "easeInOut" },
      })
      .then(() => {
        setTimeout(() => {
          setAutoPlay(true);
        }, 2000);
      });
  };

  const handlePrev = () => {
    setAutoPlay(false);
    controls
      .start({
        x: "+=250",
        transition: { duration: 0.6, ease: "easeInOut" },
      })
      .then(() => {
        setTimeout(() => {
          setAutoPlay(true);
        }, 2000);
      });
  };

  // Toggle play/pause button
  const togglePlay = () => {
    setAutoPlay(!autoPlay);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <CategoryCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (!categories || categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-center">
        <p className="text-gray-500">No categories available</p>
      </div>
    );
  }

  return (
    <div className="w-full relative group overflow-hidden" ref={containerRef}>
      <motion.div
        className="flex gap-4"
        animate={controls}
        style={{ willChange: "transform" }}
      >
        {extendedCategories.map((category, index) => (
          <div
            key={`${category._id}-${index}`}
            className="flex-shrink-0 w-[250px]"
          >
            <SharedCategoryCard
              category={category}
              preset="marketplace"
              onAction={handleCategoryAction}
              config={{
                showDescription: true,
                maxDescriptionLength: 60,
                showRating: false,
                showServiceCount: true,
              }}
              className="h-full border rounded-lg shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-primary/50"
            />
          </div>
        ))}
      </motion.div>

      {/* Navigation buttons */}
      <div className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="icon"
          variant="ghost"
          className="rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg border border-gray-200 dark:border-gray-700 w-10 h-10"
          onClick={handlePrev}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="icon"
          variant="ghost"
          className="rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg border border-gray-200 dark:border-gray-700 w-10 h-10"
          onClick={handleNext}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Play/Pause button */}
      <Button
        size="icon"
        variant="ghost"
        className="absolute top-2 right-2 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg border border-gray-200 dark:border-gray-700 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={togglePlay}
      >
        {autoPlay ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

// Skeleton loader
function CategoryCardSkeleton() {
  return (
    <div className="h-full border rounded-lg shadow-sm p-4 space-y-3">
      <Skeleton className="h-16 w-16 rounded-md" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}
