"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Table2, Eye, FileCode2, FunctionSquare, Zap, Clock, ChevronDown, ChevronRight } from "lucide-react";
import { DatabaseSchema } from "@/lib/introspection";
import { cn } from "@/lib/utils";

export function ExplorerSidebar({ databaseId, schema }: { databaseId: string; schema: DatabaseSchema | null }) {
  const [search, setSearch] = useState("");
  const pathname = usePathname();
  
  // Accordion state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    tables: true,
    views: true,
    routines: true,
    triggers: false,
    events: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (!schema) {
    return (
      <div className="w-64 border-r border-border bg-card/10 flex flex-col h-full shrink-0">
         <div className="px-2 py-4 text-center">
            <p className="text-xs text-muted-foreground mb-3">Take a snapshot first.</p>
         </div>
      </div>
    );
  }

  const s = search.toLowerCase();
  
  const tables = (schema.tables || []).filter(t => t.name.toLowerCase().includes(s));
  const views = (schema.views || []).filter(v => v.name.toLowerCase().includes(s));
  const routines = (schema.routines || []).filter(r => r.name.toLowerCase().includes(s));
  const procedures = routines.filter(r => r.type === 'PROCEDURE');
  const functions = routines.filter(r => r.type === 'FUNCTION');
  const triggers = (schema.triggers || []).filter(t => t.name.toLowerCase().includes(s));
  const events = (schema.events || []).filter(e => e.name.toLowerCase().includes(s));

  const renderSection = (title: string, key: string, items: {name: string}[], icon: any, pathPrefix: string) => {
    if (items.length === 0 && search === "") return null;
    const isOpen = openSections[key] || search !== "";

    return (
      <div className="mb-2">
        <div 
          className="flex items-center justify-between px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
          onClick={() => toggleSection(key)}
        >
          <span>{title} ({items.length})</span>
          {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </div>
        
        {isOpen && (
          <div className="mt-1 space-y-0.5">
            {items.length > 0 ? items.map((item) => {
              const href = `/dashboard/databases/${databaseId}/explorer/${pathPrefix}/${item.name}`;
              const isActive = pathname === href;
              const Icon = icon;
              
              return (
                <Link key={item.name} href={href}>
                  <div className={cn(
                    "flex items-center px-2 py-1.5 text-sm rounded-md transition-colors group cursor-pointer",
                    isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}>
                    <Icon className={cn("w-4 h-4 mr-2 transition-all shrink-0", isActive ? "text-primary" : "opacity-50 group-hover:opacity-100 group-hover:text-primary")} />
                    <span className="truncate">{item.name}</span>
                  </div>
                </Link>
              );
            }) : (
              <div className="px-3 py-1 text-xs text-muted-foreground italic">No matches</div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-card/10 flex flex-col h-64 md:h-full shrink-0">
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search objects..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-background border border-border rounded-md pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {renderSection("Tables", "tables", tables, Table2, "tables")}
        {renderSection("Views", "views", views, Eye, "views")}
        {renderSection("Procedures", "procedures", procedures, FileCode2, "routines")}
        {renderSection("Functions", "functions", functions, FunctionSquare, "routines")}
        {renderSection("Triggers", "triggers", triggers, Zap, "triggers")}
        {renderSection("Events", "events", events, Clock, "events")}
      </div>
    </div>
  );
}
