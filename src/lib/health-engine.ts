import { DatabaseSchema, TableSchema } from "./introspection";

export type Severity = "high" | "medium" | "low";

export interface HealthIssue {
  id: string;
  type: string;
  severity: Severity;
  message: string;
  table?: string;
  column?: string;
  suggestion: string;
}

export interface HealthReport {
  score: number; // 0-100
  grade: "A" | "B" | "C" | "D" | "F";
  issues: HealthIssue[];
  metrics: {
    totalTables: number;
    tablesWithNoPK: number;
    unindexedForeignKeys: number;
    heavyDataTypes: number;
  };
}

export function generateHealthReport(schema: DatabaseSchema): HealthReport {
  const issues: HealthIssue[] = [];
  let tablesWithNoPK = 0;
  let unindexedForeignKeys = 0;
  let heavyDataTypes = 0;

  for (const table of schema.tables || []) {
    // 1. Check for Primary Keys
    const hasPK = table.columns.some(c => c.isPrimary);
    if (!hasPK) {
      tablesWithNoPK++;
      issues.push({
        id: `no-pk-${table.name}`,
        type: "Missing Primary Key",
        severity: "high",
        message: `Table '${table.name}' has no Primary Key.`,
        table: table.name,
        suggestion: "Add an AUTO_INCREMENT integer or UUID primary key to ensure data integrity and enable optimal indexing."
      });
    }

    // 2. Check for Heavy Data Types (TEXT, BLOB, JSON)
    for (const col of table.columns) {
      const typeLower = col.type.toLowerCase();
      if (typeLower.includes("text") || typeLower.includes("blob")) {
        heavyDataTypes++;
        issues.push({
          id: `heavy-type-${table.name}-${col.name}`,
          type: "Heavy Data Type",
          severity: "low",
          message: `Column '${col.name}' in '${table.name}' uses type '${col.type}'.`,
          table: table.name,
          column: col.name,
          suggestion: "Consider using VARCHAR with a specific limit if the data size is predictable, to reduce storage overhead."
        });
      }
    }

    // 3. Check for Unindexed Foreign Keys
    for (const fk of table.foreignKeys) {
      // Find if there is an index that starts with this FK column
      const hasIndex = table.indexes.some(idx => idx.columns[0] === fk.column) || 
                       table.columns.find(c => c.name === fk.column)?.isPrimary;
      
      if (!hasIndex) {
        unindexedForeignKeys++;
        issues.push({
          id: `unindexed-fk-${table.name}-${fk.column}`,
          type: "Unindexed Foreign Key",
          severity: "medium",
          message: `Foreign key '${fk.column}' in '${table.name}' is not indexed.`,
          table: table.name,
          column: fk.column,
          suggestion: "Add an index on this foreign key column. Unindexed foreign keys can cause severe locking issues during DELETEs on the parent table and slow down JOINs."
        });
      }
    }
  }

  // Calculate Score
  let score = 100;
  score -= (tablesWithNoPK * 15);
  score -= (unindexedForeignKeys * 5);
  score -= (heavyDataTypes * 1);
  
  if (score < 0) score = 0;

  let grade: "A" | "B" | "C" | "D" | "F" = "A";
  if (score >= 90) grade = "A";
  else if (score >= 80) grade = "B";
  else if (score >= 70) grade = "C";
  else if (score >= 60) grade = "D";
  else grade = "F";

  // Sort issues by severity
  const severityWeight = { high: 3, medium: 2, low: 1 };
  issues.sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity]);

  return {
    score,
    grade,
    issues,
    metrics: {
      totalTables: (schema.tables || []).length,
      tablesWithNoPK,
      unindexedForeignKeys,
      heavyDataTypes
    }
  };
}
