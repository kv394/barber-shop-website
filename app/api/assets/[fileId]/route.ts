import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { getDriveService } from '@/lib/google-drive';

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

export async function GET(req: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params;

  if (!fileId) {
    return new NextResponse('Missing fileId', { status: 400 });
  }

  const cacheKey = `img:${fileId}`;

  // 1. Check Upstash Redis Cache
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
