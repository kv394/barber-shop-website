import { POST } from './app/api/chat/booking/route';
import { NextRequest } from 'next/server';

async function run() {
  const req = new NextRequest('http://localhost/api/chat/booking', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
    body: JSON.stringify({
      shopId: 'missouri-city',
      messages: [
        { role: 'user', content: 'I want a haircut' },
        { role: 'assistant', content: 'Which haircut service would you like?\n1. Haircuts [Men] - $35 (30 mins)\n2. Haircuts [Kids] - $30 (30 mins)' },
        { role: 'user', content: '1' },
        { role: 'assistant', content: 'Would you like a specific staff member?\n1. Any staff\n2. Elena Ramirez' },
        { role: 'user', content: '2' },
        { role: 'assistant', content: 'When would you like to come in? You can say "tomorrow", "next Friday", or provide a specific date.' },
        { role: 'user', content: 'tomorrow' },
        { role: 'assistant', content: 'Here are the available times:\n1. 09:00\n2. 09:30' },
        { role: 'user', content: '2' },
        { role: 'assistant', content: 'Great. Please provide your name and phone number.' },
        { role: 'user', content: 'Bob, 555-1234' }
      ]
    })
  });
  
  const res = await POST(req);
  console.log(res.status);
  const data = await res.json();
  console.log(data);
}
run();
