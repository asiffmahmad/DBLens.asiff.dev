"use client";

import { useMemo } from "react";
import { ReactFlow, Node, Edge, Background, BackgroundVariant, MarkerType } from "@xyflow/react";
import { InfrastructureReport } from "@/lib/infrastructure";

export function ArchitectureDiagram({ report }: { report: InfrastructureReport }) {
  const { nodes, edges } = useMemo(() => {
    const defaultNodes: Node[] = [
      {
        id: "client",
        position: { x: 50, y: 100 },
        data: { label: "DBLens Client" },
        style: { background: "#18181b", color: "#fff", border: "1px solid #3f3f46", borderRadius: "8px", padding: "10px", width: 150, textAlign: "center" }
      },
      {
        id: "network",
        position: { x: 250, y: 100 },
        data: { label: report.sslStatus === "Enabled" ? "Secure Network (TLS)" : "Public Network" },
        style: { background: report.sslStatus === "Enabled" ? "#14532d" : "#7f1d1d", color: "#fff", border: "1px solid #3f3f46", borderRadius: "8px", padding: "10px", width: 150, textAlign: "center" }
      },
      {
        id: "provider",
        position: { x: 450, y: 100 },
        data: { label: report.hostingPlatform },
        style: { background: "#1e3a8a", color: "#fff", border: "1px solid #3b82f6", borderRadius: "8px", padding: "10px", width: 150, textAlign: "center" }
      },
      {
        id: "primary",
        position: { x: 650, y: 100 },
        data: { label: `Primary (${report.databaseEngine})` },
        style: { background: "#0f766e", color: "#fff", border: "1px solid #14b8a6", borderRadius: "8px", padding: "10px", width: 150, textAlign: "center" }
      }
    ];

    const defaultEdges: Edge[] = [
      { id: "e1", source: "client", target: "network", animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
      { id: "e2", source: "network", target: "provider", animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
      { id: "e3", source: "provider", target: "primary", animated: true, markerEnd: { type: MarkerType.ArrowClosed } }
    ];

    if (report.readReplicaDetected) {
      defaultNodes.push({
        id: "replica",
        position: { x: 850, y: 100 },
        data: { label: "Read Replica" },
        style: { background: "#4c1d95", color: "#fff", border: "1px solid #8b5cf6", borderRadius: "8px", padding: "10px", width: 150, textAlign: "center" }
      });
      defaultEdges.push({
        id: "e4", source: "primary", target: "replica", animated: true, style: { strokeDasharray: "5 5" }, markerEnd: { type: MarkerType.ArrowClosed }
      });
    }

    return { nodes: defaultNodes, edges: defaultEdges };
  }, [report]);

  return (
    <div className="h-[200px] w-full border border-border rounded-xl overflow-hidden bg-background">
      <ReactFlow nodes={nodes} edges={edges} fitView minZoom={0.5} maxZoom={2}>
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} color="rgba(255,255,255,0.1)" />
      </ReactFlow>
    </div>
  );
}
