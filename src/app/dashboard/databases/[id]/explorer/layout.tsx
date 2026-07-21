import { prisma } from "@/lib/prisma";
import { DatabaseSchema } from "@/lib/introspection";
import { ExplorerSidebar } from "./explorer-sidebar";

export default async function ExplorerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
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

  const latestSnapshot = db?.snapshots[0];
  let schema: DatabaseSchema | null = null;
  
  if (latestSnapshot && latestSnapshot.schemaPayload) {
    try {
      schema = JSON.parse(latestSnapshot.schemaPayload);
    } catch (e) {
      console.error("Failed to parse schema payload");
    }
  }

  return (
    <div className="flex flex-col md:flex-row h-full w-full">
      <ExplorerSidebar databaseId={id} schema={schema} />

      {/* Main Content Area for Details */}
      <div className="flex-1 overflow-y-auto relative bg-background">
        {children}
      </div>
    </div>
  );
}
