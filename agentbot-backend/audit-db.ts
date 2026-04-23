import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function audit() {
  console.log('--- DATABASE AUDIT ---');
  
  try {
    // 1. Check plural tables (Backend)
    console.log('\nChecking backend tables ("agents", "users")...');
    const backendAgents = await pool.query('SELECT * FROM agents LIMIT 10');
    console.log(`Found ${backendAgents.rowCount} agents in plural table.`);
    backendAgents.rows.forEach(a => {
      console.log(`- ID: ${a.id}, Name: ${a.name}, Status: ${a.status}`);
      console.log(`  Config: ${JSON.stringify(a.config)}`);
    });

    // 2. Check singular tables (Prisma/Frontend)
    console.log('\nChecking frontend tables ("Agent", "User")...');
    const frontendAgents = await pool.query('SELECT * FROM "Agent" LIMIT 10');
    console.log(`Found ${frontendAgents.rowCount} agents in singular table.`);
    frontendAgents.rows.forEach(a => {
      console.log(`- ID: ${a.id}, Name: ${a.name}, Status: ${a.status}`);
      console.log(`  URL: ${a.websocketUrl}`);
      console.log(`  Config: ${JSON.stringify(a.config)}`);
    });

    // 3. Find specifically the problematic agent
    console.log('\nSearching for agent 8711c7cdf8242b25...');
    const target = await pool.query('SELECT * FROM "Agent" WHERE id = $1', ['8711c7cdf8242b25']);
    if (target.rowCount && target.rowCount > 0) {
       console.log('Found it in "Agent" table!');
       console.log(JSON.stringify(target.rows[0], null, 2));
    } else {
       console.log('NOT found in "Agent" table.');
    }

  } catch (error: any) {
    console.error('Audit failed:', error.message);
  } finally {
    await pool.end();
  }
}

audit();
