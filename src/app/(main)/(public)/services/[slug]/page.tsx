"use client";
import ServiceDetails from "@/components/services/service-details";
// app/(main)/(public)/services/[slug]/page.tsx
import { Home, ToolCase } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function CategoryServicesPage() {
  const params = useParams();
  const serviceSlug = params.slug as string;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link
            href="/"
            className="hover:text-foreground transition-colors flex items-center gap-2"
          >
            <Home size={14} />
            Home
          </Link>
          <span>/</span>
          <Link
            href="/services"
            className="hover:text-foreground transition-colors flex items-center gap-2"
          >
            <ToolCase size={14} />
            services
          </Link>
          <span>/</span>
          <span className="hover:text-foreground transition-colors">
            {serviceSlug}
          </span>
        </nav>
      </div>
      <main className="min-h-[90vh] w-full">
        <section>
          <h2 className="text-2xl font-semibold mb-4">{serviceSlug} Service</h2>
          <ServiceDetails />
        </section>
      </main>
    </div>
  );
}
