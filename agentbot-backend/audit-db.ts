import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function audit() {
  console.log('--- DEEP DATABASE AUDIT (Borg Recovery) ---');
  
  try {
    // 1. Search for the $3 wallet
    console.log('\nScanning "wallets" for old funds (~$3)...');
    const fundsResult = await pool.query('SELECT * FROM wallets WHERE balance_usdc > 2.0 AND balance_usdc < 5.0');
    console.log(`Found ${fundsResult.rowCount} candidate wallets.`);
    fundsResult.rows.forEach(w => {
      console.log(`- Address: ${w.address}, Balance: ${w.balance_usdc}, Network: ${w.network}`);
      console.log(`  User ID: ${w.user_id}, Type: ${w.wallet_type}`);
    });

    // 2. Check all wallets with ANY balance
    console.log('\nListing ALL wallets with balance > 0...');
    const allFunds = await pool.query('SELECT * FROM wallets WHERE balance_usdc > 0');
    allFunds.rows.forEach(w => {
      console.log(`- ${w.address}: ${w.balance_usdc} USDC (${w.network})`);
    });

    // 3. Search for "borg" or "master" agents
    console.log('\nSearching for Borg-related agents...');
    const borgAgents = await pool.query("SELECT * FROM agents WHERE name ILIKE '%borg%' OR config->>'designation' ILIKE '%borg%'");
    console.log(`Found ${borgAgents.rowCount} Borg agents in plural table.`);
    borgAgents.rows.forEach(a => {
      console.log(`- ID: ${a.id}, Name: ${a.name}, Status: ${a.status}`);
      console.log(`  Config: ${JSON.stringify(a.config)}`);
    });

  } catch (error: any) {
    console.error('Audit failed:', error.message);
  } finally {
    await pool.end();
  }
}

audit();
