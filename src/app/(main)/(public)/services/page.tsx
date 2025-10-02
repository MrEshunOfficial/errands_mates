import React from "react";
import Link from "next/link";
import { Home } from "lucide-react";
import PublicServiceList from "@/components/services/service-list";

export default function PublicServicePage() {
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
          <span className="hover:text-foreground transition-colors">
            Services
          </span>
        </nav>
      </div>
      <main className="min-h-[90vh] w-full">
        <PublicServiceList />
      </main>
    </div>
  );
}
