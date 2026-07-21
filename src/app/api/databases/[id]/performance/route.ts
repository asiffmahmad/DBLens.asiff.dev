import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPerformanceMetrics } from "@/lib/performance-engine";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await prisma.databaseConnection.findUnique({ where: { id } });

    if (!db || !db.jdbcUrl) {
      return NextResponse.json({ error: "Database not found or missing connection URL" }, { status: 404 });
    }

    const metrics = await getPerformanceMetrics(db.jdbcUrl);

    if (metrics.error) {
      return NextResponse.json({ error: metrics.error }, { status: 400 });
    }

    return NextResponse.json(metrics);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
