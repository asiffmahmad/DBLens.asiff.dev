"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { compareSchemas, SchemaChange } from "@/lib/diff-engine";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitCommit, ArrowRight, Table2, Layers, Key, Database, FileDiff } from "lucide-react";
import { cn } from "@/lib/utils";

// Assuming we have basic select components, we'll build simple native selects for now to avoid large dependencies if not installed
export function CompareViewer({ snapshots }: { snapshots: any[] }) {
  // Default to comparing the latest two snapshots if available
  const [sourceId, setSourceId] = useState(snapshots[1]?.id || snapshots[0]?.id || "");
  const [targetId, setTargetId] = useState(snapshots[0]?.id || "");

  const changes = useMemo(() => {
    const sourceSnap = snapshots.find(s => s.id === sourceId);
    const targetSnap = snapshots.find(s => s.id === targetId);
    
    if (!sourceSnap || !targetSnap) return [];
    
    try {
      const oldSchema = JSON.parse(sourceSnap.schemaPayload);
      const newSchema = JSON.parse(targetSnap.schemaPayload);
      return compareSchemas(oldSchema, newSchema);
    } catch (e) {
      console.error("Failed to parse schemas for comparison", e);
      return [];
    }
  }, [sourceId, targetId, snapshots]);

  if (snapshots.length < 2) {
    return (
      <Card className="bg-card/30 border-dashed">
        <CardContent className="p-12 text-center text-muted-foreground flex flex-col items-center">
          <FileDiff className="w-12 h-12 mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2 text-foreground">Need More Snapshots</h3>
          <p>You need at least two snapshots to perform a schema comparison. Go back to the Overview and take another snapshot.</p>
        </CardContent>
      </Card>
    );
  }

  const addedCount = changes.filter(c => c.type === "ADDED").length;
  const removedCount = changes.filter(c => c.type === "REMOVED").length;
  const modifiedCount = changes.filter(c => c.type === "MODIFIED").length;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-xl border border-border">
        <div className="flex-1">
          <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Old Version (Source)</label>
          <select 
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
          >
            {snapshots.map(s => (
              <option key={s.id} value={s.id}>
                {s.label || "Manual Snapshot"} - {format(new Date(s.createdAt), "MMM d, yyyy HH:mm:ss")}
              </option>
            ))}
          </select>
        </div>
        
        <ArrowRight className="w-6 h-6 text-muted-foreground shrink-0 mt-4" />
        
        <div className="flex-1">
          <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">New Version (Target)</label>
          <select 
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
          >
            {snapshots.map(s => (
              <option key={s.id} value={s.id}>
                {s.label || "Manual Snapshot"} - {format(new Date(s.createdAt), "MMM d, yyyy HH:mm:ss")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {sourceId === targetId ? (
        <div className="text-center p-12 text-muted-foreground border border-dashed rounded-xl">
          Select different snapshots to see the diff.
        </div>
      ) : changes.length === 0 ? (
        <div className="text-center p-12 text-muted-foreground border border-dashed rounded-xl flex flex-col items-center">
          <GitCommit className="w-12 h-12 text-green-500/50 mb-4" />
          <p className="text-lg font-medium text-foreground">No schema changes detected</p>
          <p>The schema structure is identical between these two snapshots.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex gap-4 mb-6">
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 px-3 py-1 text-sm gap-2">
              <span className="font-bold">{addedCount}</span> Added
            </Badge>
            <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 px-3 py-1 text-sm gap-2">
              <span className="font-bold">{removedCount}</span> Removed
            </Badge>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-3 py-1 text-sm gap-2">
              <span className="font-bold">{modifiedCount}</span> Modified
            </Badge>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium w-32">Status</th>
                  <th className="px-4 py-3 font-medium w-40">Entity Type</th>
                  <th className="px-4 py-3 font-medium">Table / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {changes.map((change, idx) => (
                  <tr key={idx} className={cn(
                    "transition-colors",
                    change.type === "ADDED" && "bg-green-500/5 hover:bg-green-500/10",
                    change.type === "REMOVED" && "bg-red-500/5 hover:bg-red-500/10",
                    change.type === "MODIFIED" && "bg-amber-500/5 hover:bg-amber-500/10"
                  )}>
                    <td className="px-4 py-3">
                      {change.type === "ADDED" && <Badge variant="outline" className="text-green-500 border-green-500/20 bg-green-500/10">Added</Badge>}
                      {change.type === "REMOVED" && <Badge variant="outline" className="text-red-500 border-red-500/20 bg-red-500/10">Removed</Badge>}
                      {change.type === "MODIFIED" && <Badge variant="outline" className="text-amber-500 border-amber-500/20 bg-amber-500/10">Modified</Badge>}
                    </td>
                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                      {change.entityType === "TABLE" && <Table2 className="w-4 h-4 opacity-50" />}
                      {change.entityType === "COLUMN" && <Layers className="w-4 h-4 opacity-50" />}
                      {change.entityType === "INDEX" && <Key className="w-4 h-4 opacity-50" />}
                      {change.entityType === "FOREIGN_KEY" && <Database className="w-4 h-4 opacity-50" />}
                      <span className="capitalize">{change.entityType.toLowerCase().replace('_', ' ')}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold">{change.tableName} {change.entityType !== "TABLE" && `> ${change.entityName}`}</div>
                      {change.details && <div className="text-xs text-muted-foreground mt-1 font-mono bg-background/50 p-1 rounded inline-block">{change.details}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
