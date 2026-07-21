"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, Cloud, Database, ShieldAlert, ShieldCheck, Activity, HardDrive, Clock, Search, Network } from "lucide-react";
import { InfrastructureReport } from "@/lib/infrastructure";
import { ArchitectureDiagram } from "./architecture-diagram";

export function InfrastructureDashboard({ databaseId }: { databaseId: string }) {
  const [report, setReport] = useState<InfrastructureReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/databases/${databaseId}/infrastructure`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to generate infrastructure report");
        return res.json();
      })
      .then(data => {
        setReport(data);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, [databaseId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border border-dashed rounded-xl">
        <Search className="w-8 h-8 animate-pulse text-primary mb-4" />
        <span className="text-muted-foreground font-medium">Running Cloud Detective Probes...</span>
        <span className="text-xs text-muted-foreground mt-2">Analyzing metadata and connection properties</span>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg">
        Failed to generate report: {error}
      </div>
    );
  }

  // Calculate Health Score
  let score = 100;
  let grade = "A";
  if (report.security.hasRootRemoteLogin) score -= 30;
  if (report.security.hasAnonymousUsers) score -= 20;
  if (report.security.publicEndpoint) score -= 10;
  if (report.sslStatus !== "Enabled") score -= 20;
  if (report.bufferPoolSizeMB < 128) score -= 10; // tiny buffer pool

  if (score >= 90) grade = "A";
  else if (score >= 80) grade = "B";
  else if (score >= 70) grade = "C";
  else if (score >= 60) grade = "D";
  else grade = "F";

  return (
    <div className="space-y-8">
      {/* Top Level Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardDescription>Cloud Provider</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Cloud className="w-5 h-5 text-blue-400" />
              {report.cloudProvider}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">{report.hostingPlatform}</div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardDescription>Database Engine</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Database className="w-5 h-5 text-orange-400" />
              {report.databaseEngine}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground truncate" title={report.databaseVersion}>{report.databaseVersion}</div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardDescription>Estimated Size</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-green-400" />
              {report.databaseSizeMB.toFixed(2)} MB
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">InnoDB Storage</div>
          </CardContent>
        </Card>

        <Card className="glass-card bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardDescription>Infrastructure Health</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2 text-primary">
              Grade: {grade}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Score: {score}/100</div>
          </CardContent>
        </Card>
      </div>

      {/* Architecture Visual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="w-5 h-5" /> Inferred Architecture
          </CardTitle>
          <CardDescription>Visualized topology based on database metadata and connection properties.</CardDescription>
        </CardHeader>
        <CardContent>
          <ArchitectureDiagram report={report} />
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Security Assessment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" /> Security Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.security.error && (
              <div className="text-sm p-3 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-md">
                {report.security.error}
              </div>
            )}
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Public Endpoint Detection</span>
              {report.security.publicEndpoint ? (
                <Badge variant="destructive">Public IP Detected</Badge>
              ) : (
                <Badge className="bg-green-500/10 text-green-500 border-green-500/20"><ShieldCheck className="w-3 h-3 mr-1" /> Private / Secure</Badge>
              )}
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">SSL / TLS Encryption</span>
              {report.sslStatus === "Enabled" ? (
                <Badge className="bg-green-500/10 text-green-500 border-green-500/20"><ShieldCheck className="w-3 h-3 mr-1" /> Enforced</Badge>
              ) : (
                <Badge variant="destructive">Disabled / Unknown</Badge>
              )}
            </div>
            {!report.security.error && (
              <>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Root Remote Login</span>
                  {report.security.hasRootRemoteLogin ? (
                    <Badge variant="destructive">Exposed</Badge>
                  ) : (
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Secured</Badge>
                  )}
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Anonymous Users</span>
                  {report.security.hasAnonymousUsers ? (
                    <Badge variant="destructive">Detected</Badge>
                  ) : (
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20">None Found</Badge>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Configuration Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" /> Database Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-muted-foreground block text-xs uppercase mb-1">Architecture</span>
                <span className="font-medium">{report.highAvailability}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs uppercase mb-1">Read Replica</span>
                <span className="font-medium">{report.readReplicaDetected ? "Detected" : "None Detected"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs uppercase mb-1">Max Connections</span>
                <span className="font-medium">{report.maxConnections}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs uppercase mb-1">Active Connections</span>
                <span className="font-medium">{report.currentConnections}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs uppercase mb-1">Buffer Pool Size</span>
                <span className="font-medium">{report.bufferPoolSizeMB.toFixed(0)} MB</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs uppercase mb-1">Isolation Level</span>
                <span className="font-medium">{report.isolationLevel}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs uppercase mb-1">Charset</span>
                <span className="font-medium">{report.characterSet}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs uppercase mb-1">Collation</span>
                <span className="font-medium">{report.collation}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
