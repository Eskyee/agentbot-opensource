const fs = require('fs');
const path = require('path');

const nextDir = path.join(__dirname, '..', '.next');
const source = path.join(nextDir, 'routes-manifest.json');
const target = path.join(nextDir, 'routes-manifest-deterministic.json');

if (!fs.existsSync(target) && fs.existsSync(source)) {
  fs.copyFileSync(source, target);
  console.log('Created .next/routes-manifest-deterministic.json from routes-manifest.json');
}
