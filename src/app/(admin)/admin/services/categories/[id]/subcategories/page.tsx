interface PageProps {
  params: { id: string };
}

export default function SubCategories({ params }: PageProps) {
  return (
    <div>
      <h1>Category ID sub category: {params.id}</h1>
    </div>
  );
}
