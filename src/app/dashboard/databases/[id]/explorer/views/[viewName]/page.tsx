import { prisma } from "@/lib/prisma";
import { DatabaseSchema, ViewSchema } from "@/lib/introspection";
import { redirect } from "next/navigation";
import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function ViewDetailsPage({
  params,
}: {
  params: Promise<{ id: string; viewName: string }>;
}) {
  const { id, viewName } = await params;
  const decodedName = decodeURIComponent(viewName);

  const db = await prisma.databaseConnection.findUnique({
    where: { id },
    include: { snapshots: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  if (!db || db.snapshots.length === 0) redirect(`/dashboard/databases/${id}`);

  let schema: DatabaseSchema | null = null;
  let view: ViewSchema | undefined;

  try {
    schema = JSON.parse(db.snapshots[0].schemaPayload);
    view = schema?.views?.find((v) => v.name === decodedName);
  } catch (e) {}

  if (!view) {
    return <div className="p-8 text-center text-muted-foreground">View not found.</div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Eye className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{view.name}</h1>
        </div>
        <div className="mt-4 flex items-center space-x-2">
          {view.updatable ? (
             <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Updatable</Badge>
          ) : (
             <Badge variant="secondary">Read Only</Badge>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">View Definition (DDL)</h3>
        <div className="rounded-md border bg-card/50 overflow-hidden p-4 overflow-x-auto">
          <pre className="text-sm font-mono text-muted-foreground">
            {view.definition}
          </pre>
        </div>
      </div>
    </div>
  );
}
