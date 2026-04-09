#!/usr/bin/env node
/**
 * Generate Production Secrets
 * Generates secure random secrets for production deployment
 */

const { execSync } = require('child_process');

const COLORS = {
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

console.log('\n' + '='.repeat(60));
console.log(`${COLORS.bright}🔐 Agentbot Secret Generator${COLORS.reset}`);
console.log('='.repeat(60) + '\n');

// Generate NEXTAUTH_SECRET (64-character hex string)
const nextauthSecret = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('hex');

// Generate JWT_SECRET (32 bytes base64)
const jwtSecret = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64');

// Generate Internal API Key (24-character hex string)
const internalApiKey = Buffer.from(crypto.getRandomValues(new Uint8Array(12))).toString('hex');

// Generate Wallet Encryption Key (32-character hex string)
const walletEncryptionKey = Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('hex');

console.log(`${COLORS.bright}📋 Generated Secrets:${COLORS.reset}\n`);

console.log(`${COLORS.yellow}1. NEXTAUTH_SECRET (Vercel):${COLORS.reset}`);
console.log(`   ${nextauthSecret}`);
console.log(`${COLORS.blue}   → Add to Vercel → Environment Variables${COLORS.reset}\n`);

console.log(`${COLORS.yellow}2. JWT_SECRET (Render - Backend):${COLORS.reset}`);
console.log(`   ${jwtSecret}`);
console.log(`${COLORS.blue}   → Add to Render → agentbot-api → Environment${COLORS.reset}`);
console.log(`${COLORS.blue}   → Or use "Generate value" in Render dashboard${COLORS.reset}\n`);

console.log(`${COLORS.yellow}3. INTERNAL_API_KEY (Render - Backend):${COLORS.reset}`);
console.log(`   ${internalApiKey}`);
console.log(`${COLORS.blue}   → Add to Render → agentbot-api → Environment${COLORS.reset}`);
console.log(`${COLORS.blue}   → Or use "Generate value" in Render dashboard${COLORS.reset}\n`);

console.log(`${COLORS.yellow}4. WALLET_ENCRYPTION_KEY (Render - Backend):${COLORS.reset}`);
console.log(`   ${walletEncryptionKey}`);
console.log(`${COLORS.blue}   → Add to Render → agentbot-api → Environment${COLORS.reset}`);
console.log(`${COLORS.blue}   → Or use "Generate value" in Render dashboard${COLORS.reset}\n`);

console.log('─'.repeat(60));
console.log(`${COLORS.bright}✅ Instructions:${COLORS.reset}\n`);

console.log('1. ${COLORS.green}Vercel${COLORS.reset}:');
console.log('   - Go to: https://vercel.com/dashboard');
console.log('   - Select your agentbot project');
console.log('   - Settings → Environment Variables');
console.log('   - Add: NEXTAUTH_SECRET (use value above)\n');

console.log('2. ${COLORS.green}Render${COLORS.reset}:');
console.log('   - Go to: https://dashboard.render.com');
console.log('   - Services → agentbot-api → Environment');
console.log('   - Add secrets OR use "Generate value" for auto-generated ones\n');

console.log('3. ${COLORS.green}IMPORTANT:${COLORS.reset}');
console.log('   - Save these secrets in a secure location!');
console.log('   - Never commit secrets to git');
console.log('   - Share only with trusted team members\n');

console.log('='.repeat(60));
console.log(`${COLORS.bright}📝 Copy these values now - they won't be shown again!${COLORS.reset}`);
console.log('='.repeat(60) + '\n');
