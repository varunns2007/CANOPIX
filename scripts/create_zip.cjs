const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const zipDesktop = path.resolve(rootDir, '..', 'PUSHPA_Project.zip');
const zipProject = path.resolve(rootDir, 'PUSHPA_Project.zip');

console.log('Building ultra-compact, token-optimized zip archive for Claude/LLMs...');

// Comprehensive exclusions to eliminate useless tokens:
// - package-lock.json (247KB+ of lock hashes)
// - Compiled PDF dossiers (1.1MB binary)
// - Duplicate frontend/ directory
// - Build/cache artifacts (dist, node_modules, __pycache__, .pytest_cache)
// - Old zip files and binary builds
const excludes = [
  '--exclude=node_modules',
  '--exclude=frontend',
  '--exclude=.git',
  '--exclude=dist',
  '--exclude=release',
  '--exclude=*.zip',
  '--exclude=*.pdf',
  '--exclude=PUSHPA_Project_Dossier.html',
  '--exclude=package-lock.json',
  '--exclude=__pycache__',
  '--exclude=*.pyc',
  '--exclude=.pytest_cache',
  '--exclude=.oxlintrc.json',
];

const cmd = `tar.exe -a -c ${excludes.join(' ')} -f "${zipDesktop}" *`;

try {
  execSync(cmd, { cwd: rootDir, stdio: 'inherit' });
  fs.copyFileSync(zipDesktop, zipProject);
  
  const stats = fs.statSync(zipDesktop);
  const sizeKb = (stats.size / 1024).toFixed(1);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
  
  console.log(`\n==============================================`);
  console.log(`✅ Ultra-Lightweight Zip Created Successfully!`);
  console.log(`📦 Size: ${sizeKb} KB (${sizeMb} MB)`);
  console.log(`📍 Desktop: ${zipDesktop}`);
  console.log(`📍 Project: ${zipProject}`);
  console.log(`⚡ Token footprint reduced by > 90%!`);
  console.log(`==============================================\n`);
} catch (err) {
  console.error('Error creating zip:', err);
}
