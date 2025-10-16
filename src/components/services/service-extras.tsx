import { Card, CardHeader, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

export const ServiceDetailsSkeleton = () => {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-24" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <div className="p-4 space-y-3">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
};

interface ServicesLoadingSkeletonProps {
  count?: number;
  gridCols?: {
    default?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  containerClassName?: string;
}

export const ServicesLoadingSkeleton: React.FC<
  ServicesLoadingSkeletonProps
> = ({
  count = 8,
  gridCols = {
    default: 1,
    md: 2,
    lg: 4,
    xl: 4,
  },
  containerClassName = "w-full",
}) => {
  return (
    <section className={`border rounded-md p-3 ${containerClassName}`}>
      <div
        className={`grid gap-4 grid-cols-${
          gridCols.default || 1
        } md:grid-cols-${gridCols.md || 2} lg:grid-cols-${
          gridCols.lg || 4
        } xl:grid-cols-${gridCols.xl || 4}`}
      >
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="border rounded-lg p-4 space-y-3 bg-white dark:bg-gray-800"
          >
            {/* Image skeleton */}
            <Skeleton className="w-full h-48 rounded-lg" />

            {/* Title skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>

            {/* Description skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-4/5" />
            </div>

            {/* Footer skeleton */}
            <div className="flex items-center justify-between pt-2 border-t">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
