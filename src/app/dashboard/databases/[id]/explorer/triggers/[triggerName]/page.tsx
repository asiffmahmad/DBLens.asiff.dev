import { prisma } from "@/lib/prisma";
import { DatabaseSchema, TriggerSchema } from "@/lib/introspection";
import { redirect } from "next/navigation";
import { Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function TriggerDetailsPage({
  params,
}: {
  params: Promise<{ id: string; triggerName: string }>;
}) {
  const { id, triggerName } = await params;
  const decodedName = decodeURIComponent(triggerName);

  const db = await prisma.databaseConnection.findUnique({
    where: { id },
    include: { snapshots: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  if (!db || db.snapshots.length === 0) redirect(`/dashboard/databases/${id}`);

  let schema: DatabaseSchema | null = null;
  let trigger: TriggerSchema | undefined;

  try {
    schema = JSON.parse(db.snapshots[0].schemaPayload);
    trigger = schema?.triggers?.find((t) => t.name === decodedName);
  } catch (e) {}

  if (!trigger) return <div className="p-8 text-center text-muted-foreground">Trigger not found.</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{trigger.name}</h1>
        </div>
        <div className="mt-4 flex items-center space-x-2">
          <Badge variant="outline" className="border-amber-500/20 text-amber-500">{trigger.timing} {trigger.event}</Badge>
          <span className="text-muted-foreground text-sm">ON</span>
          <Badge variant="secondary">{trigger.table}</Badge>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">Trigger Action (DDL)</h3>
        <div className="rounded-md border bg-card/50 overflow-hidden p-4 overflow-x-auto">
          <pre className="text-sm font-mono text-muted-foreground">{trigger.definition}</pre>
        </div>
      </div>
    </div>
  );
}
