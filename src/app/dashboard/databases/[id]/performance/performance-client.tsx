"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, AlertTriangle, Clock, Zap, Target } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PerformanceMetrics {
  engine: "mysql" | "oracle" | "unknown";
  summary: {
    activeConnections: number;
    uptime: string;
    bufferPoolHitRate?: number;
  };
  slowQueries: Array<{ query: string; executionTimeMs: number; count: number }>;
  waitEvents?: Array<{ event: string; count: number; timeWaitedMs: number }>;
}

export function PerformanceClient({ databaseId }: { databaseId: string }) {
  const [data, setData] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/databases/${databaseId}/performance`)
      .then(res => res.json())
      .then(json => {
        if (json.error) throw new Error(json.error);
        setData(json);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [databaseId]);

  if (loading) return <div className="p-12 text-center text-muted-foreground animate-pulse">Running Deep Engine Diagnostics...</div>;
  if (error) return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Diagnostics Failed</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Database Engine</p>
              <h3 className="text-2xl font-bold uppercase tracking-wider mt-1 flex items-center gap-2">
                {data.engine}
                <Badge variant="outline" className="text-primary border-primary/20">Detected</Badge>
              </h3>
            </div>
            <Database className="w-8 h-8 text-muted-foreground/30" />
          </CardContent>
        </Card>
        
        <Card className="bg-card/50">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Uptime</p>
              <h3 className="text-2xl font-bold mt-1">{data.summary.uptime}</h3>
            </div>
            <Clock className="w-8 h-8 text-blue-500/30" />
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Sessions</p>
              <h3 className="text-2xl font-bold mt-1">{data.summary.activeConnections}</h3>
            </div>
            <Zap className="w-8 h-8 text-amber-500/30" />
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Buffer Cache Hit Rate</p>
              <h3 className="text-2xl font-bold mt-1 text-green-500">{data.summary.bufferPoolHitRate}%</h3>
            </div>
            <Target className="w-8 h-8 text-green-500/30" />
          </CardContent>
        </Card>
      </div>

      {/* Engine Specific Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* MySQL Slow Queries */}
        {data.engine === "mysql" && (
          <Card className="col-span-1 lg:col-span-2 border-border/50">
            <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Performance Schema: Top Slow Queries
              </CardTitle>
              <CardDescription>Aggregated from `events_statements_summary_by_digest`</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-background">
                    <tr>
                      <th className="px-4 py-3 font-medium text-muted-foreground w-24">Avg Time</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground w-24">Executions</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">SQL Digest</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.slowQueries.length === 0 ? (
                      <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">No slow queries detected in Performance Schema.</td></tr>
                    ) : data.slowQueries.map((q, i) => (
                      <tr key={i} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-amber-500">{q.executionTimeMs}ms</td>
                        <td className="px-4 py-3 font-mono">{q.count}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground max-w-xl truncate">{q.query}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Oracle ASH Wait Events */}
        {data.engine === "oracle" && (
          <Card className="col-span-1 lg:col-span-2 border-border/50">
            <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                Active Session History (ASH): Top Wait Events
              </CardTitle>
              <CardDescription>Aggregated from `v$active_session_history` over the last 1 hour</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-background">
                    <tr>
                      <th className="px-4 py-3 font-medium text-muted-foreground w-48">Wait Event</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground w-32">Wait Count</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">Total Time Waited (ms)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {!data.waitEvents || data.waitEvents.length === 0 ? (
                      <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">No wait events detected, or Oracle Diagnostics Pack is disabled.</td></tr>
                    ) : data.waitEvents.map((w, i) => (
                      <tr key={i} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium">{w.event}</td>
                        <td className="px-4 py-3 font-mono">{w.count}</td>
                        <td className="px-4 py-3 font-mono text-amber-500">{w.timeWaitedMs}ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
