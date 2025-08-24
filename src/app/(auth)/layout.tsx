// app/(auth)/layout.tsx
import BaseLayout from "@/components/layout/BaseLayout";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <BaseLayout maxWidth="container">
      <>{children}</>
    </BaseLayout>
  );
}
