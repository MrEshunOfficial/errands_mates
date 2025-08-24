// components/layouts/BaseLayout.tsx
import type { ReactNode } from "react";

interface BaseLayoutProps {
  children: ReactNode;
  maxWidth?: string;
  background?: string;
}

export default function BaseLayout({
  children,
  maxWidth = "max-w-screen",
  background = "bg-white dark:bg-black",
}: BaseLayoutProps) {
  return (
    <div
      className={`flex min-h-screen w-full items-center justify-center ${background}`}
    >
      <main className={`w-full ${maxWidth}`}>{children}</main>
    </div>
  );
}
