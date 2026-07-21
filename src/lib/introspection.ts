import mysql from 'mysql2/promise';
import crypto from 'crypto';

export function generateSchemaChecksum(schemaPayload: string): string {
  return crypto.createHash('sha256').update(schemaPayload).digest('hex');
}

export interface ColumnSchema {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: string | null;
  isPrimary: boolean;
  isAutoIncrement: boolean;
}

export interface IndexSchema {
  name: string;
  columns: string[];
  isUnique: boolean;
}

export interface ForeignKeySchema {
  name: string;
  column: string;
  referencedTable: string;
  referencedColumn: string;
}

export interface TableSchema {
  name: string;
  engine: string | null;
  columns: ColumnSchema[];
  indexes: IndexSchema[];
  foreignKeys: ForeignKeySchema[];
}

export interface ViewSchema {
  name: string;
  definition: string;
  updatable: boolean;
}

export interface RoutineParameter {
  name: string;
  type: string;
  mode: string; // IN, OUT, INOUT
}

export interface RoutineSchema {
  name: string;
  type: 'PROCEDURE' | 'FUNCTION';
  definition: string;
  returnType: string | null;
  parameters: RoutineParameter[];
}

export interface TriggerSchema {
  name: string;
  event: string; // INSERT, UPDATE, DELETE
  timing: string; // BEFORE, AFTER
  table: string;
  definition: string;
}

export interface EventSchema {
  name: string;
  schedule: string;
  status: string; // ENABLED, DISABLED, SLAVESIDE_DISABLED
  definition: string;
}

export interface DatabaseSchema {
  tables: TableSchema[];
  views?: ViewSchema[];
  routines?: RoutineSchema[];
  triggers?: TriggerSchema[];
  events?: EventSchema[];
}

