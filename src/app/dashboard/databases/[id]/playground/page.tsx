import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Terminal } from "lucide-react";
import { PlaygroundClient } from "./playground-client";

export default async function PlaygroundPage({
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
    <div className="p-8 max-w-7xl mx-auto space-y-6 h-full flex flex-col animate-in fade-in duration-500">
      <div className="flex items-center gap-3 border-b border-border pb-4 shrink-0">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Terminal className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SQL Playground</h1>
          <p className="text-muted-foreground mt-1">Execute read-only queries safely across your connected database.</p>
        </div>
      </div>
      
      <PlaygroundClient databaseId={id} />
    </div>
  );
}
