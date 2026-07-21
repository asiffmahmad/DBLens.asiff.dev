"use client";

import { useState, useMemo } from "react";
import { DatabaseSchema } from "@/lib/introspection";
import { Search, Download, Table2, Eye, FileCode2, FunctionSquare, Zap, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type DictionaryRow = {
  id: string;
  type: string;
  name: string;
  parent: string | null;
  dataType: string;
  properties: string[];
  link: string;
};

export function DataDictionary({ schema, databaseId }: { schema: DatabaseSchema, databaseId: string }) {
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const list: DictionaryRow[] = [];

    // Tables & Columns
    schema.tables?.forEach(t => {
      list.push({
        id: `table-${t.name}`, type: 'Table', name: t.name, parent: null, dataType: t.engine || '-', properties: [], link: `/dashboard/databases/${databaseId}/explorer/tables/${t.name}`
      });
      t.columns.forEach(c => {
        const props = [];
        if (c.isPrimary) props.push('PK');
        if (!c.nullable) props.push('NOT NULL');
        if (c.defaultValue) props.push(`DEFAULT ${c.defaultValue}`);
        if (c.isAutoIncrement) props.push('AUTO_INC');
        
        list.push({
          id: `col-${t.name}-${c.name}`, type: 'Column', name: c.name, parent: t.name, dataType: c.type, properties: props, link: `/dashboard/databases/${databaseId}/explorer/tables/${t.name}`
        });
      });
    });

    // Views
    schema.views?.forEach(v => {
      list.push({ id: `view-${v.name}`, type: 'View', name: v.name, parent: null, dataType: '-', properties: [v.updatable ? 'Updatable' : 'Read Only'], link: `/dashboard/databases/${databaseId}/explorer/views/${v.name}` });
    });

    // Routines
    schema.routines?.forEach(r => {
      list.push({ id: `routine-${r.name}`, type: r.type, name: r.name, parent: null, dataType: r.returnType || '-', properties: [`${r.parameters.length} params`], link: `/dashboard/databases/${databaseId}/explorer/routines/${r.name}` });
    });

    // Triggers
    schema.triggers?.forEach(t => {
      list.push({ id: `trigger-${t.name}`, type: 'Trigger', name: t.name, parent: t.table, dataType: '-', properties: [`${t.timing} ${t.event}`], link: `/dashboard/databases/${databaseId}/explorer/triggers/${t.name}` });
    });

    // Events
    schema.events?.forEach(e => {
      list.push({ id: `event-${e.name}`, type: 'Event', name: e.name, parent: null, dataType: '-', properties: [e.status], link: `/dashboard/databases/${databaseId}/explorer/events/${e.name}` });
    });

    return list;
  }, [schema, databaseId]);

  const filteredRows = useMemo(() => {
    const s = search.toLowerCase();
    if (!s) return rows;
    return rows.filter(r => 
      r.name.toLowerCase().includes(s) || 
      (r.parent && r.parent.toLowerCase().includes(s)) ||
      r.type.toLowerCase().includes(s)
    );
  }, [rows, search]);

  const exportCSV = () => {
    const header = "Type,Name,Parent,Data Type,Properties\n";
    const csv = filteredRows.map(r => `${r.type},${r.name},${r.parent || ''},"${r.dataType}","${r.properties.join(', ')}"`).join("\n");
    const blob = new Blob([header + csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data-dictionary.csv';
    a.click();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'Table': return <Table2 className="w-4 h-4 text-blue-500" />;
      case 'Column': return <div className="w-4 h-4 flex items-center justify-center border-l-2 border-b-2 border-muted-foreground/30 ml-2 rounded-bl-sm" />;
      case 'View': return <Eye className="w-4 h-4 text-purple-500" />;
      case 'PROCEDURE': return <FileCode2 className="w-4 h-4 text-orange-500" />;
      case 'FUNCTION': return <FunctionSquare className="w-4 h-4 text-green-500" />;
      case 'Trigger': return <Zap className="w-4 h-4 text-amber-500" />;
      case 'Event': return <Clock className="w-4 h-4 text-indigo-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text"
            placeholder="Search dictionary (tables, columns, triggers...)" 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 bg-card border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
        <Button variant="secondary" size="sm" onClick={exportCSV} className="gap-2 shrink-0">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      <div className="rounded-xl border bg-card/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar relative">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/80 text-muted-foreground sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Object Name</th>
                <th className="px-4 py-3 font-medium">Parent</th>
                <th className="px-4 py-3 font-medium">Data Type / Details</th>
                <th className="px-4 py-3 font-medium">Properties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRows.map((row) => (
                <tr key={row.id} className="hover:bg-muted/50 transition-colors group">
                  <td className="px-4 py-2 flex items-center gap-2">
                    {getIcon(row.type)}
                    <span className="text-xs text-muted-foreground uppercase">{row.type}</span>
                  </td>
                  <td className="px-4 py-2">
                    <Link href={row.link} className="font-medium hover:text-primary transition-colors">
                      {row.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {row.parent ? (
                      <Link href={`/dashboard/databases/${databaseId}/explorer/tables/${row.parent}`} className="hover:text-primary transition-colors">
                        {row.parent}
                      </Link>
                    ) : "-"}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{row.dataType}</td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {row.properties.map(p => (
                        <Badge key={p} variant="outline" className="text-[10px] py-0">{p}</Badge>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No results found in dictionary.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground text-right">
        Showing {filteredRows.length} objects
      </div>
    </div>
  );
}
