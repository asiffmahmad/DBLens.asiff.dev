import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateInfrastructureReport } from "@/lib/infrastructure";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await prisma.databaseConnection.findUnique({
      where: { id },
    });

    if (!db || !db.jdbcUrl) {
      return NextResponse.json({ error: "Database not found or missing URL" }, { status: 404 });
    }

    const report = await generateInfrastructureReport(db.jdbcUrl);
    
    return NextResponse.json(report);
  } catch (error: any) {
    console.error("Infrastructure fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
