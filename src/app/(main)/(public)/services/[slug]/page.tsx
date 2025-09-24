// app/(main)/(public)/services/[slug]/page.tsx
import ServicesList from "@/components/public/services/service-slug";
import { Home, ToolCase } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ slug: string }>; // <-- note the Promise
}

export default async function ServiceCategoryPage({ params }: PageProps) {
  const { slug } = await params;

  const category = {
    name: slug.replace(/-/g, " "),
    description: "Category description here",
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link
            href="/"
            className="hover:text-foreground transition-colors flex items-center gap-2">
            <Home size={14} />
            Home
          </Link>
          <span>/</span>
          <Link
            href="/services"
            className="hover:text-foreground transition-colors flex items-center gap-2">
            <ToolCase size={14} />
            services
          </Link>
          <span>/</span>
          <span className="hover:text-foreground transition-colors">
            {slug.replace(/-/g, " ")}
          </span>
        </nav>
      </div>
      <main className="min-h-[90vh] w-full">
        <section className="mb-8">
          <h1 className="text-3xl font-bold capitalize">{category.name}</h1>
          <p className="text-gray-600">{category.description}</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Services</h2>
          <ServicesList slug={slug} />
        </section>
      </main>
    </div>
  );
}
