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
  ensureManifest(path.join(projectDir, path.basename(projectDir), '.next'));
}
