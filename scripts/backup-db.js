/**
 * Database backup script for Agentbot
 * Run this periodically to backup the Neon PostgreSQL database
 * 
 * Usage: node scripts/backup-db.js
 * 
 * Configure via environment variables:
 * - DATABASE_URL: PostgreSQL connection string
 * - BACKUP_PATH: Local backup directory (default: ./runtime-data/backups)
 * - SLACK_WEBHOOK: Optional Slack webhook for notifications
 * 
 * Recommended: Run daily via CRON
 *   0 3 * * * cd /path/to/project && node scripts/backup-db.js
 */

const { createClient } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL;
const BACKUP_PATH = process.env.BACKUP_PATH || path.join(__dirname, '..', 'runtime-data', 'backups');
const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK;
const RETENTION_DAYS = parseInt(process.env.RETENTION_DAYS || '7');

async function sendNotification(message, success = true) {
  if (!SLACK_WEBHOOK) return;
  
  try {
    await fetch(SLACK_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attachments: [{
          color: success ? '#36a64f' : '#dc3545',
          text: message,
          timestamp: new Date().toISOString()
        }]
      })
    });
  } catch (error) {
    console.error('Failed to send notification:', error.message);
  }
}

function formatValue(val, col) {
    if (val === null) return 'NULL';
    if (typeof val === 'number') return val;
    if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
    // Escape single quotes and handle special characters
    const escaped = String(val).replace(/'/g, "''");
    return `'${escaped}'`;
  }

  // Validate identifier (table/column name) to prevent SQL injection
  function isValidIdentifier(name) {
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
  }

  async function backupDatabase() {
    if (!DATABASE_URL) {
      console.error('❌ DATABASE_URL environment variable is not set');
      process.exit(1);
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_PATH, `agentbot-db-${timestamp}.sql`);
    
    // Ensure backup directory exists
    if (!fs.existsSync(BACKUP_PATH)) {
      fs.mkdirSync(BACKUP_PATH, { recursive: true });
    }
    
    console.log(`🔄 Starting database backup...`);
    console.log(`   File: ${backupFile}`);
    
    try {
    const client = createClient({ 
      connectionString: DATABASE_URL,
      connectionTimeoutMillis: 10000 // 10 second timeout
    });
    await client.connect();
    
    // Get all table names
    const tablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    
    const tables = tablesResult.rows.map(row => row.tablename);
    console.log(`   Tables: ${tables.join(', ')}`);
    
    let backupContent = `-- Agentbot Database Backup\n`;
    backupContent += `-- Generated: ${new Date().toISOString()}\n\n`;
    
    // Backup each table
    for (const table of tables) {
      console.log(`   Backing up table: ${table}`);
      
      // Validate table name to prevent SQL injection
      if (!isValidIdentifier(table)) {
        console.error(`   ⚠️ Skipping invalid table name: ${table}`);
        continue;
      }
      
      // Get table structure
      const structResult = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table]);
      
      backupContent += `\n-- Table: ${table}\n`;
      backupContent += `DROP TABLE IF EXISTS ${table} CASCADE;\n`;
      
      // Create table statement with validated column names
      const columns = structResult.rows.map(col => {
        let def = col.column_name;
        if (col.column_default) def += ` DEFAULT ${col.column_default}`;
        if (col.is_nullable === 'NO') def += ' NOT NULL';
        return def;
      });
      
      // Get data - use validated table name
      const dataResult = await client.query(`SELECT * FROM ${table}`);
      
      if (dataResult.rows.length > 0) {
        const columnsList = structResult.rows.map(col => col.column_name).join(', ');
        backupContent += `CREATE TABLE ${table} (${columns.join(', ')});\n`;
        
        // Insert data with proper value formatting
        for (const row of dataResult.rows) {
          const values = structResult.rows.map(col => formatValue(row[col.column_name], col));
          backupContent += `INSERT INTO ${table} (${columnsList}) VALUES (${values.join(', ')});\n`;
        }
      }
    }
    
    await client.end();
    
    // Write backup file
    fs.writeFileSync(backupFile, backupContent);
    
    const stats = fs.statSync(backupFile);
    console.log(`✅ Backup completed: ${(stats.size / 1024).toFixed(2)} KB`);
    
    await sendNotification(`✅ Database backup completed: ${backupFile} (${(stats.size / 1024).toFixed(2)} KB)`);
    
    // Clean old backups
    await cleanupOldBackups();
    
  } catch (error) {
    console.error(`❌ Backup failed: ${error.message}`);
    await sendNotification(`❌ Database backup failed: ${error.message}`, false);
    process.exit(1);
  }
}

async function cleanupOldBackups() {
  console.log(`🧹 Cleaning up backups older than ${RETENTION_DAYS} days...`);
  
  const files = fs.readdirSync(BACKUP_PATH)
    .filter(f => f.startsWith('agentbot-db-') && f.endsWith('.sql'))
    .map(f => ({
      name: f,
      path: path.join(BACKUP_PATH, f),
      time: fs.statSync(path.join(BACKUP_PATH, f)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);
  
  const cutoffTime = Date.now() - (RETENTION_DAYS * 24 * 60 * 60 * 1000);
  let deleted = 0;
  
  for (const file of files) {
    if (file.time < cutoffTime) {
      fs.unlinkSync(file.path);
      console.log(`   Deleted: ${file.name}`);
      deleted++;
    }
  }
  
  console.log(`✅ Cleaned up ${deleted} old backup(s)`);
}

// Run if called directly
if (require.main === module) {
  backupDatabase();
}

module.exports = { backupDatabase, cleanupOldBackups };
