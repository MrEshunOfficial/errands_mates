import { notFound } from "next/navigation";
import Link from "next/link";
import PublicCategoryDetailsComponent from "@/components/categories/PublicCategoryDetailsComponent";
interface PageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: {
    tab?: string;
    view?: string;
    search?: string;
  };
}

export default async function CategoryDetailPage({ params }: PageProps) {
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

  return (
    <div className="min-h-screen container mx-auto px-4 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link
            href="/admin/services"
            className="hover:text-foreground transition-colors"
          >
            Services
          </Link>
          <span>/</span>
          <Link
            href="/admin/services/categories"
            className="hover:text-foreground transition-colors"
          >
            Categories
          </Link>
          <span>/</span>
          <span className="text-foreground">Details</span>
        </nav>
      </div>

      {/* Category Details Component */}
      <PublicCategoryDetailsComponent className="max-w-none" />
    </div>
  );
}
