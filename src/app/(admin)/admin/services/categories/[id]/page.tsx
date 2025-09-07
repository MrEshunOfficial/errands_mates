// app/admin/services/categories/[id]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import CategoryDetailsComponent from "@/components/admin/categories/category-details";

interface PageProps {
  params: {
    id: string;
  };
  searchParams: {
    tab?: string;
    view?: string;
    search?: string;
  };
}

export default function CategoryDetailPage({ params }: PageProps) {
  const { id } = params;
  if (!id || id.length < 10) {
    notFound();
  }

  return (
    <div className="min-h-screen container mx-auto px-4 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link
            href="/admin"
            className="hover:text-foreground transition-colors"
          >
            Admin
          </Link>
          <span>/</span>
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
      <CategoryDetailsComponent className="max-w-none" />
    </div>
  );
}
