import { prisma } from "@/lib/prisma";
import { DatabaseSchema, RoutineSchema } from "@/lib/introspection";
import { redirect } from "next/navigation";
import { FileCode2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function RoutineDetailsPage({
  params,
}: {
  params: Promise<{ id: string; routineName: string }>;
}) {
  const { id, routineName } = await params;
  const decodedName = decodeURIComponent(routineName);

  const db = await prisma.databaseConnection.findUnique({
    where: { id },
    include: { snapshots: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  if (!db || db.snapshots.length === 0) redirect(`/dashboard/databases/${id}`);

  let schema: DatabaseSchema | null = null;
  let routine: RoutineSchema | undefined;

  try {
    schema = JSON.parse(db.snapshots[0].schemaPayload);
    routine = schema?.routines?.find((r) => r.name === decodedName);
  } catch (e) {}

  if (!routine) return <div className="p-8 text-center text-muted-foreground">Routine not found.</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FileCode2 className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{routine.name}</h1>
        </div>
        <div className="mt-4 flex items-center space-x-2">
          <Badge variant="outline" className="text-primary border-primary/20">{routine.type}</Badge>
          {routine.returnType && <Badge variant="secondary">Returns {routine.returnType}</Badge>}
        </div>
      </div>

      {routine.parameters && routine.parameters.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Parameters</h3>
          <div className="rounded-md border bg-card/50 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Mode</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {routine.parameters.map((p, i) => (
                  <tr key={i} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3"><Badge variant="outline">{p.mode}</Badge></td>
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">{p.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">Routine Definition (DDL)</h3>
        <div className="rounded-md border bg-card/50 overflow-hidden p-4 overflow-x-auto">
          <pre className="text-sm font-mono text-muted-foreground">{routine.definition}</pre>
        </div>
      </div>
    </div>
  );
}
