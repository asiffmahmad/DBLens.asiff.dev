import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const db = await prisma.databaseConnection.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        host: true,
        port: true,
        databaseName: true,
        createdAt: true,
      }
    });

    if (!db) {
      return NextResponse.json({ error: "Database not found" }, { status: 404 });
    }

    return NextResponse.json(db);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch database", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await prisma.databaseConnection.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete database", details: error.message },
      { status: 500 }
    );
  }
}
