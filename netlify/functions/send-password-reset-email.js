// netlify/functions/send-password-reset-email.js
//
// Public endpoint (no login required — that's the point of "forgot
// password"). Takes { email } in the request body. To avoid leaking which
// emails have accounts, this ALWAYS responds with { success: true },
// whether or not the address is registered.
//
// Required environment variables (set in Netlify dashboard):
//   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
//   RESEND_API_KEY
//
// Optional:
//   SENDER_EMAIL, SENDER_NAME, CONTINUE_URL (same defaults as verification)

const { getAdmin } = require('./_firebase-admin');
const { passwordResetTemplate } = require('./_email-templates');

const SENDER_EMAIL = process.env.SENDER_EMAIL || 'verify@nc-pm.com';
const SENDER_NAME = process.env.SENDER_NAME || 'NC-PM';
const CONTINUE_URL = process.env.CONTINUE_URL || 'https://nc-pm.com/index.html';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let email;
  try {
    email = (JSON.parse(event.body || '{}').email || '').trim().toLowerCase();
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'طلب غير صالح.' }) };
  }

  if (!email) {
    return { statusCode: 400, body: JSON.stringify({ error: 'الرجاء إدخال بريد إلكتروني.' }) };
  }

  const admin = getAdmin();

  let userRecord;
  try {
    userRecord = await admin.auth().getUserByEmail(email);
  } catch (e) {
    // No such account — respond success anyway, don't reveal existence.
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  }

  try {
    const actionCodeSettings = { url: CONTINUE_URL, handleCodeInApp: false };
    const resetLink = await admin.auth().generatePasswordResetLink(email, actionCodeSettings);

    const html = passwordResetTemplate
      .replace(/{{RESET_LINK}}/g, resetLink)
      .replace(/{{NAME}}/g, userRecord.displayName || 'عميلنا العزيز');

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
        to: [email],
        subject: 'إعادة تعيين كلمة المرور - NC-PM',
        html,
      }),
    });

    if (!resp.ok) {
      console.error('Resend send failed (password reset):', await resp.text());
      // Still respond success — don't leak internals or break UX.
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (e) {
    console.error('send-password-reset-email error:', e);
    // Even on unexpected errors, avoid leaking account existence.
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  }
};
