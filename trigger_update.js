const fs = require('fs');

async function main() {
  const htmlContent = fs.readFileSync('public/html-sections/SportClips.html', 'utf8');
  
  const shopId = 'cmn9kj24n0000lqzc7kcsmpst'; // Heritage Haircuts

  const res = await fetch(`http://localhost:3000/api/temp-update-html`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shopId, customHtml: htmlContent })
  });
  
  const data = await res.json();
  console.log(data);
}

main();
