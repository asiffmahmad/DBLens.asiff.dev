"use client";

import { Activity } from "lucide-react";
import { motion } from "framer-motion";

export default function ActivityPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Recent Activity</h1>
        <p className="text-muted-foreground mt-1">
          Track schema changes and snapshot history across all your databases.
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-dashed border-border rounded-xl p-12 text-center flex flex-col items-center justify-center bg-card/30 backdrop-blur-sm min-h-[400px]"
      >
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Activity className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No activity yet</h3>
        <p className="text-muted-foreground max-w-md">
          Once you connect a database and take snapshots, your activity timeline will appear here.
        </p>
      </motion.div>
    </div>
  );
}
