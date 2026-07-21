"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { DatabaseZap, ArrowRight, Shield, Activity, GitBranch, History, Search, Zap, Terminal, FileText, Database, Code2, Cpu, Network } from "lucide-react";
import { SmoothScroll } from "@/components/smooth-scroll";
import { useRef } from "react";
import { Badge } from "@/components/ui/badge";

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.8, delay, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  // Parallax for the dashboard image
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  return (
    <SmoothScroll>
      <div ref={containerRef} className="relative min-h-screen overflow-hidden selection:bg-primary/30">
        
        {/* Deep Space Aurora Background */}
        <div className="fixed inset-0 -z-20 bg-background" />
        <div className="fixed inset-0 -z-10 opacity-30 mix-blend-screen pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/30 blur-[120px]" />
          <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] rounded-full bg-violet-600/20 blur-[150px]" />
          <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[50%] rounded-full bg-blue-600/20 blur-[150px]" />
        </div>

        {/* Global Nav */}
        <header className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl">
          <div className="container mx-auto flex h-16 items-center justify-between px-6 max-w-7xl">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                <DatabaseZap className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight">DBLens</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button className="text-sm gap-2 rounded-full font-medium shadow-lg hover:shadow-primary/20 transition-all">
                  Enter Workspace <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <main className="relative z-10 pt-32 pb-24">
          
          {/* 1. Hero Section */}
          <section className="container mx-auto px-6 max-w-7xl text-center mb-24">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-8 backdrop-blur-md"
            >
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse" />
              Introducing DBLens Enterprise
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
              className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1] max-w-4xl mx-auto"
            >
              The Complete Database <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Intelligence Platform</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="max-w-2xl mx-auto text-xl text-muted-foreground mb-12 leading-relaxed font-light"
            >
              Go beyond simple tables. Automatically reverse-engineer your entire database ecosystem, track schema drift, and run native performance diagnostics—all without writing a single line of code.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="flex justify-center"
            >
              <Link href="/dashboard">
                <Button size="lg" className="h-14 px-8 text-base rounded-full font-semibold shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)] hover:shadow-[0_0_60px_-15px_rgba(79,70,229,0.7)] transition-all">
                  Connect Your Database <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </motion.div>
          </section>

          {/* Hero Parallax Mockup */}
          <motion.section style={{ y, opacity, scale }} className="container mx-auto px-6 max-w-6xl mb-48">
            <div className="relative rounded-2xl border border-border/50 bg-card/20 p-2 shadow-2xl backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-2xl pointer-events-none" />
              <div className="rounded-xl overflow-hidden border border-border/50 bg-background/90 aspect-[16/9] flex flex-col relative group">
                <div className="h-12 border-b border-border flex items-center px-4 gap-2 bg-muted/30">
                  <div className="w-3 h-3 rounded-full bg-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/50" />
                  <div className="ml-4 text-xs font-mono text-muted-foreground">mysql://production-cluster-01.db</div>
                </div>
                <div className="flex-1 flex">
                  <div className="w-48 border-r border-border bg-card/30 p-4 space-y-4">
                    <div className="h-4 w-24 bg-primary/20 rounded" />
                    <div className="space-y-2">
                      <div className="h-3 w-full bg-muted rounded" />
                      <div className="h-3 w-4/5 bg-muted rounded" />
                      <div className="h-3 w-5/6 bg-muted rounded" />
                    </div>
                  </div>
                  <div className="flex-1 p-8">
                     <div className="flex gap-4 mb-6">
                        <div className="h-24 w-1/3 bg-card border border-border rounded-xl" />
                        <div className="h-24 w-1/3 bg-card border border-border rounded-xl" />
                        <div className="h-24 w-1/3 bg-card border border-border rounded-xl" />
                     </div>
                     <div className="h-64 w-full bg-card border border-border rounded-xl flex items-end p-4 gap-2">
                        {[40, 70, 45, 90, 65, 85, 60, 100, 75, 50].map((h, i) => (
                          <div key={i} className="flex-1 bg-primary/30 rounded-t-sm transition-all hover:bg-primary/50" style={{ height: `${h}%` }} />
                        ))}
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* 2. Story: Deep Introspection */}
          <section className="container mx-auto px-6 max-w-7xl mb-48">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <FadeIn className="flex-1 space-y-6">
                <div className="inline-flex items-center rounded-lg bg-purple-500/10 px-3 py-1 text-sm font-medium text-purple-400">
                  <Code2 className="w-4 h-4 mr-2" /> Deep Introspection Engine
                </div>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Beyond just tables.</h2>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Most tools stop at tables and columns. DBLens automatically reverse-engineers your entire ecosystem—extracting Views, Stored Procedures, Functions, Triggers, and Events directly from the <code className="text-primary bg-primary/10 px-1 py-0.5 rounded">information_schema</code>.
                </p>
                <ul className="space-y-3 pt-4">
                  {['Syntax-highlighted DDL definitions', 'Parameter extraction (IN/OUT)', 'Automated Data Dictionary generation'].map((item, i) => (
                    <li key={i} className="flex items-center text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mr-3" /> {item}
                    </li>
                  ))}
                </ul>
              </FadeIn>
              <FadeIn delay={0.2} className="flex-1 w-full">
                <div className="relative rounded-2xl border border-border/50 bg-card/20 p-6 shadow-2xl backdrop-blur-xl">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-4">
                      <div className="flex items-center gap-2"><FileText className="w-5 h-5 text-purple-400" /> <span className="font-semibold">Object Explorer</span></div>
                      <Badge variant="outline">5 object types</Badge>
                    </div>
                    {['Users_View', 'Calculate_Tax_Routine', 'Audit_Trigger'].map((name, i) => (
                      <div key={i} className="p-3 rounded-lg border border-border bg-background flex items-center justify-between">
                        <span className="font-mono text-sm">{name}</span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </div>
              </FadeIn>
            </div>
          </section>

          {/* 3. Story: Performance Reports */}
          <section className="container mx-auto px-6 max-w-7xl mb-48">
            <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
              <FadeIn className="flex-1 space-y-6">
                <div className="inline-flex items-center rounded-lg bg-amber-500/10 px-3 py-1 text-sm font-medium text-amber-500">
                  <Cpu className="w-4 h-4 mr-2" /> Multi-Engine Diagnostics
                </div>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Native performance profiling.</h2>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  DBLens intelligently detects your database engine. Connect an Oracle DB, and we'll instantly pull Active Session History (ASH) wait events via pure JS drivers. Connect MySQL, and we'll extract the Top 10 Slowest SQL Queries directly from the Performance Schema.
                </p>
                <Button variant="outline" className="mt-4 rounded-full">View Diagnostics Output</Button>
              </FadeIn>
              <FadeIn delay={0.2} className="flex-1 w-full">
                <div className="relative rounded-2xl border border-border/50 bg-card/20 p-6 shadow-2xl backdrop-blur-xl space-y-4">
                  <div className="flex gap-4">
                     <div className="flex-1 p-4 rounded-xl border border-border bg-background">
                       <p className="text-xs text-muted-foreground mb-1">Engine</p>
                       <div className="font-bold text-lg flex items-center gap-2">ORACLE <Badge className="bg-amber-500/20 text-amber-500">ASH</Badge></div>
                     </div>
                     <div className="flex-1 p-4 rounded-xl border border-border bg-background">
                       <p className="text-xs text-muted-foreground mb-1">Buffer Hit Rate</p>
                       <div className="font-bold text-lg text-green-500">99.8%</div>
                     </div>
                  </div>
                  <div className="p-4 rounded-xl border border-border bg-background">
                    <p className="text-xs font-semibold uppercase text-muted-foreground mb-3">Top Wait Events</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm"><span className="font-mono text-blue-400">db file sequential read</span><span>12,450ms</span></div>
                      <div className="flex justify-between text-sm"><span className="font-mono text-purple-400">log file sync</span><span>8,230ms</span></div>
                      <div className="flex justify-between text-sm"><span className="font-mono text-muted-foreground">latch: cache buffers chains</span><span>1,120ms</span></div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            </div>
          </section>

          {/* 4. Story: Schema Diff & Audit */}
          <section className="container mx-auto px-6 max-w-7xl mb-48">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <FadeIn className="flex-1 space-y-6">
                <div className="inline-flex items-center rounded-lg bg-green-500/10 px-3 py-1 text-sm font-medium text-green-500">
                  <GitBranch className="w-4 h-4 mr-2" /> Schema Compare Engine
                </div>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Track every mutation.</h2>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Take manual or automated snapshots of your architecture. Our intelligent diff engine calculates the exact structural delta between any two points in time—highlighting added tables, dropped columns, and modified datatypes.
                </p>
              </FadeIn>
              <FadeIn delay={0.2} className="flex-1 w-full">
                <div className="relative rounded-2xl border border-border/50 bg-card/20 p-6 shadow-2xl backdrop-blur-xl">
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg border border-green-500/20 bg-green-500/5 flex items-center justify-between">
                      <div className="flex items-center gap-3"><Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/20">ADDED</Badge> <span className="font-semibold text-sm">Table</span></div>
                      <span className="font-mono text-sm">user_preferences</span>
                    </div>
                    <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 flex items-center justify-between">
                      <div className="flex items-center gap-3"><Badge className="bg-red-500/20 text-red-500 hover:bg-red-500/20">REMOVED</Badge> <span className="font-semibold text-sm">Column</span></div>
                      <span className="font-mono text-sm">last_login_ip</span>
                    </div>
                    <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 flex items-center justify-between">
                      <div className="flex items-center gap-3"><Badge className="bg-amber-500/20 text-amber-500 hover:bg-amber-500/20">MODIFIED</Badge> <span className="font-semibold text-sm">Column</span></div>
                      <div className="text-right text-xs">
                         <div className="font-mono">status_code</div>
                         <div className="text-muted-foreground mt-1">INT <ArrowRight className="inline w-3 h-3" /> VARCHAR</div>
                      </div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            </div>
          </section>

          {/* 5. Features Grid */}
          <section className="container mx-auto px-6 max-w-7xl">
            <div className="text-center mb-16">
              <FadeIn>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">A complete suite of tools.</h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Everything you need to deeply understand your database architecture securely.</p>
              </FadeIn>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Terminal, title: "SQL Playground", desc: "Execute ad-hoc queries securely. Our engine strictly enforces read-only operations, blocking all DROP, ALTER, and UPDATE commands." },
                { icon: Network, title: "Automated ER Diagrams", desc: "Instantly visualize complex foreign-key relationships using interactive Dagre-powered node graphs." },
                { icon: Shield, title: "Security Assessment", desc: "Automatically detect public endpoints, remote root logins, and missing TLS encryption." },
                { icon: Activity, title: "Live Activity", desc: "Monitor active connections, running queries, and live database load directly pulling from status variables." },
                { icon: FileText, title: "Data Dictionary", desc: "A searchable, flattened tabular view of every single object, column, and trigger in your entire database." },
                { icon: Database, title: "No Dependencies", desc: "Connects securely using standard connection strings. No agents or binaries to install on your servers." },
              ].map((feature, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <div className="glass-card p-8 rounded-3xl hover:bg-muted/10 transition-colors border-border/40 h-full">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 text-primary border border-primary/20">
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section className="container mx-auto px-6 max-w-7xl mt-48 text-center">
             <FadeIn>
               <div className="rounded-3xl border border-primary/20 bg-primary/5 p-16 relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
                 <h2 className="text-4xl font-bold tracking-tight mb-6 relative z-10">Ready to illuminate your database?</h2>
                 <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto relative z-10">Stop guessing what changed in production. Connect your database in seconds and get instant architectural visibility.</p>
                 <Link href="/dashboard" className="relative z-10">
                    <Button size="lg" className="h-14 px-8 text-base rounded-full font-semibold shadow-lg hover:shadow-primary/50 transition-all">
                      Start Your Workspace <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
               </div>
             </FadeIn>
          </section>

        </main>
      </div>
    </SmoothScroll>
  );
}
