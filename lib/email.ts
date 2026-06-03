/**
 * Email Service — sends emails via Resend API
 * 
 * Env vars needed:
 * - RESEND_API_KEY: Your Resend API key
 * - EMAIL_FROM: Sender address (default: notifications@kutzapp.com)
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL = process.env.EMAIL_FROM || 'KutzApp <onboarding@resend.dev>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://kutzapp.com';

interface SendEmailOptions {
 to: string;
 subject: string;
 html: string;
 text?: string;
 from?: string;
}

async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
 if (!RESEND_API_KEY) {
 console.warn('[EMAIL] RESEND_API_KEY not configured, skipping email send');
 return { success: false, error: 'Email service not configured' };
 }

 try {
 const res = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${RESEND_API_KEY}`,
  },
  body: JSON.stringify({
  from: options.from || FROM_EMAIL,
  to: [options.to],
  subject: options.subject,
  html: options.html,
  text: options.text || options.html.replace(/<[^>]*>/g, ''),
  }),
 });

 const data = await res.json();

 if (!res.ok) {
  console.error('[EMAIL] Resend error:', res.status, JSON.stringify(data));
  return { success: false, error: `Resend returned ${res.status}: ${data.message || JSON.stringify(data)}` };
 }

 console.log('[EMAIL] Sent successfully to', options.to, 'id:', data.id);
 return { success: true, messageId: data.id };
 } catch (error: any) {
 console.error('[EMAIL] Failed to send:', error.message);
 return { success: false, error: error.message };
 }
}

// ── Email Templates ─────────────────────────────────────────────────────

function baseTemplate(content: string): string {
 return `
<!DOCTYPE html>
<html>
<head>
 <meta charset="utf-8">
 <meta name="viewport" content="width=device-width, initial-scale=1.0">
 <style>
 body { margin: 0; padding: 0; background: #0f0f14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
 .container { max-width: 560px; margin: 0 auto; padding: 40px 20px; }
 .card { background: #1a1a24; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 40px 32px; }
 .logo { text-align: center; margin-bottom: 32px; }
 .logo span { font-size: 24px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
 .logo .dot { color: #7c5cfc; }
 h1 { color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 8px 0; }
 p { color: #9898a8; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0; }
 .btn { display: inline-block; background: #7c5cfc; color: #ffffff !important; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px; margin: 24px 0; }
 .btn:hover { background: #6b4de6; }
 .code-box { background: #12121a; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
 .code { font-size: 32px; font-weight: 800; color: #7c5cfc; letter-spacing: 8px; font-family: monospace; }
 .footer { text-align: center; padding-top: 24px; }
 .footer p { color: #5a5a6e; font-size: 12px; }
 .divider { border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 28px 0; }
 </style>
</head>
<body>
 <div class="container">
 <div class="card">
  <div class="logo"><span>Kutz<span class="dot">App</span></span></div>
  ${content}
 </div>
 <div class="footer">
  <p>© ${new Date().getFullYear()} KutzApp. All rights reserved.</p>
  <p>The Ultimate Operating System for Barbershops</p>
 </div>
 </div>
</body>
</html>`;
}

// ── Public API ───────────────────────────────────────────────────────────

export const emailService = {
 /**
 * Send a staff/team member invite email
 */
 async sendInvite(options: {
 to: string;
 shopName: string;
 role: string;
 invitedBy?: string;
 }) {
 const roleName = options.role.replace('_', ' ').toLowerCase();
 const signUpUrl = `${APP_URL}/sign-up`;

 const html = baseTemplate(`
  <h1>You're invited! 🎉</h1>
  <p>You've been invited to join <strong style="color:#fff">${options.shopName}</strong> as a <strong style="color:#7c5cfc">${roleName}</strong> on KutzApp.</p>
  ${options.invitedBy ? `<p>Invited by: <strong style="color:#fff">${options.invitedBy}</strong></p>` : ''}
  <hr class="divider">
  <p>Create your account to get started:</p>
  <div style="text-align:center">
  <a href="${signUpUrl}" class="btn">Create Account →</a>
  </div>
  <p style="font-size:12px;color:#5a5a6e">Use this email address (<strong>${options.to}</strong>) when signing up.</p>
 `);

 return sendEmail({
  to: options.to,
  subject: `You're invited to ${options.shopName} on KutzApp`,
  html,
 });
 },

 /**
 * Send a password reset link
 */
 async sendPasswordReset(options: {
 to: string;
 resetUrl: string;
 userName?: string;
 }) {
 const html = baseTemplate(`
  <h1>Reset your password</h1>
  <p>Hi${options.userName ? ` <strong style="color:#fff">${options.userName}</strong>` : ''},</p>
  <p>We received a request to reset your password. Click the button below to choose a new one:</p>
  <div style="text-align:center">
  <a href="${options.resetUrl}" class="btn">Reset Password →</a>
  </div>
  <hr class="divider">
  <p style="font-size:12px;color:#5a5a6e">If you didn't request this, you can safely ignore this email. This link expires in 1 hour.</p>
 `);

 return sendEmail({
  to: options.to,
  subject: 'Reset your KutzApp password',
  html,
 });
 },

 /**
 * Send booking confirmation
 */
 async sendBookingConfirmation(options: {
 to: string;
 clientName: string;
 shopName: string;
 serviceName: string;
 staffName: string;
 dateTime: string;
 bookingId?: string;
 }) {
 const html = baseTemplate(`
  <h1>Booking Confirmed ✅</h1>
  <p>Hi <strong style="color:#fff">${options.clientName}</strong>,</p>
  <p>Your appointment has been confirmed!</p>
  <div class="code-box" style="text-align:left">
  <table style="width:100%;border-spacing:0 8px">
   <tr><td style="color:#5a5a6e;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding-right:16px;white-space:nowrap">Shop</td><td style="color:#fff;font-weight:600;font-size:14px">${options.shopName}</td></tr>
   <tr><td style="color:#5a5a6e;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding-right:16px;white-space:nowrap">Service</td><td style="color:#fff;font-weight:600;font-size:14px">${options.serviceName}</td></tr>
   <tr><td style="color:#5a5a6e;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding-right:16px;white-space:nowrap">Barber</td><td style="color:#fff;font-weight:600;font-size:14px">${options.staffName}</td></tr>
   <tr><td style="color:#5a5a6e;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding-right:16px;white-space:nowrap">When</td><td style="color:#7c5cfc;font-weight:700;font-size:14px">${options.dateTime}</td></tr>
  </table>
  </div>
  <div style="text-align:center">
  <a href="${APP_URL}/my-appointments" class="btn">View My Appointments</a>
  </div>
 `);

 return sendEmail({
  to: options.to,
  subject: `Appointment confirmed at ${options.shopName}`,
  html,
 });
 },

 /**
 * Send a generic email
 */
 async send(options: SendEmailOptions) {
 if (options.html && !options.html.includes('<!DOCTYPE')) {
  options.html = baseTemplate(options.html);
 }
 return sendEmail(options);
 },
};
