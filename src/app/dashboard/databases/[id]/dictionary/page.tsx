import { prisma } from "@/lib/prisma";
import { DatabaseSchema } from "@/lib/introspection";
import { DataDictionary } from "./data-dictionary";
import { FileText } from "lucide-react";
import { redirect } from "next/navigation";

export default async function DictionaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const db = await prisma.databaseConnection.findUnique({
    where: { id },
    include: {
      snapshots: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!db || db.snapshots.length === 0) {
    redirect(`/dashboard/databases/${id}`);
  }

  const latestSnapshot = db.snapshots[0];
  let schema: DatabaseSchema | null = null;

  try {
    schema = JSON.parse(latestSnapshot.schemaPayload);
  } catch (e) {
    console.error("Failed to parse schema");
  }

  if (!schema) {
    return <div className="p-8 text-center text-muted-foreground">Invalid Schema Payload.</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 h-full overflow-y-auto animate-in fade-in duration-500">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <FileText className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Dictionary</h1>
          <p className="text-muted-foreground mt-1">Unified tabular view of all business objects, columns, and properties</p>
        </div>
      </div>
      
      <DataDictionary schema={schema} databaseId={id} />
    </div>
  );
}
