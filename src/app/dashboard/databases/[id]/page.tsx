import { prisma } from "@/lib/prisma";
import { DatabaseSchema } from "@/lib/introspection";
import { SnapshotButton } from "./snapshot-button";
import { DeleteDatabaseButton } from "./delete-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Table2, Layers, Key, ShieldCheck, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default async function DatabaseOverviewPage({
  params,
}: {
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

  if (!db) return null;

  const latestSnapshot = db.snapshots[0];
  let schema: DatabaseSchema | null = null;
  let stats = { tables: 0, columns: 0, indexes: 0, foreignKeys: 0 };

  if (latestSnapshot && latestSnapshot.schemaPayload) {
    try {
      schema = JSON.parse(latestSnapshot.schemaPayload);
      if (schema) {
        stats.tables = schema.tables.length;
        schema.tables.forEach(t => {
          stats.columns += t.columns.length;
          stats.indexes += t.indexes.length;
          stats.foreignKeys += t.foreignKeys.length;
        });
      }
    } catch (e) {
      console.error("Failed to parse schema");
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full overflow-y-auto custom-scrollbar">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{db.name} Overview</h1>
            <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20 gap-1">
              <ShieldCheck className="w-3 h-3" /> Read-Only Access
            </Badge>
          </div>
          <p className="text-muted-foreground mt-2 flex items-center gap-2 font-mono text-sm">
            <span className="bg-muted px-2 py-1 rounded-md">{db.host}:{db.port}</span>
            <span className="bg-muted px-2 py-1 rounded-md">{db.databaseName}</span>
          </p>
          <p className="text-sm text-muted-foreground mt-3 max-w-lg">
            DBLens only scans your database schema metadata. It never modifies your tables or reads your row data.
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <SnapshotButton databaseId={db.id} hasSnapshot={!!latestSnapshot} />
          <DeleteDatabaseButton databaseId={db.id} databaseName={db.name} />
        </div>
      </div>

      {!latestSnapshot ? (
        <div className="border border-dashed border-border rounded-xl p-12 text-center flex flex-col items-center justify-center bg-card/30 backdrop-blur-sm mt-12">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Database className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-2xl font-semibold mb-3">No Schema Data Yet</h3>
          <p className="text-muted-foreground max-w-md mb-8">
            Take a snapshot to introspect the database. We will securely scan your database's information schema to map out all tables, columns, and relationships without reading your actual row data.
          </p>
        </div>
      ) : (
        <>
          <div className="text-sm text-muted-foreground flex items-center gap-2 bg-primary/5 p-3 rounded-lg border border-primary/10">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Last synced: <span className="font-medium text-foreground">{formatDistanceToNow(new Date(latestSnapshot.createdAt), { addSuffix: true })}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tables</CardTitle>
                <Table2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.tables}</div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Columns</CardTitle>
                <Layers className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.columns}</div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Indexes</CardTitle>
                <Key className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.indexes}</div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Foreign Keys</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.foreignKeys}</div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 text-center text-muted-foreground p-12 border border-dashed rounded-xl bg-card/30">
            <h4 className="text-lg font-medium text-foreground mb-2">Explore Your Schema</h4>
            <p className="mb-6">Navigate to the Database Explorer to view detailed table structures, columns, and relationships.</p>
            <Link href={`/dashboard/databases/${db.id}/explorer`}>
              <Button variant="outline" className="gap-2">
                <Search className="w-4 h-4" /> Go to Explorer
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
