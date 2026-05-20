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
  const nestedPackageJson = path.join(nestedProjectDir, 'package.json');
  const packageJson = path.join(projectDir, 'package.json');
  const nodeModulesDir = [path.join(projectDir, 'node_modules'), path.join(projectDir, '..', 'node_modules')].find((dir) =>
    fs.existsSync(path.join(dir, 'next')),
  );

  fs.mkdirSync(nestedProjectDir, { recursive: true });

  function linkNestedPath(target, sourceDir, label) {
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
      fs.symlinkSync(path.relative(nestedProjectDir, sourceDir), target, 'dir');
      console.log(`Linked ${path.relative(projectDir, target)} to ${label}`);
    }
  }

  function linkNestedFile(target, sourceFile, label) {
    try {
      const current = fs.lstatSync(target);
      if (!current.isSymbolicLink()) {
        return;
      }

      fs.rmSync(target, { force: true });
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    if (!fs.existsSync(target)) {
      fs.symlinkSync(path.relative(nestedProjectDir, sourceFile), target, 'file');
      console.log(`Linked ${path.relative(projectDir, target)} to ${label}`);
    }
  }

  linkNestedPath(nestedNextDir, nextDir, '.next');
  linkNestedFile(nestedPackageJson, packageJson, 'package.json');

  if (nodeModulesDir) {
    linkNestedPath(nestedNodeModulesDir, nodeModulesDir, 'node_modules');
  }
}
