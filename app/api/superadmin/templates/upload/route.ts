import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';

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
    const formTemplateName = formData.get('templateName') as string;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'superadmin_templates');
    await fs.mkdir(uploadDir, { recursive: true });

    const uploadedIds: string[] = [];
    const fileMap: Record<string, string> = {};

    let htmlCode = '';
    let cssCode = '';
    let templateName = formTemplateName || ('uploaded-template-' + Date.now());

    // First pass: upload all files locally
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const uniqueFileName = Date.now() + '-' + file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = path.join(uploadDir, uniqueFileName);
      
      await fs.writeFile(filePath, buffer);
      
      uploadedIds.push(uniqueFileName);
      fileMap[file.name] = uniqueFileName;

      // If we find html or css, we can optionally parse it
      if (file.name.endsWith('.html')) {
        htmlCode = buffer.toString('utf-8');
      } else if (file.name.endsWith('.css')) {
        cssCode = buffer.toString('utf-8');
      }
    }

    // Second pass: Replace local paths in HTML/CSS with the new /api/assets/ URLs
    for (const [fileName, uniqueFileName] of Object.entries(fileMap)) {
      if (!fileName.endsWith('.html') && !fileName.endsWith('.css')) {
        // e.g. "logo.png" -> "/api/assets/12345-logo.png"
        const assetUrl = `/api/assets/${uniqueFileName}`;
        // Create an escaped regex for the filename to replace all occurrences
        const regex = new RegExp(fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
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
