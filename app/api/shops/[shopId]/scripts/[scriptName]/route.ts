import { NextRequest, NextResponse } from 'next/server';
import { getOrCreatePath, downloadFileFromFolder } from '@/lib/google-drive';
import { Redis } from '@upstash/redis';

let redis: Redis | null = null;
try {
 const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
 const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
 if (redisUrl && redisToken) {
 redis = new Redis({ url: redisUrl, token: redisToken });
 }
} catch (e) {
 console.warn('Upstash Redis not configured properly:', e);
}

export async function GET(
 req: NextRequest,
 { params }: { params: Promise<{ shopId: string; scriptName: string }> }
) {
 const { shopId, scriptName } = await params;

 if (!shopId || !scriptName) {
 return new NextResponse('Missing shopId or scriptName', { status: 400 });
 }

 const cacheKey = `script:${shopId}:${scriptName}`;

 if (redis) {
 try {
 const cachedScript = await redis.get<string>(cacheKey);
 if (cachedScript) {
 return new NextResponse(cachedScript, {
 status: 200,
 headers: {
 'Content-Type': 'application/javascript',
 'Cache-Control': 'public, max-age=3600',
 },
 });
 }
 } catch (e) {
 console.warn('Upstash Redis cache miss/error:', e);
 }
 }

 try {
 const path = `${shopId}/scripts`;
 const folderId = await getOrCreatePath(path);
 
 if (!folderId) {
 return new NextResponse('Script not found', { status: 404 });
 }

 const scriptContent = await downloadFileFromFolder(folderId, scriptName);
 
 if (!scriptContent) {
 // Create a default empty script if it doesn't exist? No, return 404.
 // Alternatively, we could return empty script.
 // But 404 is more correct.
 // Wait, returning empty script avoids console errors on the client. Let's return empty if not found.
 return new NextResponse('// No script available', { 
 status: 200, 
 headers: { 'Content-Type': 'application/javascript' } 
 });
 }

 if (redis) {
 try {
 await redis.set(cacheKey, scriptContent, { ex: 3600 }); // Cache for 1 hour
 } catch (e) {
 console.warn('Failed to write to Upstash Redis:', e);
 }
 }

 return new NextResponse(scriptContent, {
 status: 200,
 headers: {
 'Content-Type': 'application/javascript',
 'Cache-Control': 'public, max-age=3600',
 },
 });

 } catch (error: any) {
 console.error('Error fetching script from Google Drive:', error);
 return new NextResponse('Error fetching script', { status: 500 });
 }
}
