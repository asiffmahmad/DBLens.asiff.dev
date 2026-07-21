import { prisma } from "@/lib/prisma";
import { ERViewer } from "./er-viewer";
import { DatabaseSchema } from "@/lib/introspection";
import { Camera } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default async function DiagramPage({
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
        take: 1, // Get the latest snapshot to render the ER diagram
      },
    },
  });

  if (!db) return null;

  const latestSnapshot = db.snapshots[0];
  let schema: DatabaseSchema | null = null;

  if (latestSnapshot && latestSnapshot.schemaPayload) {
    try {
      schema = JSON.parse(latestSnapshot.schemaPayload);
    } catch (e) {
      console.error("Failed to parse schema");
    }
  }

  if (!schema) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
        <Card className="bg-card/30 border-dashed max-w-lg">
          <CardContent className="p-12 text-center text-muted-foreground flex flex-col items-center">
            <Camera className="w-12 h-12 mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">No Schema Data Available</h3>
            <p>You need to take at least one snapshot of this database from the Overview page to generate an ER Diagram.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-theme(spacing.16))] w-full flex flex-col animate-in fade-in duration-500">
      <div className="p-4 md:p-6 border-b border-border bg-background/95 backdrop-blur z-20 shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">ER Diagram</h1>
        <p className="text-muted-foreground text-sm">
          Interactive Entity-Relationship visualization for {db.name}
        </p>
      </div>
      
      <div className="flex-1 w-full bg-muted/20 relative">
        <ERViewer schema={schema} />
      </div>
    </div>
  );
}
