"use client";

import { useMemo, useCallback, useState } from "react";
import { 
  ReactFlow, 
  Controls, 
  Background, 
  MiniMap, 
  useNodesState, 
  useEdgesState,
  Edge,
  Node,
  MarkerType,
  BackgroundVariant
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { DatabaseSchema, TableSchema } from "@/lib/introspection";
import { TableNode } from "./table-node";
import dagre from "dagre";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toPng } from "html-to-image";

const nodeTypes = {
  table: TableNode,
};

// Dagre setup for auto layout
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 250;
const nodeHeight = 300; // estimated max

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = "LR") => {
  const isHorizontal = direction === "LR";
  dagreGraph.setGraph({ rankdir: direction, nodesep: 100, ranksep: 200 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newNode = {
      ...node,
      targetPosition: isHorizontal ? "left" : "top",
      sourcePosition: isHorizontal ? "right" : "bottom",
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
    return newNode as Node;
  });

  return { nodes: newNodes, edges };
};

export function ERViewer({ schema }: { schema: DatabaseSchema }) {
  // Translate schema to nodes and edges
  const initialElements = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    schema.tables.forEach((table) => {
      // Create Node
      nodes.push({
        id: table.name,
        type: "table",
        position: { x: 0, y: 0 },
        data: {
          label: table.name,
          columns: table.columns.map(c => ({
            name: c.name,
            type: c.type,
            isPrimary: c.isPrimary,
            isForeign: table.foreignKeys.some(fk => fk.column === c.name)
          })),
        },
      });

      // Create Edges from Foreign Keys
      table.foreignKeys.forEach((fk, idx) => {
        edges.push({
          id: `e-${table.name}-${fk.column}-${fk.referencedTable}-${fk.referencedColumn}-${idx}`,
          source: table.name,
          sourceHandle: `${fk.column}-source`,
          target: fk.referencedTable,
          targetHandle: `${fk.referencedColumn}-target`,
          animated: true,
          style: { stroke: "#3b82f6", strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#3b82f6",
          },
        });
      });
    });

    return getLayoutedElements(nodes, edges, "LR");
  }, [schema]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialElements.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialElements.edges);
  
  const downloadImage = useCallback(() => {
    const flowElement = document.querySelector(".react-flow") as HTMLElement;
    if (!flowElement) return;
    
    toPng(flowElement, {
      filter: (node) => {
        // Exclude minimap and controls from the export
        if (node?.classList?.contains("react-flow__minimap") || node?.classList?.contains("react-flow__controls")) {
          return false;
        }
        return true;
      },
      backgroundColor: "#09090b", // standard dark bg
    }).then((dataUrl) => {
      const a = document.createElement("a");
      a.setAttribute("download", "er-diagram.png");
      a.setAttribute("href", dataUrl);
      a.click();
    });
  }, []);

  return (
    <div className="w-full h-full relative">
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button variant="secondary" size="sm" onClick={downloadImage} className="gap-2 shadow-md">
          <Download className="w-4 h-4" /> Export PNG
        </Button>
      </div>
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        className="bg-background"
        minZoom={0.1}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="rgba(255,255,255,0.1)" />
        <Controls className="bg-card text-foreground fill-foreground" />
        <MiniMap 
          className="bg-card border-border" 
          nodeColor={(node) => "#3b82f6"} 
          maskColor="rgba(0,0,0,0.5)"
        />
      </ReactFlow>
    </div>
  );
}
