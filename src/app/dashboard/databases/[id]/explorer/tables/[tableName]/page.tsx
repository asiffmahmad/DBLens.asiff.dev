import { prisma } from "@/lib/prisma";
import { DatabaseSchema, TableSchema } from "@/lib/introspection";
import { calculateImpactRadius } from "@/lib/dependency-engine";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Key, Table2, Network, Eye, Zap, Database } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function TableDetailsPage({
  params,
}: {
  params: Promise<{ id: string; tableName: string }>;
}) {
  const { id, tableName } = await params;
  const decodedTableName = decodeURIComponent(tableName);

  const db = await prisma.databaseConnection.findUnique({
    where: { id },
    include: {
      snapshots: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!db || db.snapshots.length === 0) {
    redirect(`/dashboard/databases/${id}`);
  }

  const latestSnapshot = db.snapshots[0];
  let schema: DatabaseSchema | null = null;
  let table: TableSchema | undefined;

  try {
    schema = JSON.parse(latestSnapshot.schemaPayload);
    table = schema?.tables.find((t) => t.name === decodedTableName);
  } catch (e) {
    console.error("Failed to parse schema");
  }

  if (!table || !schema) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Table not found in the latest snapshot.
      </div>
    );
  }

  const impact = calculateImpactRadius(schema, decodedTableName);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Table2 className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{table.name}</h1>
        </div>
        {table.engine && (
          <div className="mt-4 flex items-center space-x-2 text-sm text-muted-foreground">
            <span>Engine:</span>
            <Badge variant="secondary" className="font-mono">{table.engine}</Badge>
          </div>
        )}
      </div>

      <Tabs defaultValue="structure" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="structure">Structure</TabsTrigger>
          <TabsTrigger value="impact" className="relative">
            Impact Radius
            {impact.totalDependencies > 0 && (
              <Badge variant="destructive" className="ml-2 w-5 h-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                {impact.totalDependencies}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="structure" className="space-y-8 mt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Columns</h3>
            <div className="rounded-md border bg-card/50 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Attributes</th>
                    <th className="px-4 py-3 font-medium">Default</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {table.columns.map((col) => (
                    <tr key={col.name} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-medium flex items-center space-x-2">
                        {col.isPrimary && <Key className="w-4 h-4 text-amber-500 shrink-0" />}
                        <span>{col.name}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">{col.type}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {col.isPrimary && <Badge variant="outline" className="text-amber-500 border-amber-500/20">PK</Badge>}
                          {!col.nullable && <Badge variant="outline" className="text-blue-500 border-blue-500/20">NOT NULL</Badge>}
                          {col.isAutoIncrement && <Badge variant="outline" className="text-purple-500 border-purple-500/20">AUTO_INC</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">
                        {col.defaultValue !== null ? col.defaultValue : col.nullable ? "NULL" : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {table.foreignKeys.length > 0 && (
            <div className="space-y-4 mt-8">
              <h3 className="text-lg font-semibold border-b pb-2">Foreign Keys</h3>
              <div className="rounded-md border bg-card/50 overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Constraint</th>
                      <th className="px-4 py-3 font-medium">Column</th>
                      <th className="px-4 py-3 font-medium">References</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {table.foreignKeys.map((fk) => (
                      <tr key={fk.name} className="hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-muted-foreground">{fk.name}</td>
                        <td className="px-4 py-3 font-medium">{fk.column}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary">{fk.referencedTable}</Badge>
                            <span className="text-muted-foreground">.</span>
                            <span className="font-mono text-muted-foreground">{fk.referencedColumn}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {table.indexes.length > 0 && (
            <div className="space-y-4 mt-8">
              <h3 className="text-lg font-semibold border-b pb-2">Indexes</h3>
              <div className="rounded-md border bg-card/50 overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Columns</th>
                      <th className="px-4 py-3 font-medium">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {table.indexes.map((idx) => (
                      <tr key={idx.name} className="hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-muted-foreground">{idx.name}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {idx.columns.map((col) => (
                              <Badge key={col} variant="outline">{col}</Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {idx.isUnique ? (
                            <Badge variant="outline" className="text-green-500 border-green-500/20">UNIQUE</Badge>
                          ) : (
                            <span className="text-muted-foreground">INDEX</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="impact" className="space-y-8 mt-6">
          <div className="bg-orange-500/10 border border-orange-500/20 text-orange-500 p-4 rounded-xl flex gap-3">
            <Network className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold">Dependency Map</h4>
              <p className="text-sm opacity-90 mt-1">
                Before altering or dropping <strong>{table.name}</strong>, review these dependencies. 
                {impact.totalDependencies === 0 ? " This table has no known downstream dependencies." : ` There are ${impact.totalDependencies} downstream objects that may break if this table is modified.`}
              </p>
            </div>
          </div>

          {impact.referencingTables.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Table2 className="w-4 h-4 text-primary" /> Dependent Tables (FKs)</h3>
              <div className="grid gap-3">
                {impact.referencingTables.map(t => (
                  <div key={t.fkName} className="glass-card border border-border p-4 rounded-lg flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{t.table}</h4>
                      <p className="text-xs text-muted-foreground mt-1">Constraint: <span className="font-mono text-primary/70">{t.fkName}</span></p>
                    </div>
                    <Badge variant="outline" className="font-mono">{t.column} → {table?.name}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {impact.dependentViews.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Eye className="w-4 h-4 text-primary" /> Dependent Views</h3>
              <div className="grid gap-3">
                {impact.dependentViews.map(v => (
                  <div key={v.name} className="glass-card border border-border p-4 rounded-lg">
                    <h4 className="font-medium">{v.name}</h4>
                  </div>
                ))}
              </div>
            </div>
          )}

          {impact.dependentRoutines.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Database className="w-4 h-4 text-primary" /> Dependent Routines</h3>
              <div className="grid gap-3">
                {impact.dependentRoutines.map(r => (
                  <div key={r.name} className="glass-card border border-border p-4 rounded-lg flex justify-between items-center">
                    <h4 className="font-medium">{r.name}</h4>
                    <Badge variant="secondary">{r.type}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {impact.dependentTriggers.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Zap className="w-4 h-4 text-primary" /> Dependent Triggers</h3>
              <div className="grid gap-3">
                {impact.dependentTriggers.map(t => (
                  <div key={t.name} className="glass-card border border-border p-4 rounded-lg flex justify-between items-center">
                    <h4 className="font-medium">{t.name}</h4>
                    <Badge variant="secondary">{t.event} {t.timing}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
