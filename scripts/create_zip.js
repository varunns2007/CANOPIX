const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const zipPathDesktop = path.resolve(rootDir, '..', 'PUSHPA_Project.zip');
const zipPathProject = path.resolve(rootDir, 'PUSHPA_Project.zip');

console.log('Packaging project...');

// Exclude patterns
const excludes = [
  '--exclude=node_modules',
  '--exclude=.git',
  '--exclude=dist',
  '--exclude=__pycache__',
  '--exclude=.pytest_cache',
  '--exclude=PUSHPA_Project.zip',
  '--exclude=release',
  '--exclude=frontend/node_modules',
  '--exclude=frontend/dist',
];

const cmd = `tar.exe -a -c ${excludes.join(' ')} -f "${zipPathDesktop}" *`;

try {
  execSync(cmd, { cwd: rootDir, stdio: 'inherit' });
  fs.copyFileSync(zipPathDesktop, zipPathProject);
  const stats = fs.statSync(zipPathDesktop);
  console.log(`Successfully created ZIP archive:`);
  console.log(`Path: ${zipPathDesktop}`);
  console.log(`Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
} catch (err) {
  console.error('Error creating zip:', err);
}
