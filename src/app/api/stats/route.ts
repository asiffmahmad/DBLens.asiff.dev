import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const totalDatabases = await prisma.databaseConnection.count();
    const totalSnapshots = await prisma.schemaSnapshot.count();
    
    // Calculate total tables by looking at the latest snapshot for each DB
    const latestSnapshots = await prisma.schemaSnapshot.groupBy({
      by: ['databaseId'],
      _max: {
        createdAt: true
      }
    });

    let totalTables = 0;
    
    for (const snap of latestSnapshots) {
      const snapshot = await prisma.schemaSnapshot.findFirst({
        where: {
          databaseId: snap.databaseId,
          createdAt: snap._max.createdAt as Date
        },
        select: {
          schemaPayload: true
        }
      });
      
      if (snapshot && snapshot.schemaPayload) {
        try {
          const schema = JSON.parse(snapshot.schemaPayload);
          if (schema.tables && Array.isArray(schema.tables)) {
            totalTables += schema.tables.length;
          }
        } catch (e) {}
      }
    }

    return NextResponse.json({
      totalDatabases,
      totalSnapshots,
      totalTables
    });
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
