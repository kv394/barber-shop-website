import { prisma } from './prisma';

const VERCEL_TOKEN = process.env.VERCEL_API_TOKEN;
const PROJECT_ID = process.env.VERCEL_PROJECT_ID || 'prj_KUmKRUP1RGviLrGQJ9SmSD8cO2nz';
const CAPTURE_SECONDS = parseInt(process.env.VERCEL_CAPTURE_SECONDS || '30');

export class VercelLogMonitor {
  /**
   * Fetches the latest deployment ID for the project.
   */
  private static async getLatestDeploymentId(): Promise<string> {
    const res = await fetch(
      `https://api.vercel.com/v2/deployments?projectId=${PROJECT_ID}&limit=1&state=READY`,
      { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } }
    );
    if (!res.ok) throw new Error(`Failed to fetch deployments: ${res.status} ${res.statusText}`);
    const data = await res.json();
    if (!data.deployments?.length) throw new Error('No ready deployments found');
    return data.deployments[0].uid;
  }

  /**
   * Connects to Vercel's streaming runtime logs API, captures error/warning
   * logs for a configurable window, deduplicates them, and writes to SystemLog.
   */
  static async fetchAndIngestLogs(): Promise<{
    deploymentId: string;
    captureSeconds: number;
    errorsFound: number;
    warningsFound: number;
  }> {
    if (!VERCEL_TOKEN) {
      console.log('VercelLogMonitor: VERCEL_API_TOKEN not configured. Skipping.');
      return { deploymentId: 'none', captureSeconds: 0, errorsFound: 0, warningsFound: 0 };
    }

    console.log('VercelLogMonitor: Starting log capture...');

    // 1. Get latest deployment
    const deploymentId = await this.getLatestDeploymentId();
    console.log(`VercelLogMonitor: Monitoring deployment ${deploymentId} for ${CAPTURE_SECONDS}s`);

    // 2. Connect to streaming runtime logs
    const url = `https://api.vercel.com/v1/projects/${PROJECT_ID}/deployments/${deploymentId}/runtime-logs`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CAPTURE_SECONDS * 1000);

    const capturedLogs: Array<{
      level: string;
      message: string;
      path: string | null;
      metadata: Record<string, unknown>;
    }> = [];
    const seenMessages = new Set<string>();

    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
        signal: controller.signal,
      });

      if (!res.ok) {
        clearTimeout(timeout);
        throw new Error(`Runtime logs API returned ${res.status}: ${res.statusText}`);
      }

      const reader = res.body!.getReader();
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
              const msgKey = `${level}:${String(message).slice(0, 100)}`;
              if (!seenMessages.has(msgKey)) {
                seenMessages.add(msgKey);

                capturedLogs.push({
                  level: isError ? 'ERROR' : 'WARNING',
                  message: `[Vercel] ${String(message).slice(0, 500)}`,
                  path: path || null,
                  metadata: {
                    source: 'vercel-monitor',
                    deploymentId,
                    statusCode: statusCode || null,
                    vercelLevel: level,
                    timestamp: logEntry.timestamp || logEntry.date || new Date().toISOString(),
                    requestId: logEntry.requestId || null,
                  },
                });
              }
            }
          } catch {
            // Plain text line — check for error keywords
            if (/error|exception|crash|fatal/i.test(line)) {
              const msgKey = `text:${line.slice(0, 100)}`;
              if (!seenMessages.has(msgKey)) {
                seenMessages.add(msgKey);
                capturedLogs.push({
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
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Expected — capture window ended
      } else {
        console.error(`VercelLogMonitor: Stream error: ${err.message}`);
      }
    } finally {
      clearTimeout(timeout);
    }

    // 3. Write captured logs to SystemLog
    let errorsFound = 0;
    let warningsFound = 0;

    if (capturedLogs.length > 0) {
      for (const log of capturedLogs) {
        try {
          await prisma.systemLog.create({
            data: {
              level: log.level,
              message: log.message,
              path: log.path,
              metadata: log.metadata as any,
              isResolved: false,
            },
          });
          if (log.level === 'ERROR') errorsFound++;
          else warningsFound++;
        } catch (dbErr) {
          console.error('VercelLogMonitor: Failed to write log to DB:', dbErr);
        }
      }
      console.log(`VercelLogMonitor: Ingested ${capturedLogs.length} log(s) (${errorsFound} errors, ${warningsFound} warnings)`);
    } else {
      console.log('VercelLogMonitor: No errors detected — system healthy');
    }

    return { deploymentId, captureSeconds: CAPTURE_SECONDS, errorsFound, warningsFound };
  }
}
