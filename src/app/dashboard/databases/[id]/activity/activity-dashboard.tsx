"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Activity, Server, Clock, DatabaseZap, HardDrive } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ActivityMetrics } from "@/lib/activity";

type ChartData = {
  time: string;
  qps: number;
  reads: number;
  writes: number;
  connections: number;
};

export function ActivityDashboard({ databaseId }: { databaseId: string }) {
  const [isPaused, setIsPaused] = useState(false);
  const [metrics, setMetrics] = useState<ActivityMetrics | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [prevMetrics, setPrevMetrics] = useState<ActivityMetrics | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (isPaused) return;

    try {
      const res = await fetch(`/api/databases/${databaseId}/activity`);
      if (!res.ok) throw new Error("Failed to fetch activity");
      const data: ActivityMetrics = await res.json();

      setMetrics(data);

      setPrevMetrics((prev) => {
        if (prev) {
          // Calculate diffs for rate per second (assuming 5s interval)
          const interval = 5;
          const qps = Math.max(0, (data.queriesPerSecond - prev.queriesPerSecond) / interval);
          const rps = Math.max(0, (data.reads - prev.reads) / interval);
          const wps = Math.max(0, (data.writes - prev.writes) / interval);

          setChartData((curr) => {
            const newData = [...curr, {
              time: new Date().toLocaleTimeString(),
              qps: Math.round(qps),
              reads: Math.round(rps),
              writes: Math.round(wps),
              connections: data.activeConnections,
            }];
            if (newData.length > 20) newData.shift();
            return newData;
          });
        }
        return data;
      });

    } catch (e) {
      console.error(e);
    }
  }, [databaseId, isPaused]);

  useEffect(() => {
    fetchMetrics(); // initial fetch
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64 border border-dashed rounded-xl">
        <Activity className="w-8 h-8 animate-pulse text-muted-foreground mr-3" />
        <span className="text-muted-foreground">Connecting to database...</span>
      </div>
    );
  }

  const currentData = chartData[chartData.length - 1] || { qps: 0, reads: 0, writes: 0 };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button 
          variant={isPaused ? "default" : "outline"} 
          size="sm" 
          onClick={() => setIsPaused(!isPaused)}
          className="gap-2"
        >
          {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          {isPaused ? "Resume Updates" : "Pause Updates"}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queries / Sec</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentData.qps}</div>
            <p className="text-xs text-muted-foreground">Average over 5s</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
            <Server className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeConnections}</div>
            <p className="text-xs text-muted-foreground">{metrics.sleepingConnections} sleeping</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Traffic</CardTitle>
            <HardDrive className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics.bytesReceived / 1024 / 1024).toFixed(2)} MB</div>
            <p className="text-xs text-muted-foreground">Received {(metrics.bytesSent / 1024 / 1024).toFixed(2)} MB Sent</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics.uptime / 3600).toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">Since last restart</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live Query Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="time" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a" }}
                  itemStyle={{ color: "#e4e4e7" }}
                />
                <Line type="monotone" dataKey="reads" stroke="#3b82f6" strokeWidth={2} dot={false} name="Reads/s" />
                <Line type="monotone" dataKey="writes" stroke="#f43f5e" strokeWidth={2} dot={false} name="Writes/s" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Running Process List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Command</th>
                  <th className="px-4 py-3 font-medium">Time (s)</th>
                  <th className="px-4 py-3 font-medium">State</th>
                  <th className="px-4 py-3 font-medium">Query</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {metrics.processList.filter(p => p.command !== 'Sleep').map((process) => (
                  <tr key={process.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3 font-mono text-xs">{process.id}</td>
                    <td className="px-4 py-3">{process.user}</td>
                    <td className="px-4 py-3">
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">{process.command}</span>
                    </td>
                    <td className="px-4 py-3">{process.time}</td>
                    <td className="px-4 py-3 text-muted-foreground">{process.state || '-'}</td>
                    <td className="px-4 py-3 font-mono text-xs truncate max-w-xs">{process.info || '-'}</td>
                  </tr>
                ))}
                {metrics.processList.filter(p => p.command !== 'Sleep').length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No active queries running right now.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
