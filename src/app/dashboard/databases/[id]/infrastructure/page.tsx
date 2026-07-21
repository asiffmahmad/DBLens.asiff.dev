import { prisma } from "@/lib/prisma";
import { InfrastructureDashboard } from "./infrastructure-dashboard";
import { Server } from "lucide-react";

export default async function InfrastructurePage({
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
    <div className="p-8 max-w-6xl mx-auto space-y-6 h-full overflow-y-auto animate-in fade-in duration-500">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Server className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Infrastructure Assessment</h1>
          <p className="text-muted-foreground mt-1">Cloud detection, architecture, and security posture for {db.name}</p>
        </div>
      </div>
      
      <InfrastructureDashboard databaseId={db.id} />
    </div>
  );
}
