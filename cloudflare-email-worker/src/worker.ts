/**
 * KutzApp Email Worker
 * 
 * Receives HTTP POST requests from the Next.js app and sends emails
 * via Cloudflare's native EMAIL binding.
 */

interface Env {
 EMAIL: {
 send(options: {
  from: string;
  to: string;
  subject: string;
  html?: string;
  text?: string;
 }): Promise<{ messageId: string }>;
 };
 EMAIL_AUTH_SECRET: string;
}

interface EmailRequest {
 from: string;
 to: string;
 subject: string;
 html?: string;
 text?: string;
}

export default {
 async fetch(request: Request, env: Env): Promise<Response> {
 // CORS headers
 const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
 };

 if (request.method === 'OPTIONS') {
  return new Response(null, { headers: corsHeaders });
 }

 if (request.method !== 'POST') {
  return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders });
 }

 // Auth check
 const authHeader = request.headers.get('Authorization');
 const token = authHeader?.replace('Bearer ', '');

 if (!token || token !== env.EMAIL_AUTH_SECRET) {
  return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
 }

 try {
  const body: EmailRequest = await request.json();

  // Validate required fields
  if (!body.to || !body.subject) {
  return Response.json({ error: 'Missing required fields: to, subject' }, { status: 400, headers: corsHeaders });
  }

  // Send email via Cloudflare EMAIL binding
  const response = await env.EMAIL.send({
  from: body.from || 'notifications@kutzapp.com',
  to: body.to,
  subject: body.subject,
  html: body.html,
  text: body.text || body.html?.replace(/<[^>]*>/g, '') || '',
  });

  return Response.json(
  { success: true, messageId: response.messageId },
  { headers: corsHeaders }
  );
 } catch (error: any) {
  console.error('Email send error:', error);
  return Response.json(
  { error: 'Failed to send email', details: error.message },
  { status: 500, headers: corsHeaders }
  );
 }
 },
} satisfies ExportedHandler<Env>;
