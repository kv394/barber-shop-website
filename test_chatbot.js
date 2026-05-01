const http = require('http');

async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/chat/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shopId: 'missouri-city',
        messages: [{ role: 'user', content: 'I want a haircut today.' }]
      })
    });
    console.log(res.status);
    const json = await res.json();
    console.log(JSON.stringify(json, null, 2));
  } catch(e) {
    console.error(e);
  }
}
test();
