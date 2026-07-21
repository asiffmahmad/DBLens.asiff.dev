import { DatabaseSchema, TableSchema, ViewSchema, RoutineSchema, TriggerSchema, EventSchema } from "./introspection";

export type ChangeType = "ADDED" | "REMOVED" | "MODIFIED";
export type EntityType = "TABLE" | "COLUMN" | "INDEX" | "FOREIGN_KEY" | "VIEW" | "ROUTINE" | "TRIGGER" | "EVENT";

export interface SchemaChange {
  type: ChangeType;
  entityType: EntityType;
  entityName: string;
  tableName?: string; // For things that belong to a table
  details?: string;
  oldValue?: any;
  newValue?: any;
  rollbackSql?: string; // Reverse DDL for intelligence layer
}

export function compareSchemas(oldSchema: DatabaseSchema | null, newSchema: DatabaseSchema | null): SchemaChange[] {
  const changes: SchemaChange[] = [];

  if (!oldSchema || !newSchema) {
    return changes; 
  }

  // --- Compare Tables ---
  const oldTablesMap = new Map((oldSchema.tables || []).map(t => [t.name, t]));
  const newTablesMap = new Map((newSchema.tables || []).map(t => [t.name, t]));

  for (const [tableName, newTable] of newTablesMap.entries()) {
    const oldTable = oldTablesMap.get(tableName);
    if (!oldTable) {
      const colSummary = newTable.columns.map(c => `${c.name} (${c.type})`).join(", ");
      changes.push({ 
        type: "ADDED", entityType: "TABLE", entityName: tableName, tableName, details: `Columns: ${colSummary}`,
        rollbackSql: `DROP TABLE \`${tableName}\`;` 
      });
    } else {
      compareColumns(oldTable, newTable, changes);
      compareIndexes(oldTable, newTable, changes);
      compareForeignKeys(oldTable, newTable, changes);
    }
  }

  for (const [tableName, oldTable] of oldTablesMap.entries()) {
    if (!newTablesMap.has(tableName)) {
      const colSummary = oldTable.columns.map(c => `${c.name} (${c.type})`).join(", ");
      const columnsSql = oldTable.columns.map(c => `\`${c.name}\` ${c.type}`).join(", ");
      changes.push({ 
        type: "REMOVED", entityType: "TABLE", entityName: tableName, tableName, details: `Columns: ${colSummary}`,
        rollbackSql: `CREATE TABLE \`${tableName}\` (${columnsSql}); -- Note: Data is lost`
      });
    }
  }

  // --- Compare Views ---
  const oldViewsMap = new Map((oldSchema.views || []).map(v => [v.name, v]));
  const newViewsMap = new Map((newSchema.views || []).map(v => [v.name, v]));
  for (const [name, newV] of newViewsMap.entries()) {
    const oldV = oldViewsMap.get(name);
    if (!oldV) changes.push({ type: "ADDED", entityType: "VIEW", entityName: name, rollbackSql: `DROP VIEW \`${name}\`;` });
    else if (oldV.definition !== newV.definition) {
      changes.push({ type: "MODIFIED", entityType: "VIEW", entityName: name, details: "Definition changed", rollbackSql: `CREATE OR REPLACE VIEW \`${name}\` AS ${oldV.definition};` });
    }
  }
  for (const [name, oldV] of oldViewsMap.entries()) {
    if (!newViewsMap.has(name)) changes.push({ type: "REMOVED", entityType: "VIEW", entityName: name, rollbackSql: `CREATE VIEW \`${name}\` AS ${oldV.definition};` });
  }

  // --- Compare Routines ---
  const oldRoutinesMap = new Map((oldSchema.routines || []).map(r => [r.name, r]));
  const newRoutinesMap = new Map((newSchema.routines || []).map(r => [r.name, r]));
  for (const [name, newR] of newRoutinesMap.entries()) {
    const oldR = oldRoutinesMap.get(name);
    if (!oldR) changes.push({ type: "ADDED", entityType: "ROUTINE", entityName: name, details: newR.type, rollbackSql: `DROP ${newR.type} \`${name}\`;` });
    else if (oldR.definition !== newR.definition) {
      changes.push({ type: "MODIFIED", entityType: "ROUTINE", entityName: name, details: "Definition changed", rollbackSql: `-- Cannot easily generate OR REPLACE for routines natively without full param list. Manual restore required.` });
    }
  }
  for (const [name, oldR] of oldRoutinesMap.entries()) {
    if (!newRoutinesMap.has(name)) changes.push({ type: "REMOVED", entityType: "ROUTINE", entityName: name, rollbackSql: oldR.definition });
  }

  // --- Compare Triggers ---
  const oldTriggersMap = new Map((oldSchema.triggers || []).map(t => [t.name, t]));
  const newTriggersMap = new Map((newSchema.triggers || []).map(t => [t.name, t]));
  for (const [name, newT] of newTriggersMap.entries()) {
    const oldT = oldTriggersMap.get(name);
    if (!oldT) changes.push({ type: "ADDED", entityType: "TRIGGER", entityName: name, tableName: newT.table, rollbackSql: `DROP TRIGGER \`${name}\`;` });
    else if (oldT.definition !== newT.definition) {
      changes.push({ type: "MODIFIED", entityType: "TRIGGER", entityName: name, tableName: newT.table, details: "Definition changed", rollbackSql: `DROP TRIGGER \`${name}\`;\n${oldT.definition}` });
    }
  }
  for (const [name, oldT] of oldTriggersMap.entries()) {
    if (!newTriggersMap.has(name)) changes.push({ type: "REMOVED", entityType: "TRIGGER", entityName: name, tableName: oldT.table, rollbackSql: oldT.definition });
  }

  // --- Compare Events ---
  const oldEventsMap = new Map((oldSchema.events || []).map(e => [e.name, e]));
  const newEventsMap = new Map((newSchema.events || []).map(e => [e.name, e]));
  for (const [name, newE] of newEventsMap.entries()) {
    const oldE = oldEventsMap.get(name);
    if (!oldE) changes.push({ type: "ADDED", entityType: "EVENT", entityName: name, rollbackSql: `DROP EVENT \`${name}\`;` });
    else if (oldE.definition !== newE.definition || oldE.schedule !== newE.schedule) {
      changes.push({ type: "MODIFIED", entityType: "EVENT", entityName: name, details: "Definition or Schedule changed", rollbackSql: oldE.definition });
    }
  }
  for (const [name, oldE] of oldEventsMap.entries()) {
    if (!newEventsMap.has(name)) changes.push({ type: "REMOVED", entityType: "EVENT", entityName: name, rollbackSql: oldE.definition });
  }

  return changes;
}

