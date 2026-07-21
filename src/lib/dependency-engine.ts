import { DatabaseSchema, TableSchema, ViewSchema, RoutineSchema, TriggerSchema } from "./introspection";

export interface ImpactRadius {
  referencingTables: Array<{ table: string; column: string; fkName: string }>;
  dependentViews: ViewSchema[];
  dependentRoutines: RoutineSchema[];
  dependentTriggers: TriggerSchema[];
  totalDependencies: number;
}

export function calculateImpactRadius(schema: DatabaseSchema, tableName: string): ImpactRadius {
  const referencingTables: Array<{ table: string; column: string; fkName: string }> = [];
  const dependentViews: ViewSchema[] = [];
  const dependentRoutines: RoutineSchema[] = [];
  const dependentTriggers: TriggerSchema[] = [];

  // 1. Find tables that have foreign keys pointing to this table
  for (const table of schema.tables || []) {
    for (const fk of table.foreignKeys || []) {
      if (fk.referencedTable === tableName) {
        referencingTables.push({
          table: table.name,
          column: fk.column,
          fkName: fk.name
        });
      }
    }
  }

  // 2. Find views whose definitions mention this table
  // Simple heuristic: just look for the table name in the definition
  // A perfect AST parser would be better, but regex is sufficient for standard introspection
  const tableRegex = new RegExp(`\\b${tableName}\\b`, 'i');
  
  for (const view of schema.views || []) {
    if (tableRegex.test(view.definition)) {
      dependentViews.push(view);
    }
  }

  // 3. Find routines
  for (const routine of schema.routines || []) {
    if (tableRegex.test(routine.definition)) {
      dependentRoutines.push(routine);
    }
  }

  // 4. Find triggers
  for (const trigger of schema.triggers || []) {
    if (tableRegex.test(trigger.actionStatement)) {
      dependentTriggers.push(trigger);
    }
  }

  return {
    referencingTables,
    dependentViews,
    dependentRoutines,
    dependentTriggers,
    totalDependencies: referencingTables.length + dependentViews.length + dependentRoutines.length + dependentTriggers.length
  };
}
