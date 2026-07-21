import { prisma } from "@/lib/prisma";
import { ActivityDashboard } from "./activity-dashboard";

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const db = await prisma.databaseConnection.findUnique({
    where: { id },
  });

  if (!db) return null;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activity Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Live metrics and running queries for {db.name}</p>
        </div>
      </div>
      
      <ActivityDashboard databaseId={db.id} />
    </div>
  );
}
