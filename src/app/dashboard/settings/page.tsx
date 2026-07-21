"use client";

import { Settings } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your application preferences and workspace settings.
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl space-y-6"
      >
        <div className="glass-card p-6 rounded-xl border border-border">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" /> Appearance
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Customize how DBLens looks on your device.
          </p>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-background/50">
              <div>
                <div className="font-medium">Theme</div>
                <div className="text-sm text-muted-foreground">Select your preferred color theme</div>
              </div>
              <Button variant="outline">System</Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
