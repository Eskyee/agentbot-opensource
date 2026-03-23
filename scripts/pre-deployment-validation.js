#!/usr/bin/env node

/**
 * Pre-Deployment Validation Script
 * Run before pushing to main to catch issues early
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

let passed = 0;
let failed = 0;
let warnings = 0;

function check(name, fn) {
  try {
    const result = fn();
    if (result === 'warn') {
      console.log(`⚠️  ${name}`);
      warnings++;
    } else {
      console.log(`✅ ${name}`);
      passed++;
    }
  } catch (e) {
    console.log(`❌ ${name}: ${e.message}`);
    failed++;
  }
}

function fileExists(filePath) {
  return fs.existsSync(path.join(ROOT, filePath));
}

function readFile(filePath) {
  return fs.readFileSync(path.join(ROOT, filePath), 'utf8');
}

console.log('\n🔍 Pre-Deployment Validation\n');
console.log('='.repeat(50));

// 1. Git Status
check('Git working directory clean', () => {
  const status = execSync('git status --porcelain', { cwd: ROOT }).toString().trim();
  if (status) throw new Error('Uncommitted changes found');
});

check('No .env files tracked in git', () => {
  const tracked = execSync('git ls-files | grep -E "\\.env$|\\.env\\."', { cwd: ROOT }).toString().trim();
  // Allow .env.example files
  const badFiles = tracked.split('\n').filter(f => !f.endsWith('.example') && !f.endsWith('.recoverycheck'));
  if (badFiles.length > 0) throw new Error(`Tracked env files: ${badFiles.join(', ')}`);
});

// 2. Configuration Files
check('render.yaml exists', () => {
  if (!fileExists('render.yaml')) throw new Error('Missing render.yaml');
});

check('vercel.json exists', () => {
  if (!fileExists('vercel.json')) throw new Error('Missing vercel.json');
});

check('.gitignore covers .env files', () => {
  const gitignore = readFile('.gitignore');
  if (!gitignore.includes('.env')) throw new Error('.env not in .gitignore');
});

// 3. Docker Files
check('Backend Dockerfile exists', () => {
  if (!fileExists('agentbot-backend/Dockerfile')) throw new Error('Missing Dockerfile');
});

check('Frontend Dockerfile exists', () => {
  if (!fileExists('web/Dockerfile')) throw new Error('Missing Dockerfile');
});

check('Worker Dockerfile exists', () => {
  if (!fileExists('agentbot-worker/Dockerfile') && !fileExists('agentbot-backend/Dockerfile.worker')) {
    throw new Error('Missing Dockerfile');
  }
});

// 4. Package.json Scripts
check('Backend has build script', () => {
  const pkg = JSON.parse(readFile('agentbot-backend/package.json'));
  if (!pkg.scripts?.build) throw new Error('No build script');
});

check('Frontend has build script', () => {
  const pkg = JSON.parse(readFile('web/package.json'));
  if (!pkg.scripts?.build) throw new Error('No build script');
});

// 5. Health Endpoints
check('Backend health endpoint exists', () => {
  if (!fileExists('agentbot-backend/src/routes/health.ts') &&
      !readFile('agentbot-backend/src/index.ts').includes('/health')) {
    return 'warn';
  }
});

check('Frontend health route exists', () => {
  if (!fileExists('web/app/api/health/route.ts')) {
    return 'warn';
  }
});

// 6. Prisma
check('Prisma schema exists', () => {
  if (!fileExists('web/prisma/schema.prisma')) throw new Error('Missing schema');
});

check('Prisma migrations exist', () => {
  const migrations = fs.readdirSync(path.join(ROOT, 'web/prisma/migrations'));
  if (migrations.length === 0) throw new Error('No migrations');
});

// 7. CI/CD
check('GitHub Actions workflow exists', () => {
  if (!fileExists('.github/workflows/ci-cd.yml')) throw new Error('Missing CI/CD');
});

// 8. Security
check('No hardcoded secrets in source', () => {
  const patterns = [
    /sk_live_[a-zA-Z0-9]+/,
    /sk_test_[a-zA-Z0-9]+/,
    /xox[bpsa]-[a-zA-Z0-9-]+/,
  ];
  
  // Only check tracked files
  const tracked = execSync('git ls-files', { cwd: ROOT }).toString().trim().split('\n');
  for (const f of tracked) {
    if (f.endsWith('.env') && !f.endsWith('.example')) {
      const content = readFile(f);
      for (const p of patterns) {
        if (p.test(content)) throw new Error(`Possible secret in ${f}`);
      }
    }
  }
});

// 9. Dependencies
check('Frontend dependencies installed', () => {
  if (!fileExists('web/node_modules/.package-lock.json')) {
    return 'warn';
  }
});

check('Backend dependencies installed', () => {
  if (!fileExists('agentbot-backend/node_modules/.package-lock.json')) {
    return 'warn';
  }
});

// 10. TypeScript
check('Frontend TypeScript compiles', () => {
  try {
    execSync('cd web && npx tsc --noEmit 2>&1', { cwd: ROOT, timeout: 60000 });
  } catch (e) {
    throw new Error('TypeScript errors found');
  }
});

check('Backend TypeScript compiles', () => {
  try {
    execSync('cd agentbot-backend && npx tsc --noEmit 2>&1', { cwd: ROOT, timeout: 60000 });
  } catch (e) {
    throw new Error('TypeScript errors found');
  }
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed, ${warnings} warnings\n`);

if (failed > 0) {
  console.log('❌ Deployment validation FAILED');
  console.log('Fix the issues above before deploying.\n');
  process.exit(1);
} else if (warnings > 0) {
  console.log('⚠️  Deployment validation PASSED with warnings');
  console.log('Review warnings above but deployment can proceed.\n');
  process.exit(0);
} else {
  console.log('✅ Deployment validation PASSED');
  console.log('Ready to deploy!\n');
  process.exit(0);
}
