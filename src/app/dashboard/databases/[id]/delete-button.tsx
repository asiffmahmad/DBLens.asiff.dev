"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function DeleteDatabaseButton({
  databaseId,
  databaseName,
}: {
  databaseId: string;
  databaseName: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to remove the database "${databaseName}"? This will delete all saved snapshots. Your actual database will NOT be affected.`)) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/databases/${databaseId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete database");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to delete database.");
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleDelete}
      disabled={loading}
      variant="destructive"
      size="sm"
      className="gap-2"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      Remove Database
    </Button>
  );
}
