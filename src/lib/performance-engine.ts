import mysql from "mysql2/promise";
import oracledb from "oracledb";

export interface PerformanceMetrics {
  engine: "mysql" | "oracle" | "unknown";
  summary: {
    activeConnections: number;
    uptime: string;
    bufferPoolHitRate?: number;
  };
  slowQueries: Array<{ query: string; executionTimeMs: number; count: number }>;
  waitEvents?: Array<{ event: string; count: number; timeWaitedMs: number }>;
  error?: string;
}

export async function getPerformanceMetrics(jdbcUrl: string): Promise<PerformanceMetrics> {
  if (jdbcUrl.startsWith("mysql://")) {
    return getMysqlMetrics(jdbcUrl);
  } else if (jdbcUrl.startsWith("oracle://")) {
    return getOracleMetrics(jdbcUrl);
  }
  
  return {
    engine: "unknown",
    summary: { activeConnections: 0, uptime: "0" },
    slowQueries: [],
    error: "Unsupported database engine for Performance Reports."
  };
}

async function getMysqlMetrics(jdbcUrl: string): Promise<PerformanceMetrics> {
  const parsedUrl = new URL(jdbcUrl.replace('mysql://', 'http://'));
  let finalUrl = jdbcUrl;
  if (!parsedUrl.searchParams.has('ssl') && parsedUrl.hostname.includes('tidbcloud.com')) {
    finalUrl += (finalUrl.includes('?') ? '&' : '?') + 'ssl={"rejectUnauthorized":true}';
  }

  const connection = await mysql.createConnection(finalUrl);
  try {
    // 1. Connection Usage & Uptime
    const [globalStatus] = await connection.query<mysql.RowDataPacket[]>(
      `SHOW GLOBAL STATUS WHERE Variable_name IN ('Threads_connected', 'Uptime')`
    );
    let threadsConnected = 0;
    let uptimeSeconds = 0;
    for (const row of globalStatus) {
      if (row.Variable_name === 'Threads_connected') threadsConnected = parseInt(row.Value);
      if (row.Variable_name === 'Uptime') uptimeSeconds = parseInt(row.Value);
    }

    // 2. Buffer Pool Hit Rate
    let bufferPoolHitRate = 100;
    try {
      const [bufferStatus] = await connection.query<mysql.RowDataPacket[]>(
        `SHOW GLOBAL STATUS WHERE Variable_name IN ('Innodb_buffer_pool_read_requests', 'Innodb_buffer_pool_reads')`
      );
      let readRequests = 0;
      let reads = 0;
      for (const row of bufferStatus) {
        if (row.Variable_name === 'Innodb_buffer_pool_read_requests') readRequests = parseInt(row.Value);
        if (row.Variable_name === 'Innodb_buffer_pool_reads') reads = parseInt(row.Value);
      }
      if (readRequests > 0) {
        bufferPoolHitRate = ((readRequests - reads) / readRequests) * 100;
      }
    } catch (e) {
      // Ignore if Innodb is not available
    }

    // 3. Slow Queries (Requires Performance Schema)
    const slowQueries: any[] = [];
    try {
      const [psQueries] = await connection.query<mysql.RowDataPacket[]>(
        `SELECT DIGEST_TEXT as query, 
                COUNT_STAR as count, 
                AVG_TIMER_WAIT / 1000000000000 as avg_time_sec 
         FROM performance_schema.events_statements_summary_by_digest 
         WHERE DIGEST_TEXT IS NOT NULL 
         ORDER BY AVG_TIMER_WAIT DESC 
         LIMIT 10`
      );
      
      for (const row of psQueries) {
        slowQueries.push({
          query: String(row.query).substring(0, 200) + (String(row.query).length > 200 ? "..." : ""),
          executionTimeMs: Math.round(parseFloat(row.avg_time_sec) * 1000),
          count: parseInt(row.count)
        });
      }
    } catch (e) {
      console.warn("Performance schema not accessible or disabled");
    }

    const formatUptime = (seconds: number) => {
      const days = Math.floor(seconds / (3600*24));
      const hours = Math.floor(seconds % (3600*24) / 3600);
      return `${days}d ${hours}h`;
    };

    return {
      engine: "mysql",
      summary: {
        activeConnections: threadsConnected,
        uptime: formatUptime(uptimeSeconds),
        bufferPoolHitRate: Math.round(bufferPoolHitRate * 10) / 10
      },
      slowQueries
    };

  } finally {
    await connection.end();
  }
}

async function getOracleMetrics(jdbcUrl: string): Promise<PerformanceMetrics> {
  // jdbcUrl format expected: oracle://user:pass@host:port/service_name
  const parsedUrl = new URL(jdbcUrl.replace('oracle://', 'http://'));
  const user = parsedUrl.username;
  const password = parsedUrl.password;
  const connectString = `${parsedUrl.hostname}:${parsedUrl.port}${parsedUrl.pathname}`; // e.g. host:1521/XEPDB1

  let connection;
  try {
    connection = await oracledb.getConnection({ user, password, connectString });

    // 1. Uptime and Connections
    const uptimeResult = await connection.execute<any[]>(
      `SELECT (SYSDATE - STARTUP_TIME) * 24 * 60 * 60 as uptime_sec FROM v$instance`
    );
    const connResult = await connection.execute<any[]>(
      `SELECT COUNT(*) as active_conns FROM v$session WHERE status = 'ACTIVE' AND type = 'USER'`
    );
    
    const uptimeSeconds = uptimeResult.rows?.[0]?.[0] || 0;
    const activeConnections = connResult.rows?.[0]?.[0] || 0;

    // 2. Buffer Cache Hit Ratio
    const bufferResult = await connection.execute<any[]>(
      `SELECT (1 - (phy.value / (cur.value + con.value))) * 100 as hit_ratio
       FROM v$sysstat phy, v$sysstat cur, v$sysstat con
       WHERE phy.name = 'physical reads'
         AND cur.name = 'db block gets'
         AND con.name = 'consistent gets'`
    );
    const hitRatio = bufferResult.rows?.[0]?.[0] || 0;

    // 3. Top Wait Events (ASH - Active Session History)
    const waitEvents: any[] = [];
    try {
      const ashResult = await connection.execute<any[]>(
        `SELECT event, count(*) as cnt, sum(time_waited)/1000 as time_waited_ms
         FROM v$active_session_history
         WHERE sample_time > SYSDATE - 1/24
           AND event IS NOT NULL
         GROUP BY event
         ORDER BY time_waited_ms DESC
         FETCH FIRST 10 ROWS ONLY`
      );
      
      for (const row of ashResult.rows || []) {
        waitEvents.push({
          event: row[0],
          count: row[1],
          timeWaitedMs: row[2] || 0
        });
      }
    } catch (e) {
      console.warn("V$ACTIVE_SESSION_HISTORY not accessible. Requires Oracle Diagnostics Pack.");
    }

    const formatUptime = (seconds: number) => {
      const days = Math.floor(seconds / (3600*24));
      const hours = Math.floor(seconds % (3600*24) / 3600);
      return `${days}d ${hours}h`;
    };

    return {
      engine: "oracle",
      summary: {
        activeConnections,
        uptime: formatUptime(uptimeSeconds),
        bufferPoolHitRate: Math.round(hitRatio * 10) / 10
      },
      slowQueries: [], // Requires parsing AWR or v$sql, omitted for brevity
      waitEvents
    };

  } catch (e: any) {
    return {
      engine: "oracle",
      summary: { activeConnections: 0, uptime: "0" },
      slowQueries: [],
      error: `Oracle Connection Failed: ${e.message}`
    };
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}
