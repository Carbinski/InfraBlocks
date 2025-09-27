#!/usr/bin/env node
const fs = require('fs/promises');
const path = require('path');
const { spawn } = require('child_process');

async function findTfFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await findTfFiles(fullPath);
      files.push(...nested);
    } else if (entry.isFile() && entry.name.endsWith('.tf')) {
      files.push(fullPath);
    }
  }
  return files;
}

function runTerraform(args, env, cwd) {
  return new Promise((resolve, reject) => {
    const proc = spawn('terraform', args, {
      cwd,
      env,
      stdio: 'inherit',
    });

    proc.on('error', (err) => {
      reject(err);
    });

    proc.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`terraform ${args.join(' ')} exited with code ${code}`));
      }
    });
  });
}

async function loadConfig(baseDir) {
  const configPath = path.join(baseDir, 'aws-config.json');
  const raw = await fs.readFile(configPath, 'utf8');
  const config = JSON.parse(raw);
  const keyId = config.aws_access_key_id;
  const secret = config.aws_secret_access_key;
  if (!keyId || !secret) {
    throw new Error('aws-config.json must include aws_access_key_id and aws_secret_access_key');
  }
  return {
    AWS_ACCESS_KEY_ID: keyId,
    AWS_SECRET_ACCESS_KEY: secret,
    AWS_REGION: config.region || 'us-east-1',
  };
}

async function main() {
  const baseDir = path.resolve(__dirname);
  const tfFiles = await findTfFiles(baseDir);
  if (tfFiles.length === 0) {
    console.log('No Terraform files (.tf) found in', baseDir);
    return;
  }

  const credentials = await loadConfig(baseDir);
  const env = {
    ...process.env,
    ...credentials,
  };

  console.log('Found Terraform files:');
  for (const file of tfFiles) {
    console.log(' -', path.relative(baseDir, file));
  }

  console.log('\nRunning terraform init...');
  await runTerraform(['init'], env, baseDir);

  console.log('\nRunning terraform apply...');
  await runTerraform(['apply', '-auto-approve'], env, baseDir);

  console.log('\nTerraform deployment complete.');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
