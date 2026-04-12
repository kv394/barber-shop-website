import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Redis } from '@upstash/redis';
import fs from 'fs/promises';
import path from 'path';

// Note: Ensure you have NEXT_PUBLIC_UPSTASH_REDIS_REST_URL and NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN in your environment.
let redis: Redis | null = null;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch (e) {
  console.warn('Upstash Redis not configured properly:', e);
}

// Initialize Google Drive API
const getDriveService = () => {
  const credentialsString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!credentialsString) {
    return null;
  }
  try {
    const credentials = JSON.parse(credentialsString);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });
    return google.drive({ version: 'v3', auth });
  } catch (e) {
    console.error('Error initializing Google Drive API:', e);
    return null;
  }
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params;

  if (!fileId) {
    return new NextResponse('Missing fileId', { status: 400 });
  }

  // 1. Check local superadmin_templates directory first
  try {
    const localPath = path.join(process.cwd(), 'superadmin_templates', fileId);
    const stat = await fs.stat(localPath);
    if (stat.isFile()) {
      const buffer = await fs.readFile(localPath);
      
      // Basic content type inference from extension
      let contentType = 'application/octet-stream';
      const ext = path.extname(fileId).toLowerCase();
      if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.gif') contentType = 'image/gif';
      else if (ext === '.webp') contentType = 'image/webp';
      else if (ext === '.svg') contentType = 'image/svg+xml';
      else if (ext === '.css') contentType = 'text/css';
      else if (ext === '.js') contentType = 'application/javascript';

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }
  } catch (e) {
    // Ignore error and fall through to Google Drive/Redis cache lookup
  }

  const cacheKey = `img:${fileId}`;

  // 2. Check Upstash Redis Cache
  if (redis) {
    try {
      const cachedImageBase64 = await redis.get<string>(cacheKey);
      if (cachedImageBase64) {
        const buffer = Buffer.from(cachedImageBase64, 'base64');
        return new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': 'image/jpeg', // Best effort; may want to cache content-type too
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      }
    } catch (e) {
      console.warn('Upstash Redis cache miss/error:', e);
    }
  }

  // 2. Fetch from Google Drive
  const drive = getDriveService();
  if (!drive) {
    return new NextResponse('Drive API not configured', { status: 500 });
  }

  try {
    const response = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'arraybuffer' }
    );

    const buffer = Buffer.from(response.data as ArrayBuffer);
    
    // 3. Save to Upstash Cache as Base64
    if (redis) {
      try {
        const base64Str = buffer.toString('base64');
        await redis.set(cacheKey, base64Str, { ex: 31536000 }); // Cache for 1 year
      } catch (e) {
        console.warn('Failed to write to Upstash Redis:', e);
      }
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': response.headers['content-type'] || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (e: any) {
    console.error('Error fetching file from Google Drive:', e.message);
    return new NextResponse('File not found or access denied', { status: 404 });
  }
}
