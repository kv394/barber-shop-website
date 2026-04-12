import { google } from 'googleapis';
import { Readable } from 'stream';

const getDriveService = () => {
  const credentialsString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!credentialsString) return null;
  try {
    const credentials = JSON.parse(credentialsString);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive.readonly'],
    });
    return google.drive({ version: 'v3', auth });
  } catch (e) {
    console.error('Error initializing Google Drive service:', e);
    return null;
  }
};

export async function getOrCreateFolder(tenantId: string): Promise<string | null> {
  const drive = getDriveService();
  if (!drive) throw new Error('Drive service not configured');

  // Search for the folder
  const query = `mimeType='application/vnd.google-apps.folder' and name='${tenantId}' and trashed=false`;
  const response = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  if (response.data.files && response.data.files.length > 0) {
    return response.data.files[0].id!;
  }

  // Create folder
  const fileMetadata = {
    name: tenantId,
    mimeType: 'application/vnd.google-apps.folder',
  };
  const folder = await drive.files.create({
    requestBody: fileMetadata,
    fields: 'id',
  });

  return folder.data.id || null;
}

export async function uploadFileToDrive(tenantId: string, fileName: string, mimeType: string, buffer: Buffer): Promise<string | null> {
  const drive = getDriveService();
  if (!drive) throw new Error('Drive service not configured');

  const folderId = await getOrCreateFolder(tenantId);
  if (!folderId) throw new Error('Could not create or find folder');

  const fileMetadata = {
    name: fileName,
    parents: [folderId],
  };

  // Convert buffer to readable stream
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  const media = {
    mimeType,
    body: stream,
  };

  const file = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id',
  });

  return file.data.id || null;
}
