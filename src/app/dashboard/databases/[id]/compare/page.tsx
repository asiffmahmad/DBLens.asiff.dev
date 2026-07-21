import { prisma } from "@/lib/prisma";
import { CompareViewer } from "./compare-viewer";

export default async function SchemaComparePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch all snapshots for this database to allow selection
  const db = await prisma.databaseConnection.findUnique({
    where: { id },
    include: {
      snapshots: {
        orderBy: { createdAt: "desc" },
        // Take a reasonable number of recent snapshots
        take: 20, 
      },
    },
  });

  if (!db) return null;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full overflow-y-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Schema Compare</h1>
        <p className="text-muted-foreground mt-2">
          Compare two snapshots to detect structural changes (tables, columns, indexes).
        </p>
      </div>

      <CompareViewer snapshots={db.snapshots} />
    </div>
  );
}