export async function introspectDatabase(jdbcUrl: string): Promise<DatabaseSchema> {
  const parsedUrl = new URL(jdbcUrl.replace('mysql://', 'http://'));
  
  let finalUrl = jdbcUrl;
  if (!parsedUrl.searchParams.has('ssl')) {
    if (parsedUrl.hostname.includes('tidbcloud.com')) {
      finalUrl += (finalUrl.includes('?') ? '&' : '?') + 'ssl={"rejectUnauthorized":true}';
    }
  }

  const connection = await mysql.createConnection(finalUrl);
  
  try {
    const [dbRows] = await connection.query<mysql.RowDataPacket[]>('SELECT DATABASE() as dbName');
    const dbName = dbRows[0]?.dbName;
    
    if (!dbName) {
      throw new Error("Could not determine database name from connection");
    }

    // --- 1. Fetch Tables ---
    const [tableRows] = await connection.query<mysql.RowDataPacket[]>(
      `SELECT TABLE_NAME, ENGINE 
       FROM information_schema.TABLES 
       WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'`,
      [dbName]
    );

    const tables: TableSchema[] = [];
    for (const tableRow of tableRows) {
      const tableName = tableRow.TABLE_NAME;
      const engine = tableRow.ENGINE;

      const [columnRows] = await connection.query<mysql.RowDataPacket[]>(
        `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY, EXTRA 
         FROM information_schema.COLUMNS 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? 
         ORDER BY ORDINAL_POSITION`,
        [dbName, tableName]
      );

      const columns: ColumnSchema[] = columnRows.map(row => ({
        name: row.COLUMN_NAME,
        type: row.COLUMN_TYPE,
        nullable: row.IS_NULLABLE === 'YES',
        defaultValue: row.COLUMN_DEFAULT,
        isPrimary: row.COLUMN_KEY === 'PRI',
        isAutoIncrement: row.EXTRA.includes('auto_increment'),
      }));

      const [indexRows] = await connection.query<mysql.RowDataPacket[]>(
        `SELECT INDEX_NAME, NON_UNIQUE, COLUMN_NAME 
         FROM information_schema.STATISTICS 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? 
         ORDER BY INDEX_NAME, SEQ_IN_INDEX`,
        [dbName, tableName]
      );

      const indexMap = new Map<string, IndexSchema>();
      for (const row of indexRows) {
        if (row.INDEX_NAME === 'PRIMARY') continue;
        if (!indexMap.has(row.INDEX_NAME)) {
          indexMap.set(row.INDEX_NAME, {
            name: row.INDEX_NAME,
            columns: [],
            isUnique: row.NON_UNIQUE === 0,
          });
        }
        indexMap.get(row.INDEX_NAME)!.columns.push(row.COLUMN_NAME);
      }

      const [fkRows] = await connection.query<mysql.RowDataPacket[]>(
        `SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME 
         FROM information_schema.KEY_COLUMN_USAGE 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL`,
        [dbName, tableName]
      );

      const foreignKeys: ForeignKeySchema[] = fkRows.map(row => ({
        name: row.CONSTRAINT_NAME,
        column: row.COLUMN_NAME,
        referencedTable: row.REFERENCED_TABLE_NAME,
        referencedColumn: row.REFERENCED_COLUMN_NAME,
      }));

      tables.push({
        name: tableName,
        engine,
        columns,
        indexes: Array.from(indexMap.values()),
        foreignKeys,
      });
    }

    // --- 2. Fetch Views ---
    const [viewRows] = await connection.query<mysql.RowDataPacket[]>(
      `SELECT TABLE_NAME, VIEW_DEFINITION, IS_UPDATABLE 
       FROM information_schema.VIEWS 
       WHERE TABLE_SCHEMA = ?`,
      [dbName]
    );
    const views: ViewSchema[] = viewRows.map(row => ({
      name: row.TABLE_NAME,
      definition: row.VIEW_DEFINITION,
      updatable: row.IS_UPDATABLE === 'YES',
    }));

    // --- 3. Fetch Routines (Procedures & Functions) ---
    const [routineRows] = await connection.query<mysql.RowDataPacket[]>(
      `SELECT ROUTINE_NAME, ROUTINE_TYPE, ROUTINE_DEFINITION, DTD_IDENTIFIER as RETURN_TYPE 
       FROM information_schema.ROUTINES 
       WHERE ROUTINE_SCHEMA = ?`,
      [dbName]
    );

    const [paramRows] = await connection.query<mysql.RowDataPacket[]>(
      `SELECT SPECIFIC_NAME, PARAMETER_NAME, DTD_IDENTIFIER as TYPE, PARAMETER_MODE 
       FROM information_schema.PARAMETERS 
       WHERE SPECIFIC_SCHEMA = ? AND PARAMETER_NAME IS NOT NULL
       ORDER BY ORDINAL_POSITION`,
      [dbName]
    );

    const paramMap = new Map<string, RoutineParameter[]>();
    for (const p of paramRows) {
      if (!paramMap.has(p.SPECIFIC_NAME)) {
        paramMap.set(p.SPECIFIC_NAME, []);
      }
      paramMap.get(p.SPECIFIC_NAME)!.push({
        name: p.PARAMETER_NAME,
        type: p.TYPE,
        mode: p.PARAMETER_MODE || 'IN'
      });
    }

    const routines: RoutineSchema[] = routineRows.map(row => ({
      name: row.ROUTINE_NAME,
      type: row.ROUTINE_TYPE as 'PROCEDURE' | 'FUNCTION',
      definition: row.ROUTINE_DEFINITION,
      returnType: row.RETURN_TYPE,
      parameters: paramMap.get(row.ROUTINE_NAME) || [],
    }));

    // --- 4. Fetch Triggers ---
    const [triggerRows] = await connection.query<mysql.RowDataPacket[]>(
      `SELECT TRIGGER_NAME, EVENT_MANIPULATION, ACTION_TIMING, EVENT_OBJECT_TABLE, ACTION_STATEMENT 
       FROM information_schema.TRIGGERS 
       WHERE TRIGGER_SCHEMA = ?`,
      [dbName]
    );
    const triggers: TriggerSchema[] = triggerRows.map(row => ({
      name: row.TRIGGER_NAME,
      event: row.EVENT_MANIPULATION,
      timing: row.ACTION_TIMING,
      table: row.EVENT_OBJECT_TABLE,
      definition: row.ACTION_STATEMENT,
    }));

    // --- 5. Fetch Events ---
    // Note: Some managed DBs restrict access to EVENTS, so we wrap it in a try-catch.
    let events: EventSchema[] = [];
    try {
      const [eventRows] = await connection.query<mysql.RowDataPacket[]>(
        `SELECT EVENT_NAME, EVENT_DEFINITION, STATUS, INTERVAL_VALUE, INTERVAL_FIELD, EXECUTE_AT 
         FROM information_schema.EVENTS 
         WHERE EVENT_SCHEMA = ?`,
        [dbName]
      );
      events = eventRows.map(row => ({
        name: row.EVENT_NAME,
        schedule: row.EXECUTE_AT ? `AT ${row.EXECUTE_AT}` : `EVERY ${row.INTERVAL_VALUE} ${row.INTERVAL_FIELD}`,
        status: row.STATUS,
        definition: row.EVENT_DEFINITION,
      }));
    } catch (e) {
      console.warn("Could not fetch events. The database user may lack privileges.");
    }

    return { 
      tables,
      views,
      routines,
      triggers,
      events
    };
  } finally {
    await connection.end();
  }
}
