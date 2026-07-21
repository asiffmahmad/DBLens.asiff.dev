"use client";

import { useState } from "react";
import { Play, AlertCircle, TerminalSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function PlaygroundClient({ databaseId }: { databaseId: string }) {
  const [query, setQuery] = useState("SELECT * FROM information_schema.tables LIMIT 10;");
  const [results, setResults] = useState<{rows: any[], fields: any[]}|null>(null);
  const [error, setError] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);

  const executeQuery = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    setResults(null);
    
    try {
      const res = await fetch(`/api/databases/${databaseId}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to execute query");
      }
      
      setResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-4">
      {/* Editor Area */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col shrink-0 h-64">
        <div className="bg-muted/50 border-b border-border px-4 py-2 flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <TerminalSquare className="w-4 h-4" />
            Query Editor
          </div>
          <Button size="sm" onClick={executeQuery} disabled={loading} className="gap-2">
            <Play className="w-4 h-4" />
            {loading ? "Running..." : "Run Query"}
          </Button>
        </div>
        <textarea 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 w-full p-4 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm resize-none focus:outline-none"
          placeholder="Enter SELECT query here..."
          spellCheck={false}
        />
      </div>

      {/* Results Area */}
      {error && (
        <Alert variant="destructive" className="shrink-0">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Execution Failed</AlertTitle>
          <AlertDescription className="font-mono text-sm mt-2">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {results && (
        <div className="flex-1 flex flex-col min-h-0 rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="bg-muted/50 border-b border-border px-4 py-2 text-sm font-medium text-muted-foreground">
            Results ({results.rows.length} rows)
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar">
            {results.rows.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">Query returned 0 rows.</div>
            ) : (
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-background sticky top-0 z-10 border-b border-border shadow-sm">
                  <tr>
                    {results.fields.map((f, i) => (
                      <th key={i} className="px-4 py-3 font-medium text-muted-foreground">
                        {f.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {results.rows.map((row, i) => (
                    <tr key={i} className="hover:bg-muted/30">
                      {results.fields.map((f, j) => (
                        <td key={j} className="px-4 py-2 font-mono text-xs truncate max-w-[300px]">
                          {row[f.name] === null ? (
                            <span className="text-muted-foreground/50 italic">NULL</span>
                          ) : typeof row[f.name] === 'object' ? (
                            JSON.stringify(row[f.name])
                          ) : (
                            String(row[f.name])
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
