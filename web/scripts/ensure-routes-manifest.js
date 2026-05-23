const fs = require('fs');
const path = require('path');

const projectDir = path.join(__dirname, '..');
const nextDir = path.join(projectDir, '.next');
const source = path.join(nextDir, 'routes-manifest.json');

function ensureManifest(targetNextDir) {
  const target = path.join(targetNextDir, 'routes-manifest-deterministic.json');

  if (fs.existsSync(target) || !fs.existsSync(source)) {
    return;
  }

  fs.mkdirSync(targetNextDir, { recursive: true });
  fs.copyFileSync(source, target);
  console.log(`Created ${path.relative(projectDir, target)} from routes-manifest.json`);
}

ensureManifest(nextDir);

if (process.env.VERCEL) {
  const nestedProjectDir = path.join(projectDir, path.basename(projectDir));
  const nestedNextDir = path.join(nestedProjectDir, '.next');
  const nestedNodeModulesDir = path.join(nestedProjectDir, 'node_modules');
  const nodeModulesDir = [path.join(projectDir, 'node_modules'), path.join(projectDir, '..', 'node_modules')].find((dir) =>
    fs.existsSync(path.join(dir, 'next')),
  );

  fs.mkdirSync(nestedProjectDir, { recursive: true });

  function linkNestedEntry(target, sourceEntry, label, type) {
    try {
      const current = fs.lstatSync(target);
      if (!current.isSymbolicLink()) {
        return;
      }

      fs.rmSync(target, { recursive: true, force: true });
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    if (!fs.existsSync(target)) {
      fs.symlinkSync(path.relative(nestedProjectDir, sourceEntry), target, type);
      console.log(`Linked ${path.relative(projectDir, target)} to ${label}`);
    }
  }

  function mirrorProjectRoot() {
    const mirroredEntries = new Set([
      'app',
      'components',
      'components.json',
      'hooks',
      'instrumentation-client.ts',
      'instrumentation.ts',
      'lib',
      'next-env.d.ts',
      'next.config.js',
      'package-lock.json',
      'package.json',
      'postcss.config.js',
      'prisma',
      'proxy.ts',
      'public',
      'scripts',
      'sentry.edge.config.ts',
      'sentry.server.config.ts',
      'tailwind.config.js',
      'tsconfig.json',
      'types',
      'vercel.json',
    ]);

    for (const entry of fs.readdirSync(projectDir, { withFileTypes: true })) {
      if (!mirroredEntries.has(entry.name)) {
        continue;
      }

      const sourceEntry = path.join(projectDir, entry.name);
      const target = path.join(nestedProjectDir, entry.name);
      const type = entry.isDirectory() ? 'dir' : 'file';

      linkNestedEntry(target, sourceEntry, entry.name, type);
    }
  }

  mirrorProjectRoot();
  linkNestedEntry(nestedNextDir, nextDir, '.next', 'dir');

  if (nodeModulesDir) {
    linkNestedEntry(nestedNodeModulesDir, nodeModulesDir, 'node_modules', 'dir');
  }
}
