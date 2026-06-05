#!/usr/bin/env node
/**
 * Vercel Runtime Log Monitor
 * 
 * Connects to the Vercel streaming runtime logs API, captures error/warning
 * logs for a configurable window, and writes them to the SystemLog table.
 * 
 * Usage: node scripts/monitor-vercel-logs.mjs
 * 
 * Environment variables:
 *   VERCEL_API_TOKEN  - Vercel API bearer token
 *   DATABASE_URL      - PostgreSQL connection string
 *   CAPTURE_SECONDS   - How long to capture logs (default: 45)
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Load .env from project root
const path = require('path');
const fs = require('fs');
const { fileURLToPath } = await import('url');
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dotenvPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(dotenvPath)) {
  const envContent = fs.readFileSync(dotenvPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const VERCEL_TOKEN = process.env.VERCEL_API_TOKEN;
const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const CAPTURE_SECONDS = parseInt(process.env.CAPTURE_SECONDS || '45');
const PROJECT_ID = process.env.VERCEL_PROJECT_ID || 'prj_KUmKRUP1RGviLrGQJ9SmSD8cO2nz';

if (!VERCEL_TOKEN) {
  console.error('❌ VERCEL_API_TOKEN is required');
  process.exit(1);
}
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL or POSTGRES_URL is required');
  process.exit(1);
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function generateCuid() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  const counter = (Math.floor(Math.random() * 1679616)).toString(36);
  return `c${timestamp}${random}${counter}`;
}

async function getLatestDeploymentId() {
  const res = await fetch(
    `https://api.vercel.com/v2/deployments?projectId=${PROJECT_ID}&limit=1&state=READY`,
    { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } }
  );
  if (!res.ok) throw new Error(`Failed to fetch deployments: ${res.status} ${res.statusText}`);
  const data = await res.json();
  if (!data.deployments?.length) throw new Error('No ready deployments found');
  return data.deployments[0].uid;
}

async function insertSystemLog(log) {
  // Use pg module if available, otherwise fall back to fetch-based approach
  let pg;
  try {
    pg = require('pg');
  } catch {
    // pg not available as direct require, try dynamic import path
    console.warn('⚠️  pg module not found, using fallback insert method');
    return insertViaFetch(log);
  }

  const client = new pg.Client({ connectionString: DATABASE_URL });
  try {
    await client.connect();
    await client.query(
      `INSERT INTO "SystemLog" (id, level, message, path, metadata, "isResolved", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [
        generateCuid(),
        log.level,
        log.message,
        log.path || null,
        JSON.stringify(log.metadata || {}),
        false,
      ]
    );
  } finally {
    await client.end();
  }
}

async function insertBatchSystemLogs(logs) {
  if (logs.length === 0) return;
  
  let pg;
  try {
    pg = require('pg');
  } catch {
    console.warn('⚠️  pg module not found, inserting one at a time');
    for (const log of logs) await insertViaFetch(log);
    return;
  }

  const client = new pg.Client({ connectionString: DATABASE_URL });
  try {
    await client.connect();
    for (const log of logs) {
      await client.query(
        `INSERT INTO "SystemLog" (id, level, message, path, metadata, "isResolved", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [
          generateCuid(),
          log.level,
          log.message,
          log.path || null,
          JSON.stringify(log.metadata || {}),
          false,
        ]
      );
    }
    console.log(`✅ Inserted ${logs.length} log(s) into SystemLog`);
  } finally {
    await client.end();
  }
}

// ─── Main Monitor ──────────────────────────────────────────────────────────

async function monitorLogs() {
  console.log(`🔍 Vercel Log Monitor starting...`);
  console.log(`   Project: ${PROJECT_ID}`);
  console.log(`   Capture window: ${CAPTURE_SECONDS}s`);

  // 1. Get latest deployment
  const deploymentId = await getLatestDeploymentId();
  console.log(`   Deployment: ${deploymentId}`);

  // 2. Connect to streaming runtime logs
  const url = `https://api.vercel.com/v1/projects/${PROJECT_ID}/deployments/${deploymentId}/runtime-logs`;
  console.log(`   Connecting to runtime logs stream...`);

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    console.log(`\n⏱️  Capture window complete (${CAPTURE_SECONDS}s)`);
    controller.abort();
  }, CAPTURE_SECONDS * 1000);

  const capturedErrors = [];
  const seenMessages = new Set();

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
      signal: controller.signal,
    });

    if (!res.ok) {
      clearTimeout(timeout);
      throw new Error(`Runtime logs API returned ${res.status}: ${res.statusText}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        
        try {
          const logEntry = JSON.parse(line);
          
          // Check if this is an error or warning
          const level = logEntry.level || logEntry.type || '';
          const message = logEntry.message || logEntry.msg || logEntry.text || '';
          const path = logEntry.path || logEntry.proxy?.path || logEntry.requestPath || '';
          const statusCode = logEntry.statusCode || logEntry.proxy?.statusCode;
          
          const isError = 
            level === 'error' || 
            level === 'stderr' ||
            (statusCode && statusCode >= 500) ||
            (typeof message === 'string' && /error|exception|crash|fatal|unhandled/i.test(message));
          
          const isWarning = 
            level === 'warning' || 
            level === 'warn' ||
            (statusCode && statusCode >= 400 && statusCode < 500);

          if (isError || isWarning) {
            // Deduplicate by message
            const msgKey = `${level}:${message.slice(0, 100)}`;
            if (!seenMessages.has(msgKey)) {
              seenMessages.add(msgKey);
              
              const systemLevel = isError ? 'ERROR' : 'WARNING';
              console.log(`   📋 [${systemLevel}] ${message.slice(0, 120)}`);
              
              capturedErrors.push({
                level: systemLevel,
                message: `[Vercel] ${message.slice(0, 500)}`,
                path: path || null,
                metadata: {
                  source: 'vercel-monitor',
                  deploymentId,
                  statusCode: statusCode || null,
                  vercelLevel: level,
                  timestamp: logEntry.timestamp || logEntry.date || new Date().toISOString(),
                  requestId: logEntry.requestId || null,
                  raw: JSON.stringify(logEntry).slice(0, 2000),
                },
              });
            }
          }
        } catch {
          // Not JSON, check for plain text errors
          if (/error|exception|crash|fatal/i.test(line)) {
            const msgKey = `text:${line.slice(0, 100)}`;
            if (!seenMessages.has(msgKey)) {
              seenMessages.add(msgKey);
              console.log(`   📋 [ERROR] ${line.slice(0, 120)}`);
              capturedErrors.push({
                level: 'ERROR',
                message: `[Vercel] ${line.slice(0, 500)}`,
                path: null,
                metadata: {
                  source: 'vercel-monitor',
                  deploymentId,
                  format: 'plaintext',
                },
              });
            }
          }
        }
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      // Expected — capture window ended
    } else {
      console.error(`❌ Stream error: ${err.message}`);
    }
  } finally {
    clearTimeout(timeout);
  }

  // 3. Write captured errors to database
  console.log(`\n📊 Summary: Captured ${capturedErrors.length} unique error/warning(s)`);
  
  if (capturedErrors.length > 0) {
    await insertBatchSystemLogs(capturedErrors);
  } else {
    console.log('✅ No errors detected during capture window — system healthy');
  }

  return {
    deploymentId,
    captureSeconds: CAPTURE_SECONDS,
    errorsFound: capturedErrors.length,
  };
}

// ─── Run ───────────────────────────────────────────────────────────────────

monitorLogs()
  .then((result) => {
    console.log(`\n🏁 Monitor complete:`, JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch((err) => {
    console.error(`💀 Monitor failed: ${err.message}`);
    process.exit(1);
  });
