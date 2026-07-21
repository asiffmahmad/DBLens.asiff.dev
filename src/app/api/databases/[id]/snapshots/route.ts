import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { introspectDatabase, generateSchemaChecksum } from "@/lib/introspection";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const label = body.label || "Manual Snapshot";

    // 1. Fetch database connection details
    const db = await prisma.databaseConnection.findUnique({
      where: { id },
    });

    if (!db) {
      return NextResponse.json({ error: "Database not found" }, { status: 404 });
    }

    if (!db.jdbcUrl) {
      return NextResponse.json({ error: "Missing JDBC URL" }, { status: 400 });
    }

    // 2. Decrypt password and inject into jdbcUrl (if necessary)
    let connectionUrl = db.jdbcUrl;
    // We already stored the JDBC URL with the encrypted password, but wait!
    // The previous implementation stored the jdbcUrl directly during testing, but in production
    // jdbcUrl might have the password stripped if we use host/port.
    // Let's assume jdbcUrl is fully formatted (as saved in the dashboard),
    // BUT we should ideally reconstruct it if we stripped the password.
    // For now, in our initial `api/databases` we saved jdbcUrl as passed by the user.

    // Let's parse the jdbcUrl to reconstruct it with the decrypted password if it exists
    if (db.encryptedPassword) {
      try {
        const decryptedPassword = decrypt(db.encryptedPassword);
        // Note: mysql://user:pass@host:port/dbname
        const urlObj = new URL(connectionUrl.replace('mysql://', 'http://')); // Hack to parse easily
        urlObj.password = encodeURIComponent(decryptedPassword);
        connectionUrl = urlObj.toString().replace('http://', 'mysql://');
      } catch (e) {
        console.error("Failed to decrypt password", e);
      }
    }

    // 3. Introspect the database
    const schema = await introspectDatabase(connectionUrl);
    const schemaPayload = JSON.stringify(schema);
    const checksum = generateSchemaChecksum(schemaPayload);

    // 4. Save the snapshot
    const snapshot = await prisma.schemaSnapshot.create({
      data: {
        databaseId: db.id,
        label,
        checksum,
        schemaPayload,
      },
    });

    // Don't return the huge payload in this response, just metadata
    return NextResponse.json({
      id: snapshot.id,
      label: snapshot.label,
      createdAt: snapshot.createdAt,
      checksum: snapshot.checksum,
    }, { status: 201 });

  } catch (error: any) {
    console.error("Snapshot Error:", error);
    return NextResponse.json(
      { error: "Failed to take snapshot", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = req.nextUrl.searchParams;
    const includeSchema = searchParams.get('includeSchema') === 'true';

    const snapshots = await prisma.schemaSnapshot.findMany({
      where: { databaseId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        label: true,
        createdAt: true,
        checksum: true,
        notes: true,
        // Only include the payload if explicitly requested because it can be huge
        ...(includeSchema && { schemaPayload: true })
      }
    });

    return NextResponse.json(snapshots);
  } catch (error: any) {
    console.error("Fetch Snapshots Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch snapshots", details: error.message },
      { status: 500 }
    );
  }
}
