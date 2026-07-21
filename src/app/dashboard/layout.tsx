"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  DatabaseZap, 
  Database, 
  Activity, 
  History, 
  Settings, 
  LogOut 
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navigation = [
    { name: "Databases", href: "/dashboard", icon: Database },
    { name: "Recent Activity", href: "/dashboard/activity", icon: Activity },
    { name: "Snapshots", href: "/dashboard/snapshots", icon: History },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 flex-col border-r border-border/50 bg-sidebar">
        <div className="flex h-16 shrink-0 items-center px-6 border-b border-border/50">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <DatabaseZap className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">DBLens</span>
          </Link>
        </div>
        
        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
          <nav className="flex-1 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 shrink-0 ${
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    }`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="border-t border-border/50 p-4">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground">
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="h-16 flex items-center px-8 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
          {/* Header content like breadcrumbs or user profile can go here */}
        </div>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
