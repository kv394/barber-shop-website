import { google } from 'googleapis';
import { Readable } from 'stream';

const getDriveService = () => {
  const credentialsString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!credentialsString) return null;

  try {
    const credentials = JSON.parse(credentialsString);
    
    // If we have a refresh token, use OAuth2 client (for OAuth Client ID JSON)
    const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
    if (refreshToken) {
      const clientAuth = credentials.installed || credentials.web || credentials;
      const { client_secret, client_id, redirect_uris } = clientAuth;
      
      const oAuth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris ? redirect_uris[0] : 'urn:ietf:wg:oauth:2.0:oob'
      );
      
      oAuth2Client.setCredentials({ refresh_token: refreshToken });
      return google.drive({ version: 'v3', auth: oAuth2Client });
    }

    // Fallback to Service Account
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/drive'],
    });
    return google.drive({ version: 'v3', auth });
  } catch (e) {
    console.error('Error initializing Google Drive service:', e);
    return null;
  }
};

export async function getOrCreateFolder(folderName: string, parentId?: string): Promise<string | null> {
  const drive = getDriveService();
  if (!drive) throw new Error('Drive service not configured');

  // Search for the folder
  let query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  }

  const response = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  if (response.data.files && response.data.files.length > 0) {
    return response.data.files[0].id!;
  }

  // Create folder
  const fileMetadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) {
    fileMetadata.parents = [parentId];
  }

  const folder = await drive.files.create({
    requestBody: fileMetadata,
    fields: 'id',
  });

  return folder.data.id || null;
}

export async function uploadFileToFolder(folderId: string, fileName: string, mimeType: string, buffer: Buffer): Promise<string | null> {
  const drive = getDriveService();
  if (!drive) throw new Error('Drive service not configured');

  // Check if file exists first to overwrite it
  const query = `name='${fileName}' and '${folderId}' in parents and trashed=false`;
  const response = await drive.files.list({
    q: query,
    fields: 'files(id)',
    spaces: 'drive',
  });

  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  const media = {
    mimeType,
    body: stream,
  };

  if (response.data.files && response.data.files.length > 0) {
    // Update existing file
    const fileId = response.data.files[0].id!;
    const file = await drive.files.update({
      fileId,
      media,
      fields: 'id',
    });
    return file.data.id || null;
  } else {
    // Create new file
    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };
    const file = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id',
    });
    return file.data.id || null;
  }
}

export async function uploadFileToDrive(tenantId: string, fileName: string, mimeType: string, buffer: Buffer): Promise<string | null> {
  const folderId = await getOrCreateFolder(tenantId);
  if (!folderId) throw new Error('Could not create or find folder');
  return uploadFileToFolder(folderId, fileName, mimeType, buffer);
}

export async function getOrCreatePath(path: string): Promise<string | null> {
  const parts = path.split('/').filter(p => p.trim() !== '');
  let currentParentId: string | undefined = undefined;
  
  for (const part of parts) {
    const folderId = await getOrCreateFolder(part, currentParentId);
    if (!folderId) return null;
    currentParentId = folderId;
  }
  
  return currentParentId || null;
}

export async function uploadFileToPath(path: string, fileName: string, mimeType: string, buffer: Buffer): Promise<string | null> {
  const folderId = await getOrCreatePath(path);
  if (!folderId) throw new Error('Could not create or find path');
  return uploadFileToFolder(folderId, fileName, mimeType, buffer);
}

export async function downloadFileFromFolder(folderId: string, fileName: string): Promise<string | null> {
  const drive = getDriveService();
  if (!drive) return null;

  const query = `name='${fileName}' and '${folderId}' in parents and trashed=false`;
  const response = await drive.files.list({
    q: query,
    fields: 'files(id)',
    spaces: 'drive',
  });

  if (response.data.files && response.data.files.length > 0) {
    const fileId = response.data.files[0].id!;
    const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'text' });
    return res.data as string;
  }
  return null;
}
