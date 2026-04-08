const { execSync } = require('child_process');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1]] = match[2].replace(/^"(.*)"$/, '$1');
  }
});

execSync('npx tsx prisma/seed-heritage-full.ts', {
  env: { ...process.env, ...env },
  stdio: 'inherit'
});
