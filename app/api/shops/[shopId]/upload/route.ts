import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma, getTenantClient } from '@/lib/prisma';
import { uploadFileToPath } from '@/lib/google-drive';

export const dynamic = 'force-dynamic';

export async function POST(
 request: NextRequest,
 { params }: { params: Promise<{ shopId: string }> }
) {
 try {
 const { shopId } = await params;
    const tenantClient = await getTenantClient(shopId);
 const supabase = await createClient();
 const { data: { user: _authUser } } = await supabase.auth.getUser();
  const session = _authUser ? { user: _authUser } : null;
  const authUserSession = session?.user;
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;
 
 if (!userId) return new NextResponse("Unauthorized", { status: 401 });

 const user = await tenantClient.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 
 // Only SITE_ADMIN, SHOP_ADMIN, or STAFF can upload files to a shop
 if (!user || (user.role !== 'SITE_ADMIN' && (user.shopId !== shopId && !(await tenantClient.shopAccess.findFirst({ where: { userId: user.id, shopId } }))))) {
 return new NextResponse("Forbidden", { status: 403 });
 }

 const formData = await request.formData();
 const file = formData.get('file') as File | null;
 const type = formData.get('type') as string || 'misc'; // e.g. portfolio, logos, client-history

 if (!file) {
 return NextResponse.json({ error: 'No file provided' }, { status: 400 });
 }

 const buffer = Buffer.from(await file.arrayBuffer());

 const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
 if (buffer.byteLength > MAX_FILE_SIZE) {
 return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 413 });
 }
 
 // Validate it's an image
 const ext = file.name.split('.').pop()?.toLowerCase() || '';
 let mimeType = file.type;
 if (!mimeType) {
 if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
 else if (ext === 'png') mimeType = 'image/png';
 else if (ext === 'gif') mimeType = 'image/gif';
 else if (ext === 'svg') mimeType = 'image/svg+xml';
 else if (ext === 'webp') mimeType = 'image/webp';
 else mimeType = 'application/octet-stream';
 }

 const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
 if (!validTypes.includes(mimeType)) {
 return NextResponse.json({ error: 'Invalid file type. Only images are allowed.' }, { status: 400 });
 }

 // Path structure: /kutzapp/<shopId>/<type> or /kutzapp/<shopId>/uploads/<type>
 const FOLDER_PATH = (type === 'products' || type === 'services' || type === 'pictures') ? `/kutzapp/${shopId}/${type}` : `/kutzapp/${shopId}/uploads/${type}`;
 const timestamp = Date.now();
 const safeFileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

 const fileId = await uploadFileToPath(FOLDER_PATH, safeFileName, mimeType, buffer);

 if (fileId) {
 return NextResponse.json({ url: `/api/assets/${fileId}`, fileName: safeFileName });
 } else {
 throw new Error("Failed to get fileId from Google Drive");
 }

 } catch (error: any) {
 console.error('File upload error:', error);
 return NextResponse.json({ error: error.message || 'Failed to upload file' }, { status: 500 });
 }
}
