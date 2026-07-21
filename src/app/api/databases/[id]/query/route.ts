import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import mysql from "mysql2/promise";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // STRICT READ-ONLY VALIDATION
    const upperQuery = query.trim().toUpperCase();
    const isReadOnly = 
      upperQuery.startsWith("SELECT") || 
      upperQuery.startsWith("SHOW") || 
      upperQuery.startsWith("DESCRIBE") || 
      upperQuery.startsWith("EXPLAIN") ||
      upperQuery.startsWith("WITH");

    if (!isReadOnly) {
      return NextResponse.json({ 
        error: "Security Violation: Only read-only queries (SELECT, SHOW, DESCRIBE, EXPLAIN) are allowed in the playground." 
      }, { status: 403 });
    }

    // Look for destructive keywords anywhere in the query to prevent injection like `SELECT 1; DROP TABLE users;`
    const forbiddenPatterns = [
      /\bINSERT\b/i, /\bUPDATE\b/i, /\bDELETE\b/i, /\bDROP\b/i, 
      /\bALTER\b/i, /\bTRUNCATE\b/i, /\bGRANT\b/i, /\bREVOKE\b/i,
      /\bREPLACE\b/i, /\bCALL\b/i, /;/g // Block multiple statements (semicolons) to prevent piggybacking
    ];

    // Remove the first semicolon at the very end of the string if it exists
    const cleanQuery = query.trim().replace(/;$/, "");

    for (const pattern of forbiddenPatterns) {
      if (pattern.test(cleanQuery)) {
        return NextResponse.json({ 
          error: `Security Violation: Destructive or chained queries are strictly prohibited.` 
        }, { status: 403 });
      }
    }

    const db = await prisma.databaseConnection.findUnique({ where: { id } });
    if (!db || !db.jdbcUrl) {
      return NextResponse.json({ error: "Database not found or missing connection URL" }, { status: 404 });
    }

    // TiDB Serverless requires SSL
    const parsedUrl = new URL(db.jdbcUrl.replace('mysql://', 'http://'));
    let finalUrl = db.jdbcUrl;
    if (!parsedUrl.searchParams.has('ssl') && parsedUrl.hostname.includes('tidbcloud.com')) {
      finalUrl += (finalUrl.includes('?') ? '&' : '?') + 'ssl={"rejectUnauthorized":true}';
    }

    const connection = await mysql.createConnection(finalUrl);
    
    try {
      const [rows, fields] = await connection.query(cleanQuery);
      
      return NextResponse.json({ 
        rows, 
        fields: fields ? (fields as any[]).map(f => ({ name: f.name, type: f.type })) : []
      });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    } finally {
      await connection.end();
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
