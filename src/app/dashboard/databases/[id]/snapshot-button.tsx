"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function SnapshotButton({
  databaseId,
  hasSnapshot,
}: {
  databaseId: string;
  hasSnapshot: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const takeSnapshot = async () => {
    setLoading(true);
    setSuccess(false);

    try {
      const res = await fetch(`/api/databases/${databaseId}/snapshots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: "Manual Snapshot" }),
      });

      if (!res.ok) {
        throw new Error("Failed to take snapshot");
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
      
      // Refresh the current route to fetch the new snapshot data
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to take snapshot. Check server logs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={takeSnapshot}
      disabled={loading}
      className="gap-2 relative overflow-hidden transition-all"
      variant={hasSnapshot ? "outline" : "default"}
      size={hasSnapshot ? "default" : "lg"}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : success ? (
        <CheckCircle2 className="w-4 h-4 text-green-500" />
      ) : (
        <Camera className="w-4 h-4" />
      )}
      {loading
        ? "Taking Snapshot..."
        : success
        ? "Success!"
        : hasSnapshot
        ? "Update Snapshot"
        : "Take First Snapshot"}
    </Button>
  );
}
