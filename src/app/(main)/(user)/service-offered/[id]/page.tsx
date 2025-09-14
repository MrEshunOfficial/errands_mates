// app/admin/services/[id]/page.tsx
import React from "react";

interface PageProps {
  params: { id: string };
}

export default function ServicePage({ params }: PageProps) {
  return (
    <div>
      <h1>Service ID: {params.id}</h1>
    </div>
  );
}
