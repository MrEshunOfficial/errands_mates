// app/(main)/(public)/services/[slug]/page.tsx
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>; // ✅ async params
}

export default async function ServiceCategoryPage({ params }: PageProps) {
  const { slug } = await params; // ✅ must await

  // Placeholder for fetching data (replace with your API/db call)
  const category = {
    name: slug.replace("-", " "),
    description: "Category description here",
  };

  const services: { id: string; title: string; description: string }[] = [
    // Replace with real services fetched by slug
  ];

  if (!category) {
    return notFound();
  }

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Category Header */}
      <section className="mb-8">
        <h1 className="text-3xl font-bold capitalize">{category.name}</h1>
        <p className="text-gray-600">{category.description}</p>
      </section>

      {/* Services List */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Services</h2>
        {services.length === 0 ? (
          <p className="text-gray-500">No services found in this category.</p>
        ) : (
          <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <li
                key={service.id}
                className="border rounded-2xl shadow p-4 hover:shadow-md transition"
              >
                <h3 className="text-xl font-semibold">{service.title}</h3>
                <p className="text-gray-600">{service.description}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
