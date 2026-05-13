const fs = require('fs');

async function main() {
  try {
    const html = fs.readFileSync('/Users/rajaveerappan/barbersaas/barber-shop-website/public/html-sections/SportClips.html', 'utf8');
    
    console.log('Pushing to staging API...');
    const res = await fetch('https://barber-shop-website-ashy.vercel.app/api/shops/cmn9kj24n0000lqzc7kcsmpst/customization', {
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
      console.log('✅ Successfully updated staging and invalidated caches!');
    } else {
      const errorText = await res.text();
      console.log('❌ Failed to update staging:', res.status, errorText);
    }
  } catch (e) {
    console.error('Error:', e);
  }
}
main();