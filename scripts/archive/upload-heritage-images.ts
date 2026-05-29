import { uploadFileToPath } from '../lib/google-drive';
import fs from 'fs';
import path from 'path';

const images = {
  hero: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=2000&auto=format&fit=crop',
  detail: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=1000&auto=format&fit=crop',
  elena: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1000&auto=format&fit=crop',
  jasmine: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?q=80&w=1000&auto=format&fit=crop',
  marcus: 'https://images.unsplash.com/photo-1593702275687-f8b402bf1fb5?q=80&w=1000&auto=format&fit=crop',
  nape: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=1000&auto=format&fit=crop',
};

async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function main() {
  const folderName = 'heritage-haircuts-template';
  const urls: Record<string, string> = {};

  console.log(`Uploading images to Google Drive folder: ${folderName}`);

  for (const [key, url] of Object.entries(images)) {
    console.log(`Downloading ${key}...`);
    const buffer = await downloadImage(url);
    const mimeType = 'image/jpeg';
    
    console.log(`Uploading ${key}...`);
    const fileId = await uploadFileToPath(folderName, `${key}.jpg`, mimeType, buffer);
    
    if (fileId) {
      const driveUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
      urls[key] = driveUrl;
      console.log(`✅ Uploaded ${key}: ${driveUrl}`);
    } else {
      console.error(`❌ Failed to upload ${key}`);
    }
  }

  // Now read the route.ts file and replace the urls
  const routePath = path.join(__dirname, '../app/api/apply-heritage/route.ts');
  let code = fs.readFileSync(routePath, 'utf8');

  if (urls.hero) code = code.replace(images.hero, urls.hero);
  if (urls.detail) code = code.replace(images.detail, urls.detail);
  if (urls.elena) code = code.replace(images.elena, urls.elena);
  if (urls.jasmine) code = code.replace(images.jasmine, urls.jasmine);
  if (urls.marcus) code = code.replace(images.marcus, urls.marcus);
  if (urls.nape) code = code.replace(images.nape, urls.nape);

  fs.writeFileSync(routePath, code);
  console.log('\\n✅ Updated app/api/apply-heritage/route.ts with Google Drive URLs!');
}

main().catch(console.error);
