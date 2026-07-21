import mysql from 'mysql2/promise';

export interface InfrastructureReport {
  cloudProvider: string;
  hostingPlatform: string;
  databaseEngine: string;
  databaseVersion: string;
  storageEngine: string;
  databaseSizeMB: number;
  characterSet: string;
  collation: string;
  timezone: string;
  sslStatus: "Enabled" | "Disabled" | "Unknown";
  uptime: number;
  maxConnections: number;
  currentConnections: number;
  bufferPoolSizeMB: number;
  sqlMode: string;
  isolationLevel: string;
  highAvailability: string;
  readReplicaDetected: boolean;
  security: {
    publicEndpoint: boolean;
    hasRootRemoteLogin: boolean;
    hasAnonymousUsers: boolean;
    error?: string;
  };
}

function detectCloudProvider(host: string, versionComment: string): { provider: string, platform: string } {
  const hostLower = host.toLowerCase();
  const commentLower = versionComment.toLowerCase();

  if (hostLower.includes('rds.amazonaws.com')) {
    if (commentLower.includes('aurora')) return { provider: 'AWS', platform: 'AWS Aurora' };
    return { provider: 'AWS', platform: 'AWS RDS' };
  }
  if (hostLower.includes('tidbcloud.com') || commentLower.includes('tidb')) return { provider: 'PingCAP', platform: 'TiDB Cloud' };
  if (hostLower.includes('psdb.cloud')) return { provider: 'PlanetScale', platform: 'PlanetScale' };
  if (hostLower.includes('database.azure.com')) return { provider: 'Azure', platform: 'Azure Database' };
  if (hostLower.includes('sql.goog')) return { provider: 'Google Cloud', platform: 'Google Cloud SQL' };
  if (hostLower.includes('db.ondigitalocean.com')) return { provider: 'DigitalOcean', platform: 'DO Managed Database' };
  if (hostLower.includes('railway.app')) return { provider: 'Railway', platform: 'Railway' };
  if (hostLower.includes('supabase.co')) return { provider: 'Supabase', platform: 'Supabase' };
  if (hostLower.includes('neon.tech')) return { provider: 'Neon', platform: 'Neon' };
  if (hostLower === 'localhost' || hostLower === '127.0.0.1') return { provider: 'Local', platform: 'Localhost' };

  return { provider: 'Unknown', platform: 'Self-Hosted / Unknown' };
}

