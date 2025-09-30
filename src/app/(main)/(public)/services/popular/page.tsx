// app/(main)/(public)/services/popular/page.tsx
import PopularServices from "@/components/public/services/popular-services";
import { Home, ToolCase, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function PopularServicesPage() {
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
            Services
          </Link>
          <span>/</span>
          <span className="hover:text-foreground transition-colors flex items-center gap-2">
            <TrendingUp size={14} />
            Popular
          </span>
        </nav>
      </div>

      <main className="min-h-[90vh] w-full">
        <section>
          <PopularServices
            limit={8}
            title="Trending Services"
            variant="featured"
            autoRefresh={true}
            refreshInterval={300000}
            showViewAllButton={true}
          />
        </section>
      </main>
    </div>
  );
}
