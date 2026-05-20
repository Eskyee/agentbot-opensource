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

  fs.mkdirSync(nestedProjectDir, { recursive: true });

  try {
    const current = fs.lstatSync(nestedNextDir);
    if (!current.isSymbolicLink()) {
      fs.rmSync(nestedNextDir, { recursive: true, force: true });
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  if (!fs.existsSync(nestedNextDir)) {
    fs.symlinkSync(path.relative(nestedProjectDir, nextDir), nestedNextDir, 'dir');
    console.log(`Linked ${path.relative(projectDir, nestedNextDir)} to .next`);
  }
}
