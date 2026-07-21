import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";
import mysql from "mysql2/promise";
import { z } from "zod";

const connectionSchema = z.object({
  name: z.string().min(1, "Connection name is required"),
  host: z.string().optional(),
  port: z.number().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  databaseName: z.string().optional(),
  jdbcUrl: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = connectionSchema.parse(body);

    let parsedHost = data.host;
    let parsedPort = data.port;
    let parsedUsername = data.username;
    let parsedPassword = data.password;
    let parsedDatabase = data.databaseName;

    // Parse URL if provided
    if (data.jdbcUrl) {
      try {
        const urlString = data.jdbcUrl.replace("jdbc:mysql://", "mysql://");
        const url = new URL(urlString);
        parsedHost = url.hostname;
        parsedPort = parseInt(url.port) || 3306;
        parsedUsername = url.username || undefined;
        parsedPassword = url.password || undefined;
        parsedDatabase = url.pathname.replace("/", "") || undefined;
      } catch (err) {
        return NextResponse.json(
          { error: "Invalid Connection URL format" },
          { status: 400 }
        );
      }
    }

    if (!parsedHost || !parsedUsername) {
      return NextResponse.json(
        { error: "Host and Username are required" },
        { status: 400 }
      );
    }

    // 1. Test the connection
    try {
      const connection = await mysql.createConnection({
        host: parsedHost,
        port: parsedPort,
        user: parsedUsername,
        password: parsedPassword,
        database: parsedDatabase,
        connectTimeout: 5000,
        ssl: { rejectUnauthorized: false } // Required for some cloud DBs like TiDB
      });
      
      // Ping the database
      await connection.ping();
      await connection.end();
    } catch (dbError: any) {
      console.error("Database connection failed:", dbError);
      return NextResponse.json(
        { error: "Failed to connect to database", details: dbError.message },
        { status: 400 }
      );
    }

    // 2. Encrypt the password
    const encryptedPassword = parsedPassword ? encrypt(parsedPassword) : undefined;

    // 3. Save to application database
    const dbConnection = await prisma.databaseConnection.create({
      data: {
        name: data.name,
        host: parsedHost,
        port: parsedPort,
        username: parsedUsername,
        encryptedPassword,
        databaseName: parsedDatabase,
        jdbcUrl: data.jdbcUrl,
      },
    });

    // Don't return the encrypted password to the client
    const { encryptedPassword: _, ...safeConnection } = dbConnection;

    return NextResponse.json(safeConnection, { status: 201 });

  } catch (error: any) {
    console.error("API Error Stack Trace:");
    console.error(error.stack || error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error", details: (error as any).message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const connections = await prisma.databaseConnection.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        host: true,
        port: true,
        databaseName: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    
    return NextResponse.json(connections);
  } catch (error) {
    console.error("Failed to fetch databases:", error);
    return NextResponse.json({ error: "Failed to fetch databases" }, { status: 500 });
  }
}
