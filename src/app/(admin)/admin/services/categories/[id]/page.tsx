// app/admin/services/[id]/page.tsx
import React from "react";

interface PageProps {
  params: { id: string };
}

export default function CategoryDetails({ params }: PageProps) {
  return (
    <div>
      <h1>Category ID Details: {params.id}</h1>
    </div>
  );
}
