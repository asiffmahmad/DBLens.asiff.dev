import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateHealthReport } from "@/lib/health-engine";
import { DatabaseSchema } from "@/lib/introspection";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get the latest snapshot to run the health check against
    const db = await prisma.databaseConnection.findUnique({
      where: { id },
      include: {
        snapshots: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!db) {
      return NextResponse.json({ error: "Database not found" }, { status: 404 });
    }

    if (!db.snapshots || db.snapshots.length === 0) {
      return NextResponse.json({ 
        error: "No snapshots available. Please take a snapshot first to generate a health report." 
      }, { status: 400 });
    }

    const latestSnapshot = db.snapshots[0];
    const schema: DatabaseSchema = JSON.parse(latestSnapshot.schemaPayload);

    const report = generateHealthReport(schema);

    return NextResponse.json(report);
  } catch (error: any) {
    console.error("Health Check Error:", error);
    return NextResponse.json(
      { error: "Failed to generate health report", details: error.message },
      { status: 500 }
    );
  }
}
