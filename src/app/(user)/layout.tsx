// app/profile/layout.tsx
import type { ReactNode } from "react";
import Link from "next/link";
import { User, Settings, Shield } from "lucide-react";
import BaseLayout from "@/components/layout/BaseLayout";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <BaseLayout maxWidth="container" background="bg-gray-50 dark:bg-gray-900">
      <div className="flex min-h-screen p-2 w-full">
        {/* Sidebar */}
        <aside className="w-86 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-2 space-y-2">
          <nav className="space-y-1">
            <Link
              href="/profile"
              className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <User className="h-5 w-5" />
              <span>Overview</span>
            </Link>
            <Link
              href="/profile/settings"
              className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Link>
            <Link
              href="/profile/security"
              className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <Shield className="h-5 w-5" />
              <span>Security</span>
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 p-2">{children}</div>
      </div>
    </BaseLayout>
  );
}
