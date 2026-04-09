/**
 * Command Injection Checker — PAI Security Pattern
 *
 * Detects shell injection vulnerabilities in Agentbot code.
 * Run as a pre-push check or in CI.
 *
 * PAI Principle: "NEVER use shell interpolation for external input"
 *
 * Usage:
 *   npx ts-node src/lib/security/command-check.ts [directory]
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

interface Finding {
  file: string;
  line: number;
  severity: 'blocked' | 'confirm' | 'alert';
  pattern: string;
  reason: string;
  code: string;
}

const PATTERNS: Array<{ pattern: RegExp; severity: 'blocked' | 'confirm' | 'alert'; reason: string }> = [
  // BLOCKED — shell interpolation with external input
  { pattern: /exec\s*\(\s*`[^`]*\$\{/, severity: 'blocked', reason: 'Shell interpolation in exec() — use execFile() with array args' },
  { pattern: /exec\s*\(\s*['"][^'"]*\$\{/, severity: 'blocked', reason: 'Shell interpolation in exec() — use execFile() with array args' },
  { pattern: /\$\s*`[^`]*\$\{/, severity: 'blocked', reason: 'Bun shell interpolation with external input' },

  // CONFIRM — potentially dangerous but sometimes legitimate
  { pattern: /exec\s*\(/, severity: 'confirm', reason: 'exec() used — verify no external input interpolation' },
  { pattern: /child_process.*exec/, severity: 'confirm', reason: 'child_process.exec imported — prefer execFile' },
  { pattern: /execSync\s*\(/, severity: 'confirm', reason: 'execSync blocks event loop — verify input safety' },

  // ALERT — suspicious patterns
  { pattern: /spawn\s*\([^)]*shell\s*:\s*true/, severity: 'alert', reason: 'spawn() with shell: true — verify input safety' },
  { pattern: /\|\s*sh\b/, severity: 'alert', reason: 'Piping to shell' },
  { pattern: /\|\s*bash\b/, severity: 'alert', reason: 'Piping to bash' },
];

function scanFile(filePath: string): Finding[] {
  const findings: Finding[] = [];

  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    for (const rule of PATTERNS) {
      for (let i = 0; i < lines.length; i++) {
        if (rule.pattern.test(lines[i])) {
          findings.push({
            file: filePath,
            line: i + 1,
            severity: rule.severity,
            pattern: rule.pattern.source,
            reason: rule.reason,
            code: lines[i].trim(),
          });
        }
      }
    }
  } catch (error: any) {
    // Skip files that can't be read (binary, permissions, etc.)
  }

  return findings;
}

function scanDirectory(dir: string, extensions: string[] = ['.ts', '.js']): Finding[] {
  const findings: Finding[] = [];

  function walk(currentPath: string) {
    const entries = readdirSync(currentPath);

    for (const entry of entries) {
      const fullPath = join(currentPath, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        if (['node_modules', '.git', '.next', 'dist', 'build'].includes(entry)) continue;
        walk(fullPath);
      } else if (extensions.some(ext => entry.endsWith(ext))) {
        findings.push(...scanFile(fullPath));
      }
    }
  }

  walk(dir);
  return findings;
}

// CLI entry point
if (require.main === module) {
  const targetDir = process.argv[2] || '.';
  const findings = scanDirectory(targetDir);

  if (findings.length === 0) {
    console.log('✅ No command injection patterns found');
    process.exit(0);
  }

  const blocked = findings.filter(f => f.severity === 'blocked');
  const confirm = findings.filter(f => f.severity === 'confirm');
  const alert = findings.filter(f => f.severity === 'alert');

  if (blocked.length > 0) {
    console.log(`\n🚨 BLOCKED (${blocked.length}):`);
    for (const f of blocked) {
      console.log(`  ${f.file}:${f.line} — ${f.reason}`);
      console.log(`    ${f.code}`);
    }
  }

  if (confirm.length > 0) {
    console.log(`\n⚠️  CONFIRM (${confirm.length}):`);
    for (const f of confirm) {
      console.log(`  ${f.file}:${f.line} — ${f.reason}`);
    }
  }

  if (alert.length > 0) {
    console.log(`\nℹ️  ALERT (${alert.length}):`);
    for (const f of alert) {
      console.log(`  ${f.file}:${f.line} — ${f.reason}`);
    }
  }

  process.exit(blocked.length > 0 ? 1 : 0);
}

export { scanFile, scanDirectory, PATTERNS };
