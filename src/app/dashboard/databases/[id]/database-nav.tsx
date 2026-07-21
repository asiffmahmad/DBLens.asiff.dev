"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Search, 
  History, 
  GitCompare, 
  Network, 
  Activity, 
  Database,
  History as RollbackIcon,
  FileText,
  ActivitySquare,
  Settings,
  ArrowLeft,
  Terminal,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { name: "Overview", href: "", icon: LayoutDashboard },
  { name: "Database Explorer", href: "/explorer", icon: Search },
  { name: "Data Dictionary", href: "/dictionary", icon: FileText },
  { name: "SQL Playground", href: "/playground", icon: Terminal },
  { name: "Schema History", href: "/history", icon: History },
  { name: "Schema Compare", href: "/compare", icon: GitCompare },
  { name: "ER Diagram", href: "/diagram", icon: Network },
  { name: "Data Audit", href: "/audit", icon: Database },
  { name: "Activity Dashboard", href: "/activity", icon: Activity },
  { name: "Performance Reports", href: "/performance", icon: Zap },
  { name: "Infrastructure Report", href: "/infrastructure", icon: LayoutDashboard },
  { name: "Migration History", href: "/migrations", icon: History },
  { name: "Rollback Insights", href: "/rollback", icon: RollbackIcon },
  { name: "Change Reports", href: "/reports", icon: FileText },
  { name: "Health Report", href: "/health", icon: ActivitySquare },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function DatabaseNav({ databaseId, databaseName }: { databaseId: string, databaseName: string }) {
  const pathname = usePathname();
  const basePath = `/dashboard/databases/${databaseId}`;

  return (
    <div className="w-64 border-r border-border bg-card/30 flex flex-col h-full overflow-hidden shrink-0">
      <div className="p-4 border-b border-border flex flex-col gap-4">
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground flex items-center transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </Link>
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-primary/10 rounded-md shrink-0">
            <Database className="w-4 h-4 text-primary" />
          </div>
          <h2 className="font-semibold truncate" title={databaseName}>{databaseName}</h2>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
        {NAV_ITEMS.map((item) => {
          const fullHref = `${basePath}${item.href}`;
          // Active if exact match (Overview) or starts with (for sub-pages like explorer/tables/...)
          const isActive = item.href === "" 
            ? pathname === fullHref 
            : pathname.startsWith(fullHref);

          return (
            <Link key={item.name} href={fullHref}>
              <div className={cn(
                "flex items-center px-3 py-2 text-sm rounded-md transition-colors group cursor-pointer mb-1",
                isActive 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}>
                <item.icon className={cn(
                  "w-4 h-4 mr-3 transition-all",
                  isActive ? "text-primary" : "opacity-50 group-hover:opacity-100 group-hover:text-primary"
                )} />
                <span className="truncate">{item.name}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
