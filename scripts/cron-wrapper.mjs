#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectDir = path.resolve(__dirname, '..');
const logDir = path.join(projectDir, 'logs');

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const runLogFile = path.join(logDir, 'vercel-monitor-run.log');
const errorLogFile = path.join(logDir, 'vercel-monitor-errors.log');

function logRun(message) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(runLogFile, `[${timestamp}] ${message}\n`);
}

function logError(message) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(errorLogFile, `[${timestamp}] ${message}\n`);
}

async function alertUser(title, message) {
  // macOS notification
  const escapedTitle = title.replace(/"/g, '\\"');
  const escapedMessage = message.replace(/"/g, '\\"');
  const command = `osascript -e 'display notification "${escapedMessage}" with title "${escapedTitle}" sound name "Glass"'`;
  try {
    await execAsync(command);
  } catch (err) {
    console.error('Failed to trigger notification', err);
  }
}

async function run() {
  const token = process.env.VERCEL_API_TOKEN;
  if (!token) {
    logError('VERCEL_API_TOKEN environment variable is not set.');
    return;
  }
  const captureSeconds = process.env.CAPTURE_SECONDS || '45';
  
  const nodePath = process.execPath;
  const cmd = `VERCEL_API_TOKEN="${token}" CAPTURE_SECONDS=${captureSeconds} "${nodePath}" scripts/monitor-vercel-logs.mjs`;
  
  logRun('Starting log capture...');
  
  try {
    const { stdout, stderr } = await execAsync(cmd, { cwd: projectDir });
    
    // Parse stdout for [ERROR] level logs
    const lines = stdout.split('\n');
    const errors = lines.filter(line => line.includes('[ERROR]'));
    
    if (errors.length > 0) {
      const errorMsg = `Found ${errors.length} Vercel error(s). Check logs/vercel-monitor-errors.log for details.`;
      logRun(`WARNING: ${errorMsg}`);
      
      // Log each error to the error log file
      logError(`--- Vercel Errors Detected ---`);
      errors.forEach(err => logError(err.trim()));
      logError(`Full Output:\n${stdout}\n-----------------------------\n`);
      
      await alertUser('Vercel Monitor Alert', errorMsg);
    } else {
      logRun('Completed successfully. No errors found.');
    }
  } catch (err) {
    const errMsg = `Monitor script execution failed: ${err.message}`;
    logRun(`ERROR: ${errMsg}`);
    logError(`Execution Failure:\n${err.stack || err}\n`);
    await alertUser('Vercel Monitor Failure', 'Log monitor failed to run. Check vercel-monitor-errors.log');
  }
}

run();