function compareColumns(oldTable: TableSchema, newTable: TableSchema, changes: SchemaChange[]) {
  const oldCols = new Map(oldTable.columns.map(c => [c.name, c]));
  const newCols = new Map(newTable.columns.map(c => [c.name, c]));

  for (const [colName, newCol] of newCols.entries()) {
    const oldCol = oldCols.get(colName);
    if (!oldCol) {
      changes.push({ 
        type: "ADDED", entityType: "COLUMN", entityName: colName, tableName: newTable.name, details: `Type: ${newCol.type}`,
        rollbackSql: `ALTER TABLE \`${newTable.name}\` DROP COLUMN \`${colName}\`;`
      });
    } else {
      const diffs: string[] = [];
      if (oldCol.type !== newCol.type) diffs.push(`Type changed from ${oldCol.type} to ${newCol.type}`);
      if (oldCol.nullable !== newCol.nullable) diffs.push(`Nullable changed from ${oldCol.nullable} to ${newCol.nullable}`);
      if (oldCol.defaultValue !== newCol.defaultValue) diffs.push(`Default changed from ${oldCol.defaultValue} to ${newCol.defaultValue}`);
      if (oldCol.isPrimary !== newCol.isPrimary) diffs.push(`Primary Key status changed`);

      if (diffs.length > 0) {
        changes.push({ 
          type: "MODIFIED", entityType: "COLUMN", entityName: colName, tableName: newTable.name, details: diffs.join(" | "),
          rollbackSql: `ALTER TABLE \`${newTable.name}\` MODIFY COLUMN \`${colName}\` ${oldCol.type} ${oldCol.nullable ? "NULL" : "NOT NULL"};`
        });
      }
    }
  }
  for (const [colName, oldCol] of oldCols.entries()) {
    if (!newCols.has(colName)) {
      changes.push({ 
        type: "REMOVED", entityType: "COLUMN", entityName: colName, tableName: oldTable.name,
        rollbackSql: `ALTER TABLE \`${oldTable.name}\` ADD COLUMN \`${colName}\` ${oldCol.type};`
      });
    }
  }
}

function compareIndexes(oldTable: TableSchema, newTable: TableSchema, changes: SchemaChange[]) {
  const oldIdx = new Map(oldTable.indexes.map(i => [i.name, i]));
  const newIdx = new Map(newTable.indexes.map(i => [i.name, i]));
  for (const [idxName, newI] of newIdx.entries()) {
    if (!oldIdx.has(idxName)) {
      changes.push({ 
        type: "ADDED", entityType: "INDEX", entityName: idxName, tableName: newTable.name, details: `Columns: ${newI.columns.join(", ")}`,
        rollbackSql: `DROP INDEX \`${idxName}\` ON \`${newTable.name}\`;`
      });
    }
  }
  for (const [idxName, oldI] of oldIdx.entries()) {
    if (!newIdx.has(idxName)) {
      changes.push({ 
        type: "REMOVED", entityType: "INDEX", entityName: idxName, tableName: oldTable.name,
        rollbackSql: `CREATE ${oldI.isUnique ? "UNIQUE " : ""}INDEX \`${idxName}\` ON \`${oldTable.name}\` (${oldI.columns.map(c => `\`${c}\``).join(", ")});`
      });
    }
  }
}

function compareForeignKeys(oldTable: TableSchema, newTable: TableSchema, changes: SchemaChange[]) {
  const oldFks = new Map(oldTable.foreignKeys.map(fk => [fk.name, fk]));
  const newFks = new Map(newTable.foreignKeys.map(fk => [fk.name, fk]));
  for (const [fkName, newFk] of newFks.entries()) {
    if (!oldFks.has(fkName)) {
      changes.push({ 
        type: "ADDED", entityType: "FOREIGN_KEY", entityName: fkName, tableName: newTable.name, details: `References ${newFk.referencedTable}(${newFk.referencedColumn})`,
        rollbackSql: `ALTER TABLE \`${newTable.name}\` DROP FOREIGN KEY \`${fkName}\`;`
      });
    }
  }
  for (const [fkName, oldFk] of oldFks.entries()) {
    if (!newFks.has(fkName)) {
      changes.push({ 
        type: "REMOVED", entityType: "FOREIGN_KEY", entityName: fkName, tableName: oldTable.name,
        rollbackSql: `ALTER TABLE \`${oldTable.name}\` ADD CONSTRAINT \`${fkName}\` FOREIGN KEY (\`${oldFk.column}\`) REFERENCES \`${oldFk.referencedTable}\`(\`${oldFk.referencedColumn}\`);`
      });
    }
  }
}
