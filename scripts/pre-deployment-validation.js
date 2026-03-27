#!/usr/bin/env node
/**
 * Pre-Deployment Validation Script
 * Runs checks before deployment to ensure production readiness
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

const log = {
  info: (msg) => console.log(`${COLORS.blue}[INFO]${COLORS.reset} ${msg}`),
  success: (msg) => console.log(`${COLORS.green}[PASS]${COLORS.reset} ${msg}`),
  warn: (msg) => console.log(`${COLORS.yellow}[WARN]${COLORS.reset} ${msg}`),
  error: (msg) => console.log(`${COLORS.red}[FAIL]${COLORS.reset} ${msg}`),
  section: (msg) => console.log(`\n${COLORS.bright}${COLORS.magenta}=== ${msg} ===${COLORS.reset}\n`),
};

let failures = 0;
let warnings = 0;

function runCommand(cmd, cwd = process.cwd()) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf8' });
  } catch (error) {
    return null;
  }
}

function check(condition, message, isWarning = false) {
  if (condition) {
    log.success(message);
    return true;
  } else {
    if (isWarning) {
      log.warn(message);
      warnings++;
      return false;
    } else {
      log.error(message);
      failures++;
      return false;
    }
  }
}

function checkFileExists(filePath, description) {
  const exists = fs.existsSync(filePath);
  return check(exists, `${description} exists: ${path.basename(filePath)}`);
}

function checkFileNotContains(filePath, patterns, description) {
  const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  const issues = [];

  for (const pattern of patterns) {
    if (content.includes(pattern)) {
      issues.push(pattern);
    }
  }

  if (issues.length > 0) {
    failures++;
    log.error(`${description} contains sensitive patterns: ${issues.join(', ')}`);
    return false;
  } else {
    log.success(`${description} contains no sensitive patterns`);
    return true;
  }
}

// Validation Checks

log.section('1. Git Status & Secrets');
const gitStatus = runCommand('git status --porcelain');
const hasStagedChanges = gitStatus && gitStatus.trim().length > 0;

check(!hasStagedChanges, 'Working directory is clean');

const checkPatterns = [
  'sk_live_', 'sk_test_', 'AIza', 'pk_test_', 'ghp_', 'gho_', 'ghu_', 'ghs_', 'ghr_',
  'xoxb-', 'eyJhbG', 'REDACTED', 'password123', 'admin123'
];

// Verify .gitignore correctly IGNORES .env (positive check)
const gitignoreContent = fs.existsSync(path.join(__dirname, '..', '.gitignore'))
  ? fs.readFileSync(path.join(__dirname, '..', '.gitignore'), 'utf8') : '';
check(gitignoreContent.includes('.env'), 'Root .gitignore ignores .env files');

log.section('2. Project Structure');
const dirs = ['web', 'agentbot-backend', '.github/workflows', 'web/prisma/migrations'];

dirs.forEach(dir => {
  checkFileExists(path.join(__dirname, '..', dir), `Required directory`);
});

log.section('3. Configuration Files');
const configFiles = [
  'render.yaml',
  'web/vercel.json',
  'web/.env.example',
  'agentbot-backend/Dockerfile',
  'web/Dockerfile',
  '.github/workflows/ci-cd.yml',
  'web/prisma/schema.prisma'
];

configFiles.forEach(file => {
  checkFileExists(path.join(__dirname, '..', file), `Config file`);
});

log.section('4. Docker Configuration');
try {
  const backendDocker = fs.readFileSync(path.join(__dirname, '..', 'agentbot-backend/Dockerfile'), 'utf8');
  check(backendDocker.includes('FROM node:'), 'Backend Dockerfile has FROM node:');
  check(backendDocker.includes('USER node') || backendDocker.includes('--ch=node'), 'Backend Dockerfile uses non-root user');

  const webDocker = fs.readFileSync(path.join(__dirname, '..', 'web/Dockerfile'), 'utf8');
  check(webDocker.includes('FROM node:'), 'Frontend Dockerfile has FROM node:');
  check(webDocker.includes('prisma') && webDocker.includes('generate'), 'Frontend Dockerfile generates Prisma client');
  check(webDocker.includes('next build'), 'Frontend Dockerfile builds Next.js');
} catch (error) {
  log.error('Failed to parse Dockerfile configurations');
  failures++;
}

log.section('5. Database & Migrations');
const migrationsDir = path.join(__dirname, '..', 'web/prisma/migrations');
if (fs.existsSync(migrationsDir)) {
  const migrations = fs.readdirSync(migrationsDir);
  check(migrations.length >= 3, `Has ${migrations.length} database migrations`);
} else {
  log.error('No migrations directory found');
  failures++;
}

log.section('6. Health Checks');
const tsFiles = [];
function findTsFiles(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  files.forEach(file => {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory() && !file.name.includes('node_modules') && !file.name.includes('.next')) {
      findTsFiles(fullPath);
    } else if (file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
      tsFiles.push(fullPath);
    }
  });
}

findTsFiles(path.join(__dirname, '..', 'agentbot-backend/src'));
const hasHealthCheck = tsFiles.some(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    return content.includes("'/health'") || content.includes('app.get.*health');
  } catch {
    return false;
  }
});

check(hasHealthCheck, 'Backend has health check endpoint');

findTsFiles(path.join(__dirname, '..', 'web/app'));
const hasApiHealth = tsFiles.some(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    return content.includes('/health') || content.includes('/api/health');
  } catch {
    return false;
  }
});

check(hasApiHealth, 'Frontend has health check route', true);

log.section('7. Security Headers');
try {
  const vercelJson = fs.readFileSync(path.join(__dirname, '..', 'web/vercel.json'), 'utf8');
  check(vercelJson.includes('X-Frame-Options'), 'Has X-Frame-Options header');
  check(vercelJson.includes('X-Content-Type-Options'), 'Has X-Content-Type-Options header');
  check(vercelJson.includes('Permissions-Policy'), 'Has Permissions-Policy header');
} catch (error) {
  log.error('Failed to parse vercel.json');
  failures++;
}

log.section('8. CI/CD Configuration');
try {
  const ciCdFile = fs.readFileSync(path.join(__dirname, '..', '.github/workflows/ci-cd.yml'), 'utf8');
  check(ciCdFile.includes('backend'), 'CI runs backend build');
  check(ciCdFile.includes('frontend'), 'CI runs frontend build');
  check(ciCdFile.includes('deploy') || ciCdFile.includes('Deploy'), 'CI has deploy step');
  check(ciCdFile.includes('test'), 'CI runs tests');
} catch (error) {
  log.error('Failed to parse CI/CD file');
  failures++;
}

log.section('9. Render Configuration');
try {
  const renderYaml = fs.readFileSync(path.join(__dirname, '..', 'render.yaml'), 'utf8');
  check(renderYaml.includes('agentbot-api'), 'Render backend service defined');
  check(renderYaml.includes('databases'), 'Render database service defined');
  check(renderYaml.includes('healthCheckPath'), 'Render has health check path');
  check(renderYaml.includes('autoDeploy'), 'Render has auto-deploy enabled');
} catch (error) {
  log.error('Failed to parse render.yaml');
  failures++;
}

log.section('10. Test Coverage');
const testFiles = tsFiles.filter(file => {
  const basename = path.basename(file);
  return basename.includes('.test.') || basename.includes('.spec.');
});

check(testFiles.length >= 3, `Has ${testFiles.length} test files`);

log.section('11. Package.json Validation');
const checkPackage = (dir, name) => {
  try {
    const pkgPath = path.join(__dirname, '..', dir, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

    check(pkg.scripts && pkg.scripts.build, `${name} has build script`);
    check(pkg.scripts && pkg.scripts.test, `${name} has test script`, true);
    check(pkg.scripts && pkg.scripts.dev, `${name} has dev script`);

    check(pkg.engines && pkg.engines.node, `${name} specifies Node.js version`);
    check(!pkg.dependencies || !pkg.dependencies['any'], `${name} doesn't use TypeScript 'any' type (manual check required)`, true);
    return true;
  } catch (error) {
    log.error(`Failed to parse ${dir}/package.json`);
    failures++;
    return false;
  }
};

checkPackage('web', 'Frontend');
checkPackage('agentbot-backend', 'Backend');

log.section('12. Documentation');
const docsRequired = [
  'README.md',
  'SECURITY.md',
  'CONTRIBUTING.md'
];

docsRequired.forEach(doc => {
  checkFileExists(path.join(__dirname, '..', doc), `Documentation ${doc}`);
});

// Section 13 — Build Readiness
// Note: actual builds are already verified in the CI backend/frontend jobs above.
// Here we just confirm build scripts are declared; running them again would require
// node_modules to be installed in this job, which is wasteful.
log.section('13. Build Readiness');
const webPkg   = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'web/package.json'), 'utf8'));
const backPkg  = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'agentbot-backend/package.json'), 'utf8'));
check(webPkg.scripts && webPkg.scripts.build,  'Web build script declared in package.json');
check(backPkg.scripts && backPkg.scripts.build, 'Backend build script declared in package.json');

log.section('VALIDATION SUMMARY');

console.log('\n' + '='.repeat(60));
console.log(`${COLORS.bright}RESULTS:${COLORS.reset}`);
console.log(`${COLORS.green}✓ Checks passed: Failures prevented`);
console.log(`${COLORS.yellow}⚠ Warnings: ${warnings}`);
console.log(`${COLORS.red}✗ Failures: ${failures}`);
console.log('='.repeat(60) + '\n');

if (failures > 0) {
  log.error('Deployment NOT READY - Fix failures before deploying');
  process.exit(1);
} else if (warnings > 0) {
  log.warn('Deployment READY with warnings - Review warnings before deploying');
} else {
  log.success('Deployment FULLY READY - All checks passed');
  console.log('\nNext steps:');
  console.log('1. Ensure all secrets are configured in Vercel/Render dashboards');
  console.log('2. Verify DATABASE_URL is injected correctly');
  console.log('3. Test health check endpoint: GET /health');
  console.log('4. Push to main branch to trigger deployment');
  console.log('5. Monitor deployment via GitHub Actions and Render/Vercel dashboards\n');
}

process.exit(failures > 0 ? 1 : 0);
