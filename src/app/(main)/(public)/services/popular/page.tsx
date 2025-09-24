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
            className="hover:text-foreground transition-colors flex items-center gap-2">
            <Home size={14} />
            Home
          </Link>
          <span>/</span>
          <Link
            href="/services"
            className="hover:text-foreground transition-colors flex items-center gap-2">
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
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp size={28} className="text-blue-600" />
            <h1 className="text-3xl font-bold">Popular Services</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Discover the most sought-after services on our platform. These
            services have been highly rated and frequently booked by our
            community.
          </p>
        </section>

        <section>
          <PopularServices limit={20} showTitle={false} className="w-full" />
        </section>

        {/* Optional: Add some stats or additional info */}
        <section className="mt-12 rounded-lg p-6 border">
          <h3 className="text-xl font-semibold mb-3">
            Why These Services Are Popular
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <span>High customer satisfaction ratings</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <span>Frequently booked and recommended</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <span>Trusted service providers</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
