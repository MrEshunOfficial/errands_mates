// app/profile/layout.tsx
import type { ReactNode } from "react";
import ProfileNavigation from "@/components/layout/profile-layout";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full flex">
      {/* Sidebar */}
      <ProfileNavigation />
      {/* Main Content */}
      <main className="flex-1 p-2 flex items-center justify-center">
        {children}
      </main>
    </div>
  );
}
