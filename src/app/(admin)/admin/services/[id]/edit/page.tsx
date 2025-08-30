// app/admin/services/[id]/page.tsx
import React from "react";

interface PageProps {
  params: { id: string };
}

export default function EditServicePage({ params }: PageProps) {
  return (
    <div>
      <h1>Service Edit ID: {params.id}</h1>
    </div>
  );
}
