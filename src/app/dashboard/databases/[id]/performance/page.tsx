import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ActivitySquare } from "lucide-react";
import { PerformanceClient } from "./performance-client";

export default async function PerformancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const db = await prisma.databaseConnection.findUnique({
    where: { id },
  });

  if (!db) {
    redirect("/dashboard");
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 h-full overflow-y-auto animate-in fade-in duration-500 custom-scrollbar">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <ActivitySquare className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Reports</h1>
          <p className="text-muted-foreground mt-1">Deep engine-aware analytics (AWR, ASH, Performance Schema)</p>
        </div>
      </div>
      
      <PerformanceClient databaseId={id} />
    </div>
  );
}
