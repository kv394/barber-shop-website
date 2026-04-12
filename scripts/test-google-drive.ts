import { getOrCreateFolder } from '../lib/google-drive';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testGoogleDrive() {
  try {
    console.log('Testing Google Drive integration...');
    console.log('Checking GOOGLE_APPLICATION_CREDENTIALS_JSON...');
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      console.error('❌ GOOGLE_APPLICATION_CREDENTIALS_JSON is not set in .env.local');
      process.exit(1);
    }
    
    console.log('✅ Credentials found in environment. Attempting to create/get a test folder...');
    const folderId = await getOrCreateFolder('test-connection-folder');
    
    if (folderId) {
      console.log(`✅ Success! Folder ID: ${folderId}`);
    } else {
      console.error('❌ Failed to get or create folder. Returned null.');
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('client_email')) {
      console.error('❌ Error: You are using an OAuth 2.0 Client ID JSON, but GOOGLE_DRIVE_REFRESH_TOKEN is not set in .env.local.');
      console.error('👉 Please run `npx tsx scripts/google-oauth-setup.ts` to generate the refresh token, then add it to .env.local.');
    } else {
      console.error('❌ Error during Google Drive test:', error);
    }
  }
}

testGoogleDrive();