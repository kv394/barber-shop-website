const fs = require('fs');
require('dotenv').config({ path: '.env.staging' });

async function main() {
  try {
    const html = fs.readFileSync('public/html-sections/SportClips.html', 'utf8');
    
    // Determine target URL based on environment or default to staging
    const targetDomain = process.env.NEXT_PUBLIC_SITE_URL || 'https://barber-shop-website-ashy.vercel.app';
    const apiUrl = `${targetDomain}/api/shops/cmn9kj24n0000lqzc7kcsmpst/customization`;
    
    console.log(`Pushing to API: ${apiUrl}...`);
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customization: {
          customHtml: html
        }
      })
    });

    if (res.ok) {
      console.log('✅ Successfully updated database via API and invalidated caches!');
    } else {
      const errorText = await res.text();
      console.log('❌ Failed to update via API:', res.status, errorText);
    }
  } catch (e) {
    console.error('Error:', e);
  }
}
main();