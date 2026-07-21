import { prisma } from "@/lib/prisma";
import { DatabaseSchema, EventSchema } from "@/lib/introspection";
import { redirect } from "next/navigation";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function EventDetailsPage({
  params,
}: {
  params: Promise<{ id: string; eventName: string }>;
}) {
  const { id, eventName } = await params;
  const decodedName = decodeURIComponent(eventName);

  const db = await prisma.databaseConnection.findUnique({
    where: { id },
    include: { snapshots: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  if (!db || db.snapshots.length === 0) redirect(`/dashboard/databases/${id}`);

  let schema: DatabaseSchema | null = null;
  let eventItem: EventSchema | undefined;

  try {
    schema = JSON.parse(db.snapshots[0].schemaPayload);
    eventItem = schema?.events?.find((e) => e.name === decodedName);
  } catch (e) {}

  if (!eventItem) return <div className="p-8 text-center text-muted-foreground">Event not found.</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Clock className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{eventItem.name}</h1>
        </div>
        <div className="mt-4 flex items-center space-x-2">
          {eventItem.status === 'ENABLED' ? (
             <Badge className="bg-green-500/10 text-green-500 border-green-500/20">ENABLED</Badge>
          ) : (
             <Badge variant="destructive">{eventItem.status}</Badge>
          )}
          <Badge variant="outline" className="border-border">Schedule: {eventItem.schedule}</Badge>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">Event Definition (DDL)</h3>
        <div className="rounded-md border bg-card/50 overflow-hidden p-4 overflow-x-auto">
          <pre className="text-sm font-mono text-muted-foreground">{eventItem.definition}</pre>
        </div>
      </div>
    </div>
  );
}
