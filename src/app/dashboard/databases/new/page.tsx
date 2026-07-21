"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Database, Link2, Shield, ArrowRight, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function NewDatabasePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [host, setHost] = useState("");
  const [port, setPort] = useState(3306);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [databaseName, setDatabaseName] = useState("");
  const [jdbcUrl, setJdbcUrl] = useState("");

  const [useUrl, setUseUrl] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const payload = useUrl 
        ? { name, jdbcUrl } 
        : { name, host, port: Number(port), username, password, databaseName };

      const res = await fetch("/api/databases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.details || "Failed to connect");
      }

      // Success
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Connection</h1>
        <p className="text-muted-foreground mt-1">
          Connect to a new MySQL database to start exploring its schema.
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 rounded-2xl border border-border"
      >
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">MySQL Connection</h3>
              <p className="text-sm text-muted-foreground">Standard TCP/IP connection</p>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setUseUrl(!useUrl)}
            className="text-xs"
          >
            <Link2 className="h-4 w-4 mr-2" />
            {useUrl ? "Use Form Fields" : "Use URL String"}
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex gap-3 text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Connection Name</label>
            <input 
              type="text" 
              placeholder="e.g. Production DB" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background/50 px-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              required
            />
          </div>

          {useUrl ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">Connection URL</label>
              <input 
                type="text" 
                placeholder="mysql://user:password@host:3306/dbname" 
                value={jdbcUrl}
                onChange={(e) => setJdbcUrl(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background/50 px-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                required
              />
              <p className="text-xs text-muted-foreground">Example: mysql://root:password@localhost:3306/mydb</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-2">
                  <label className="text-sm font-medium">Host</label>
                  <input 
                    type="text" 
                    placeholder="127.0.0.1 or db.example.com"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background/50 px-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Port</label>
                  <input 
                    type="number" 
                    placeholder="3306" 
                    value={port}
                    onChange={(e) => setPort(Number(e.target.value))}
                    className="w-full h-10 rounded-md border border-input bg-background/50 px-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Username</label>
                  <input 
                    type="text" 
                    placeholder="root" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background/50 px-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background/50 px-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Database Name (Optional)</label>
                <input 
                  type="text" 
                  placeholder="my_database"
                  value={databaseName}
                  onChange={(e) => setDatabaseName(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background/50 px-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
            </>
          )}

          <div className="bg-muted/50 rounded-lg p-4 flex gap-3 text-sm text-muted-foreground">
            <Shield className="h-5 w-5 text-primary shrink-0" />
            <p>
              Your credentials are encrypted at rest using AES-256-GCM. 
              DBLens only reads your database metadata and never modifies your data.
            </p>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? "Testing Connection..." : "Test & Save Connection"} 
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
