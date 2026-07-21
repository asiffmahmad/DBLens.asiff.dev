import { Handle, Position } from "@xyflow/react";
import { Key, Database } from "lucide-react";
import { cn } from "@/lib/utils";

export type ColumnData = {
  name: string;
  type: string;
  isPrimary: boolean;
  isForeign: boolean;
};

export type TableNodeData = {
  label: string;
  columns: ColumnData[];
};

export function TableNode({ data }: { data: TableNodeData }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg min-w-[250px] font-mono text-sm">
      {/* Header */}
      <div className="bg-primary/10 border-b border-border px-4 py-3 flex items-center gap-2">
        <Database className="w-4 h-4 text-primary" />
        <span className="font-bold text-foreground">{data.label}</span>
      </div>

      {/* Columns */}
      <div className="flex flex-col py-2">
        {data.columns.map((col, idx) => (
          <div 
            key={col.name} 
            className={cn(
              "relative px-4 py-1.5 flex items-center justify-between hover:bg-muted/50 group",
              col.isPrimary && "text-primary font-semibold"
            )}
          >
            {/* Left Handle (Target) */}
            <Handle
              type="target"
              position={Position.Left}
              id={`${col.name}-target`}
              className="w-2 h-2 !bg-muted-foreground/50 border-none -ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
            />

            <div className="flex items-center gap-2">
              {col.isPrimary && <Key className="w-3 h-3 text-primary" />}
              {col.isForeign && !col.isPrimary && <Key className="w-3 h-3 text-amber-500" />}
              {!col.isPrimary && !col.isForeign && <span className="w-3 h-3" />}
              
              <span>{col.name}</span>
            </div>
            <span className="text-muted-foreground text-xs">{col.type}</span>

            {/* Right Handle (Source) */}
            <Handle
              type="source"
              position={Position.Right}
              id={`${col.name}-source`}
              className="w-2 h-2 !bg-muted-foreground/50 border-none -mr-2 opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
