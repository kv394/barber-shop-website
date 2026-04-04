/**
 * HTML email templates for BarberSaaS notifications.
 * Uses inline CSS for maximum email client compatibility.
 */

export function bookingConfirmationEmail({
  shopName,
  serviceName,
  staffName,
  dateTime,
  duration,
  price,
}: {
  shopName: string;
  serviceName: string;
  staffName: string;
  dateTime: string;
  duration: number;
  price: number;
}) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;">
    <tr><td style="background:#1a1a2e;padding:24px 32px;text-align:center;">
      <h1 style="color:#d4a843;margin:0;font-size:24px;">${shopName}</h1>
    </td></tr>
    <tr><td style="padding:32px;">
      <h2 style="color:#333;margin:0 0 8px;">Booking Confirmed! ✅</h2>
      <p style="color:#666;margin:0 0 24px;">Your appointment has been successfully booked.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:8px;border:1px solid #eee;">
        <tr><td style="padding:16px 20px;border-bottom:1px solid #eee;">
          <span style="color:#999;font-size:13px;">Service</span><br/>
          <span style="color:#333;font-size:16px;font-weight:bold;">${serviceName}</span>
        </td></tr>
        <tr><td style="padding:16px 20px;border-bottom:1px solid #eee;">
          <span style="color:#999;font-size:13px;">Date & Time</span><br/>
          <span style="color:#333;font-size:16px;font-weight:bold;">${dateTime}</span>
        </td></tr>
        <tr><td style="padding:16px 20px;border-bottom:1px solid #eee;">
          <span style="color:#999;font-size:13px;">Staff</span><br/>
          <span style="color:#333;font-size:16px;">${staffName}</span>
        </td></tr>
        <tr><td style="padding:16px 20px;border-bottom:1px solid #eee;">
          <span style="color:#999;font-size:13px;">Duration</span><br/>
          <span style="color:#333;font-size:16px;">${duration} minutes</span>
        </td></tr>
        <tr><td style="padding:16px 20px;">
          <span style="color:#999;font-size:13px;">Price</span><br/>
          <span style="color:#d4a843;font-size:20px;font-weight:bold;">$${price.toFixed(2)}</span>
        </td></tr>
      </table>
      <p style="color:#999;font-size:13px;margin-top:24px;text-align:center;">
        Need to cancel? You can do so up to 2 hours before your appointment from the My Appointments page.
      </p>
    </td></tr>
    <tr><td style="background:#1a1a2e;padding:16px 32px;text-align:center;">
      <p style="color:#666;font-size:12px;margin:0;">Powered by BarberSaaS</p>
    </td></tr>
  </table>
</body>
</html>`;
}

export function rescheduleConfirmationEmail({
  shopName,
  serviceName,
  staffName,
  oldDateTime,
  newDateTime,
  duration,
}: {
  shopName: string;
  serviceName: string;
  staffName: string;
  oldDateTime: string;
  newDateTime: string;
  duration: number;
}) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;">
    <tr><td style="background:#1a1a2e;padding:24px 32px;text-align:center;">
      <h1 style="color:#d4a843;margin:0;font-size:24px;">${shopName}</h1>
    </td></tr>
    <tr><td style="padding:32px;">
      <h2 style="color:#333;margin:0 0 8px;">Appointment Rescheduled 📅</h2>
      <p style="color:#666;margin:0 0 24px;">Your appointment has been moved to a new time.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:8px;border:1px solid #eee;">
        <tr><td style="padding:16px 20px;border-bottom:1px solid #eee;">
          <span style="color:#999;font-size:13px;">Service</span><br/>
          <span style="color:#333;font-size:16px;font-weight:bold;">${serviceName}</span>
        </td></tr>
        <tr><td style="padding:16px 20px;border-bottom:1px solid #eee;">
          <span style="color:#999;font-size:13px;">Previous Time</span><br/>
          <span style="color:#cc3333;font-size:14px;text-decoration:line-through;">${oldDateTime}</span>
        </td></tr>
        <tr><td style="padding:16px 20px;border-bottom:1px solid #eee;">
          <span style="color:#999;font-size:13px;">New Date & Time</span><br/>
          <span style="color:#333;font-size:16px;font-weight:bold;">${newDateTime}</span>
        </td></tr>
        <tr><td style="padding:16px 20px;">
          <span style="color:#999;font-size:13px;">Staff</span><br/>
          <span style="color:#333;font-size:16px;">${staffName}</span>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="background:#1a1a2e;padding:16px 32px;text-align:center;">
      <p style="color:#666;font-size:12px;margin:0;">Powered by BarberSaaS</p>
    </td></tr>
  </table>
</body>
</html>`;
}

export function giftCardEmail({
  shopName,
  senderName,
  recipientName,
  amount,
  code,
  message,
}: {
  shopName: string;
  senderName: string;
  recipientName: string;
  amount: number;
  code: string;
  message?: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;">
    <tr><td style="background:linear-gradient(135deg,#1a1a2e,#2d1b69);padding:32px;text-align:center;">
      <h1 style="color:#d4a843;margin:0;font-size:28px;">🎁 Gift Card</h1>
      <p style="color:#ccc;margin:8px 0 0;font-size:14px;">from ${shopName}</p>
    </td></tr>
    <tr><td style="padding:32px;text-align:center;">
      <p style="color:#666;font-size:16px;">${senderName} sent you a gift!</p>
      ${message ? `<p style="color:#333;font-style:italic;margin:16px 0;">"${message}"</p>` : ''}
      <div style="background:#f9f9f9;border:2px dashed #d4a843;border-radius:12px;padding:24px;margin:24px 0;display:inline-block;">
        <p style="color:#999;font-size:12px;margin:0;">Gift Card Value</p>
        <p style="color:#d4a843;font-size:36px;font-weight:bold;margin:8px 0;">$${amount.toFixed(2)}</p>
        <p style="color:#999;font-size:12px;margin:0;">Code</p>
        <p style="color:#333;font-size:20px;font-weight:bold;letter-spacing:3px;margin:8px 0;">${code}</p>
      </div>
      <p style="color:#999;font-size:13px;">Present this code at checkout to redeem.</p>
    </td></tr>
    <tr><td style="background:#1a1a2e;padding:16px 32px;text-align:center;">
      <p style="color:#666;font-size:12px;margin:0;">Powered by BarberSaaS</p>
    </td></tr>
  </table>
</body>
</html>`;
}

