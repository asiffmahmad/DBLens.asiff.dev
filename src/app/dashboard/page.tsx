"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Database, Server, Clock, Loader2, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";

type DbConnection = {
  id: string;
  name: string;
  host: string | null;
  port: number | null;
  databaseName: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function DashboardPage() {
  const [databases, setDatabases] = useState<DbConnection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/databases")
      .then((res) => res.json())
      .then((data) => {
        setDatabases(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch databases", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Databases</h1>
          <p className="text-muted-foreground mt-1">
            Manage your database connections and explore schemas.
          </p>
        </div>
        <Link href="/dashboard/databases/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Add Connection
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : databases.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-dashed border-border rounded-xl p-12 text-center flex flex-col items-center justify-center bg-card/30 backdrop-blur-sm min-h-[400px]"
        >
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Database className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No databases connected</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Get started by adding your first MySQL database connection to explore and track schema changes.
          </p>
          <Link href="/dashboard/databases/new">
            <Button>Connect Database</Button>
          </Link>
        </motion.div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {databases.map((db, i) => (
            <Link href={`/dashboard/databases/${db.id}`} key={db.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-xl border border-border p-6 hover:shadow-lg transition-all cursor-pointer group h-full"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Database className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{db.name}</h3>
                      <p className="text-sm text-muted-foreground font-mono">
                        {db.databaseName}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                    Connected
                  </Badge>
                </div>
                
                <div className="space-y-2 mt-4 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Host</span>
                    <span className="font-mono text-foreground truncate max-w-[150px]">{db.host}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Port</span>
                    <span className="font-mono text-foreground">{db.port}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Added</span>
                    <span>{new Date(db.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-sm font-medium text-primary">Explore Schema</span>
                  <ArrowRight className="w-4 h-4 text-primary" />
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
