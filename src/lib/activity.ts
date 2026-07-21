import mysql from 'mysql2/promise';

export interface ActivityMetrics {
  queriesPerSecond: number;
  activeConnections: number;
  sleepingConnections: number;
  totalConnections: number;
  uptime: number;
  reads: number;
  writes: number;
  inserts: number;
  updates: number;
  deletes: number;
  bytesReceived: number;
  bytesSent: number;
  processList: {
    id: number;
    user: string;
    host: string;
    db: string | null;
    command: string;
    time: number;
    state: string | null;
    info: string | null;
  }[];
}

export async function fetchLiveActivity(jdbcUrl: string): Promise<ActivityMetrics> {
  const parsedUrl = new URL(jdbcUrl.replace('mysql://', 'http://'));
  let finalUrl = jdbcUrl;
  if (!parsedUrl.searchParams.has('ssl') && parsedUrl.hostname.includes('tidbcloud.com')) {
    finalUrl += (finalUrl.includes('?') ? '&' : '?') + 'ssl={"rejectUnauthorized":true}';
  }

  const connection = await mysql.createConnection(finalUrl);
  
  try {
    const [statusRows] = await connection.query<mysql.RowDataPacket[]>('SHOW GLOBAL STATUS');
    const statusMap = new Map<string, string>();
    for (const row of statusRows) {
      statusMap.set(row.Variable_name, row.Value);
    }

    const [processRows] = await connection.query<mysql.RowDataPacket[]>('SHOW PROCESSLIST');

    let activeConnections = 0;
    let sleepingConnections = 0;

    const processList = processRows.map(row => {
      if (row.Command === 'Sleep') {
        sleepingConnections++;
      } else {
        activeConnections++;
      }
      return {
        id: row.Id,
        user: row.User,
        host: row.Host,
        db: row.db,
        command: row.Command,
        time: row.Time,
        state: row.State,
        info: row.Info,
      };
    });

    const uptime = parseInt(statusMap.get('Uptime') || '0', 10);
    const queries = parseInt(statusMap.get('Queries') || '0', 10);
    const inserts = parseInt(statusMap.get('Com_insert') || '0', 10);
    const updates = parseInt(statusMap.get('Com_update') || '0', 10);
    const deletes = parseInt(statusMap.get('Com_delete') || '0', 10);
    const selects = parseInt(statusMap.get('Com_select') || '0', 10);
    
    // QPS is an average since start, for a real live dashboard we'd need to store the previous value and diff it.
    // We will just provide the raw cumulative values, and the frontend can diff them if it wants to show real-time QPS.
    // But for simplicity, let's just pass the cumulative values.

    return {
      queriesPerSecond: queries, // This is total queries. Frontend will diff.
      activeConnections,
      sleepingConnections,
      totalConnections: parseInt(statusMap.get('Threads_connected') || '0', 10),
      uptime,
      reads: selects,
      writes: inserts + updates + deletes,
      inserts,
      updates,
      deletes,
      bytesReceived: parseInt(statusMap.get('Bytes_received') || '0', 10),
      bytesSent: parseInt(statusMap.get('Bytes_sent') || '0', 10),
      processList
    };
  } finally {
    await connection.end();
  }
}
