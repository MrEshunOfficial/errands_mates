// app/(main)/layout.tsx
import MainHeader from "@/components/headerUi/MainHeader";
import BaseLayout from "@/components/layout/BaseLayout";
import type { ReactNode } from "react";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <BaseLayout maxWidth="container">
      {/* Main container with full height and minimal spacing */}
      <div className="min-h-screen flex flex-col p-2">
        {/* Header - positioned at the top */}
        <MainHeader />

        {/* Main content area - takes remaining height with minimal padding */}
        <main className="flex-1 p-2 border rounded-2xl">
          <>{children}</>
        </main>
      </div>
    </BaseLayout>
  );
}
