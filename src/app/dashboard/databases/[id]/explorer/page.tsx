import { Database } from "lucide-react";

export default function ExplorerDefaultPage() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground animate-in fade-in duration-500">
      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Database className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-xl font-medium mb-2 text-foreground">Database Explorer</h3>
      <p className="max-w-md">
        Select a table from the sidebar to view its schema, columns, indexes, and relationships.
      </p>
    </div>
  );
}