export async function generateInfrastructureReport(jdbcUrl: string): Promise<InfrastructureReport> {
  const parsedUrl = new URL(jdbcUrl.replace('mysql://', 'http://'));
  const host = parsedUrl.hostname;
  
  let finalUrl = jdbcUrl;
  if (!parsedUrl.searchParams.has('ssl') && host.includes('tidbcloud.com')) {
    finalUrl += (finalUrl.includes('?') ? '&' : '?') + 'ssl={"rejectUnauthorized":true}';
  }

  const connection = await mysql.createConnection(finalUrl);
  
  try {
    // 1. Version & Metadata
    const [versionRows] = await connection.query<mysql.RowDataPacket[]>('SELECT @@version as version, @@version_comment as comment');
    const version = versionRows[0]?.version || 'Unknown';
    const versionComment = versionRows[0]?.comment || 'Unknown';
    const { provider, platform } = detectCloudProvider(host, versionComment);
    
    // Determine engine based on version string (MariaDB, TiDB, MySQL)
    let engine = 'MySQL';
    if (version.toLowerCase().includes('mariadb')) engine = 'MariaDB';
    else if (version.toLowerCase().includes('tidb') || versionComment.toLowerCase().includes('tidb')) engine = 'TiDB';
    else if (versionComment.toLowerCase().includes('aurora')) engine = 'Aurora MySQL';

    // 2. Configuration Variables
    const [varRows] = await connection.query<mysql.RowDataPacket[]>('SHOW VARIABLES');
    const varMap = new Map<string, string>();
    for (const row of varRows) {
      varMap.set(row.Variable_name.toLowerCase(), row.Value);
    }

    // 3. Status Variables
    const [statusRows] = await connection.query<mysql.RowDataPacket[]>('SHOW GLOBAL STATUS');
    const statusMap = new Map<string, string>();
    for (const row of statusRows) {
      statusMap.set(row.Variable_name.toLowerCase(), row.Value);
    }

    // 4. Database Size (Sum of all tables in the current DB)
    const [dbRows] = await connection.query<mysql.RowDataPacket[]>('SELECT DATABASE() as dbName');
    const dbName = dbRows[0]?.dbName;
    let sizeMB = 0;
    if (dbName) {
      const [sizeRows] = await connection.query<mysql.RowDataPacket[]>(
        `SELECT SUM(data_length + index_length) as totalSize 
         FROM information_schema.TABLES 
         WHERE table_schema = ?`, 
         [dbName]
      );
      sizeMB = (parseFloat(sizeRows[0]?.totalSize || '0')) / (1024 * 1024);
    }

    // 5. Security Probes
    let hasRootRemoteLogin = false;
    let hasAnonymousUsers = false;
    let securityError = undefined;

    try {
      const [userRows] = await connection.query<mysql.RowDataPacket[]>('SELECT User, Host FROM mysql.user');
      hasRootRemoteLogin = userRows.some(r => r.User === 'root' && (r.Host === '%' || r.Host === '0.0.0.0'));
      hasAnonymousUsers = userRows.some(r => r.User === '');
    } catch (e: any) {
      // Access denied to mysql.user is common in managed clouds
      securityError = "Access denied to mysql.user. Partial security assessment.";
    }

    // SSL detection
    let sslStatus: "Enabled" | "Disabled" | "Unknown" = "Unknown";
    const sslSsl = statusMap.get('ssl_cipher');
    const requireSecure = varMap.get('require_secure_transport');
    if (sslSsl && sslSsl !== '') sslStatus = "Enabled";
    else if (requireSecure === 'ON') sslStatus = "Enabled";
    else if (host.includes('tidbcloud.com')) sslStatus = "Enabled"; // TiDB Serverless enforces it
    else sslStatus = "Disabled";

    // High Availability / Replication
    const isReplica = statusMap.get('slave_running') === 'ON' || varMap.get('aurora_replica_read_auto_commit') === 'ON';
    let haStatus = "Standalone";
    if (varMap.get('wsrep_on') === 'ON') haStatus = "Galera Cluster";
    else if (varMap.get('group_replication_local_address')) haStatus = "InnoDB Cluster";
    else if (engine === 'TiDB' || engine === 'Aurora MySQL') haStatus = "Distributed / Managed Cluster";

    return {
      cloudProvider: provider,
      hostingPlatform: platform,
      databaseEngine: engine,
      databaseVersion: version,
      storageEngine: varMap.get('default_storage_engine') || 'Unknown',
      databaseSizeMB: sizeMB,
      characterSet: varMap.get('character_set_server') || 'Unknown',
      collation: varMap.get('collation_server') || 'Unknown',
      timezone: varMap.get('system_time_zone') || varMap.get('time_zone') || 'Unknown',
      sslStatus,
      uptime: parseInt(statusMap.get('uptime') || '0', 10),
      maxConnections: parseInt(varMap.get('max_connections') || '151', 10),
      currentConnections: parseInt(statusMap.get('threads_connected') || '0', 10),
      bufferPoolSizeMB: parseInt(varMap.get('innodb_buffer_pool_size') || '0', 10) / (1024 * 1024),
      sqlMode: varMap.get('sql_mode') || 'Unknown',
      isolationLevel: varMap.get('transaction_isolation') || varMap.get('tx_isolation') || 'Unknown',
      highAvailability: haStatus,
      readReplicaDetected: isReplica,
      security: {
        publicEndpoint: !host.match(/^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|localhost|127\.0\.0\.1)/),
        hasRootRemoteLogin,
        hasAnonymousUsers,
        error: securityError
      }
    };

  } finally {
    await connection.end();
  }
}
