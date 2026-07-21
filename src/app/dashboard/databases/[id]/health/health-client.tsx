"use client";

import { useEffect, useState } from "react";
import { HealthReport } from "@/lib/health-engine";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Info, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export function HealthClient({ databaseId }: { databaseId: string }) {
  const [report, setReport] = useState<HealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/databases/${databaseId}/health`)
      .then(res => res.json())
      .then(json => {
        if (json.error) throw new Error(json.error);
        setReport(json);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [databaseId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse">Running intelligent schema health diagnostics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto mt-8">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Health Check Failed</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!report) return null;

  const getGradeColor = (grade: string) => {
    switch(grade) {
      case 'A': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'B': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'C': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'D': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'F': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch(severity) {
      case 'high': return <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />;
      case 'medium': return <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />;
      case 'low': return <Info className="w-5 h-5 text-blue-500 shrink-0" />;
      default: return <Info className="w-5 h-5 shrink-0" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="col-span-1 md:col-span-1 glass-card border-border flex flex-col items-center justify-center p-6 text-center">
          <p className="text-sm font-medium text-muted-foreground mb-2">Overall Health</p>
          <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center mb-4 ${getGradeColor(report.grade)}`}>
            <span className="text-5xl font-black">{report.grade}</span>
          </div>
          <p className="text-2xl font-bold">{report.score} / 100</p>
        </Card>

        <div className="col-span-1 md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-card/50">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground mb-1">Tables Missing PKs</p>
              <h3 className="text-3xl font-bold flex items-center gap-3">
                {report.metrics.tablesWithNoPK}
                {report.metrics.tablesWithNoPK === 0 && <CheckCircle2 className="w-6 h-6 text-green-500" />}
              </h3>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground mb-1">Unindexed FKs</p>
              <h3 className="text-3xl font-bold flex items-center gap-3">
                {report.metrics.unindexedForeignKeys}
                {report.metrics.unindexedForeignKeys === 0 && <CheckCircle2 className="w-6 h-6 text-green-500" />}
              </h3>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground mb-1">Heavy Data Types</p>
              <h3 className="text-3xl font-bold flex items-center gap-3">
                {report.metrics.heavyDataTypes}
                {report.metrics.heavyDataTypes === 0 && <CheckCircle2 className="w-6 h-6 text-green-500" />}
              </h3>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Issues List */}
      <Card className="glass-card border-border">
        <CardHeader className="border-b border-border/50 bg-muted/30 pb-4">
          <CardTitle className="text-xl">Actionable Insights</CardTitle>
          <CardDescription>We found {report.issues.length} areas for schema improvement.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {report.issues.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
              <h3 className="text-lg font-medium text-foreground">Perfect Health!</h3>
              <p>Your schema strictly follows all DBLens best practices.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {report.issues.map((issue) => (
                <div key={issue.id} className="p-6 hover:bg-muted/30 transition-colors">
                  <div className="flex gap-4">
                    {getSeverityIcon(issue.severity)}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-lg">{issue.type}</h4>
                          <p className="text-foreground mt-1">{issue.message}</p>
                        </div>
                        <Badge variant="outline" className={`uppercase text-[10px] ${
                          issue.severity === 'high' ? 'text-red-500 border-red-500/30 bg-red-500/10' :
                          issue.severity === 'medium' ? 'text-orange-500 border-orange-500/30 bg-orange-500/10' :
                          'text-blue-500 border-blue-500/30 bg-blue-500/10'
                        }`}>
                          {issue.severity} Priority
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 pt-2">
                        {issue.table && (
                          <Badge variant="secondary" className="font-mono text-xs">Table: {issue.table}</Badge>
                        )}
                        {issue.column && (
                          <Badge variant="secondary" className="font-mono text-xs">Column: {issue.column}</Badge>
                        )}
                      </div>

                      <div className="bg-card rounded-md p-3 border border-border mt-3">
                        <span className="text-xs font-semibold uppercase text-primary mb-1 block">Recommendation</span>
                        <p className="text-sm text-muted-foreground">{issue.suggestion}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
