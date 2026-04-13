import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { uploadFileToPath } from '@/lib/google-drive';
import AdmZip from 'adm-zip';

export const dynamic = 'force-dynamic';

async function requireSiteAdmin() {
  const supabase = await createClient();
  const { data: { user: authUserSession } } = await supabase.auth.getUser();
  let userId = authUserSession?.id;
  const authUserEmail = authUserSession?.email;
  if (!userId && !authUserEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] }, select: { id: true, role: true } });
  if (!user || user.role !== 'SITE_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return user;
}

export async function POST(request: NextRequest) {
  const adminCheck = await requireSiteAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const formTemplateName = formData.get('templateName') as string;
    const targetShopId = formData.get('targetShopId') as string;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    if (!targetShopId) {
      return NextResponse.json({ error: 'Target Shop ID is required' }, { status: 400 });
    }

    let htmlCode = '';
    let cssCode = '';
    let templateName = formTemplateName || ('uploaded-template-' + Date.now());
    const extractedVariables = new Set<string>();

    const FOLDER_PATH = `/barbersaas/${targetShopId}/${templateName}`;
    const uploadedIds: string[] = [];
    const fileMap: Record<string, string> = {};

    // First pass: upload all files to Google Drive (or extract from ZIP first)
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());

      if (file.name.endsWith('.zip')) {
        const zip = new AdmZip(buffer);
        const zipEntries = zip.getEntries();

        for (const zipEntry of zipEntries) {
          if (zipEntry.isDirectory) continue;
          
          const entryName = zipEntry.name; // e.g. "screen.png"
          const entryBuffer = zipEntry.getData();

          if (entryName.endsWith('.html')) {
            htmlCode = entryBuffer.toString('utf-8');
            if (!formTemplateName) {
                templateName = entryName.replace('.html', '');
            }
          } else if (entryName.endsWith('.css')) {
            cssCode = entryBuffer.toString('utf-8');
          } else {
             // Attempt to upload image/asset
             const ext = entryName.split('.').pop()?.toLowerCase() || '';
             let mimeType = 'application/octet-stream';
             if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
             else if (ext === 'png') mimeType = 'image/png';
             else if (ext === 'gif') mimeType = 'image/gif';
             else if (ext === 'svg') mimeType = 'image/svg+xml';
             else if (ext === 'webp') mimeType = 'image/webp';
             
             const fileId = await uploadFileToPath(FOLDER_PATH, entryName, mimeType, entryBuffer);
             if (fileId) {
               uploadedIds.push(fileId);
               fileMap[entryName] = fileId;
             }
          }
        }
      } else {
        const fileId = await uploadFileToPath(FOLDER_PATH, file.name, file.type, buffer);
        
        if (fileId) {
          uploadedIds.push(fileId);
          fileMap[file.name] = fileId;
        }

        // If we find html or css, we can optionally parse it
        if (file.name.endsWith('.html')) {
          htmlCode = buffer.toString('utf-8');
        } else if (file.name.endsWith('.css')) {
          cssCode = buffer.toString('utf-8');
        }
      }
    }

    // Second pass: Replace local paths in HTML/CSS with the new /api/assets/ URLs
    for (const [fileName, fileId] of Object.entries(fileMap)) {
      if (!fileName.endsWith('.html') && !fileName.endsWith('.css')) {
        // e.g. "screen.png" -> "/api/assets/12345"
        const assetUrl = `/api/assets/${fileId}`;
        const regex = new RegExp(fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        htmlCode = htmlCode.replace(regex, assetUrl);
        cssCode = cssCode.replace(regex, assetUrl);
      }
    }

    // Extract {{variables}} from HTML
    if (htmlCode) {
      // Matches anything inside {{ }}
      const regex = /\{\{([^{}]+)\}\}/g;
      let match;
      while ((match = regex.exec(htmlCode)) !== null) {
        const varName = match[1].trim();
        // Skip built-in Handlebars variables like shop.name or global colors
        if (!varName.startsWith('shop.') && !['primaryColor', 'secondaryColor'].includes(varName)) {
          extractedVariables.add(varName);
        }
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
          variables: Array.from(extractedVariables),
          shopId: targetShopId,
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      uploadedCount: uploadedIds.length,
      template: templateRecord,
      extractedVariables: Array.from(extractedVariables)
    });
  } catch (error: any) {
    console.error('Error uploading template files:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
