import { prisma } from "@/lib/prisma";
import { formatDistanceToNow, format } from "date-fns";
import { History, CheckCircle2, Clock, Trash2, Camera } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function SchemaHistoryPage({
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
      },
    },
  });

  if (!db) return null;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schema History</h1>
          <p className="text-muted-foreground mt-2">
            View the timeline of snapshots and schema changes for {db.name}.
          </p>
        </div>
        <Badge variant="secondary" className="gap-2 px-3 py-1">
          <History className="w-4 h-4" /> {db.snapshots.length} Snapshots
        </Badge>
      </div>

      {db.snapshots.length === 0 ? (
        <div className="text-center p-12 text-muted-foreground border border-dashed rounded-xl bg-card/30">
          <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-foreground mb-2">No History Yet</h3>
          <p>Take a snapshot from the Overview page to start tracking changes.</p>
        </div>
      ) : (
        <div className="relative border-l-2 border-border ml-4 space-y-12 pb-12 mt-8">
          {db.snapshots.map((snapshot, i) => {
            let stats = { tables: 0 };
            try {
              if (snapshot.schemaPayload) {
                stats.tables = JSON.parse(snapshot.schemaPayload).tables.length;
              }
            } catch (e) {}

            return (
              <div key={snapshot.id} className="relative pl-8 group">
                {/* Timeline Dot */}
                <div className="absolute -left-[11px] top-1.5 w-5 h-5 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
                
                <div className="glass-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold">{snapshot.label || "Manual Snapshot"}</h3>
                        {i === 0 && <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">Latest</Badge>}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground gap-4">
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {formatDistanceToNow(new Date(snapshot.createdAt), { addSuffix: true })}</span>
                        <span>{format(new Date(snapshot.createdAt), "MMM d, yyyy HH:mm:ss")}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* For now, just a visual button. Real delete needs a client component or server action */}
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-500/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="bg-muted/30 p-3 rounded-lg border border-border/50 grid grid-cols-2 gap-4 text-sm mt-4">
                    <div>
                      <span className="text-muted-foreground block mb-1">Status</span>
                      <span className="flex items-center text-green-500 gap-1"><CheckCircle2 className="w-4 h-4" /> Success</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-1">Total Tables</span>
                      <span className="font-semibold text-foreground">{stats.tables}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground block mb-1">Checksum (SHA-256)</span>
                      <span className="font-mono text-xs text-foreground bg-background p-1.5 rounded block border border-border truncate">{snapshot.checksum}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
