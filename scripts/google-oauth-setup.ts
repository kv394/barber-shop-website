import { google } from 'googleapis';
import http from 'http';
import url from 'url';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function setupOAuth() {
  const credentialsString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!credentialsString) {
    console.error('❌ GOOGLE_APPLICATION_CREDENTIALS_JSON is not set in .env.local');
    process.exit(1);
  }

  let credentials;
  try {
    credentials = JSON.parse(credentialsString);
  } catch (e) {
    console.error('❌ Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON. Ensure it is valid JSON.');
    process.exit(1);
  }

  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web || {};
  
  if (!client_id || !client_secret) {
    console.error('❌ The JSON does not contain client_id or client_secret. Are you sure you downloaded an OAuth 2.0 Client ID?');
    process.exit(1);
  }

  const redirectUri = redirect_uris ? redirect_uris[0] : 'http://localhost:3000/oauth2callback';

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirectUri
  );

  const scopes = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/drive'
  ];

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent', // Force to get refresh token
    login_hint: 'commoninfo2all@gmail.com' // Use the designated test user
  });

  console.log('----------------------------------------------------');
  console.log('Authorize this app by visiting this url:');
  console.log(authUrl);
  console.log('----------------------------------------------------');
  
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('If your browser shows "This site can’t be reached" (localhost refused to connect), simply copy the ENTIRE URL from your browser address bar (it contains ?code=...) and paste it below.');
  console.log();
  
  readline.question('Paste the full redirect URL (or just the code): ', async (input: string) => {
    let code = input.trim();
    if (code.includes('code=')) {
      try {
        const urlObj = new URL(code);
        code = urlObj.searchParams.get('code') || code;
      } catch(e) {
        const match = code.match(/code=([^&]+)/);
        if (match) code = match[1];
      }
    }
    
    if (!code) {
      console.error('❌ No code found in input.');
      process.exit(1);
    }
    
    console.log('Got code, exchanging for tokens...');
    try {
      const { tokens } = await oAuth2Client.getToken(decodeURIComponent(code));
      console.log('\n✅ Success! Add the following line to your .env.local:\n');
      console.log(`GOOGLE_DRIVE_REFRESH_TOKEN="${tokens.refresh_token}"`);
      console.log('\nNote: You will also need to modify lib/google-drive.ts to use OAuth2 with this refresh token.');
    } catch(err) {
      console.error('❌ Error exchanging code for token:', err);
    }
    readline.close();
    process.exit(0);
  });
}

setupOAuth();
