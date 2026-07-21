import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DatabaseNav } from "./database-nav";

export default async function DatabaseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 1. Fetch DB details
  const db = await prisma.databaseConnection.findUnique({
    where: { id },
  });

  if (!db) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)] overflow-hidden -m-4 md:-m-8">
      {/* Global Left Navigation for Database Modules */}
      <DatabaseNav databaseId={db.id} databaseName={db.name} />

      {/* Main Content Area (renders pages and sub-layouts like explorer) */}
      <div className="flex-1 overflow-hidden relative bg-background flex flex-col">
        {children}
      </div>
    </div>
  );
}
