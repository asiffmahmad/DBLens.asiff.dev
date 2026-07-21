import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchLiveActivity } from "@/lib/activity";

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

    const metrics = await fetchLiveActivity(db.jdbcUrl);
    
    return NextResponse.json(metrics);
  } catch (error: any) {
    console.error("Activity fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
