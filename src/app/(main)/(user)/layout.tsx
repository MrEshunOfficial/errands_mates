"use client";

import type { ReactNode } from "react";
import ProfileNavigation from "@/components/layout/profile-layout";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex space-x-2 gap-2">
      <ProfileNavigation />
      <main className="flex-1 p-2">{children}</main>
    </div>
  );
}
