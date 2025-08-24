//(auth)/signup/page.tsx
import FeaturedCarousel from "@/components/auth/featured/FeaturedCarousel";
import { BaseAuthForm } from "@/components/auth/featured/shared/SharedAuthComponents";
import React from "react";

export default function Page() {
  return (
    <section className="container mx-auto max-w-8xl h-screen flex items-center py-2 justify-center flex-wrap">
      <aside className="w-1/3 h-full overflow-y-auto flex flex-col items-center justify-center">
        <BaseAuthForm mode="register" defaultMethod="email" />
      </aside>
      <article className="w-2/3 h-full overflow-y-auto flex items-center justify-center p-2 hide-scrollbar">
        <FeaturedCarousel />
      </article>
    </section>
  );
}
