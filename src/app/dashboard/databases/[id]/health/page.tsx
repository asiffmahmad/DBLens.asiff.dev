import { HealthClient } from "./health-client";

export default async function HealthPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 h-full overflow-y-auto animate-in fade-in duration-500 custom-scrollbar">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Schema Health</h1>
        <p className="text-muted-foreground mt-2">
          Automated analysis of missing indexes, redundant foreign keys, and schema quality.
        </p>
      </div>

      <HealthClient databaseId={id} />
    </div>
  );
}
