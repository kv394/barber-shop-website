import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { uploadFileToDrive } from '@/lib/google-drive';

export const dynamic = 'force-dynamic';

async function requireSuperAdmin() {
  const supabase = await createClient();
  const { data: { user: authUserSession } } = await supabase.auth.getUser();
  let userId = authUserSession?.id;
  const authUserEmail = authUserSession?.email;
  if (!userId && !authUserEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] }, select: { id: true, role: true } });
  if (!user || user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return user;
}

export async function POST(request: NextRequest) {
  const adminCheck = await requireSuperAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const COMMON_FOLDER = 'superadmin_templates';
    const uploadedIds: string[] = [];
    const fileMap: Record<string, string> = {};

    let htmlCode = '';
    let cssCode = '';
    let templateName = 'uploaded-template-' + Date.now();

    // First pass: upload all files and get their IDs
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileId = await uploadFileToDrive(COMMON_FOLDER, file.name, file.type, buffer);
      
      if (fileId) {
        uploadedIds.push(fileId);
        fileMap[file.name] = fileId;
      }

      // If we find html or css, we can optionally parse it
      if (file.name.endsWith('.html')) {
        htmlCode = buffer.toString('utf-8');
        templateName = file.name.replace('.html', '');
      } else if (file.name.endsWith('.css')) {
        cssCode = buffer.toString('utf-8');
      }
    }

    // Second pass: Replace local paths in HTML/CSS with the new /api/assets/ URLs
    for (const [fileName, fileId] of Object.entries(fileMap)) {
      if (!fileName.endsWith('.html') && !fileName.endsWith('.css')) {
        // e.g. "logo.png" -> "/api/assets/12345"
        const assetUrl = `/api/assets/${fileId}`;
        const regex = new RegExp(fileName, 'g');
        htmlCode = htmlCode.replace(regex, assetUrl);
        cssCode = cssCode.replace(regex, assetUrl);
      }
    }

    // Optionally save to DB if HTML is provided
    let templateRecord = null;
    if (htmlCode) {
      templateRecord = await prisma.dynamicTemplate.create({
        data: {
          name: templateName,
          description: 'Uploaded from files',
          htmlCode,
          cssCode,
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      uploadedCount: uploadedIds.length,
      template: templateRecord
    });
  } catch (error: any) {
    console.error('Error uploading template files:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
