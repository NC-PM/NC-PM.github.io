// netlify/functions/send-verification-email.js
//
// Called by the client right after registration, with the user's Firebase
// ID token in the Authorization header. Verifies the token server-side
// (so nobody can trigger this for an account that isn't theirs), generates
// the real verification link via Admin SDK, and sends our branded HTML
// email through Resend.
//
// Required environment variables (set in Netlify dashboard):
//   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
//   RESEND_API_KEY
//
// Optional:
//   SENDER_EMAIL   (default: verify@nc-pm.com)
//   SENDER_NAME    (default: NC-PM)
//   CONTINUE_URL   (default: https://nc-pm.com/index.html)

const { getAdmin } = require('./_firebase-admin');
const { verificationTemplate } = require('./_email-templates');

const SENDER_EMAIL = process.env.SENDER_EMAIL || 'verify@nc-pm.com';
const SENDER_NAME = process.env.SENDER_NAME || 'NC-PM';
const CONTINUE_URL = process.env.CONTINUE_URL || 'https://nc-pm.com/index.html';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const authHeader = event.headers.authorization || event.headers.Authorization || '';
  const idToken = authHeader.replace(/^Bearer\s+/i, '');
  if (!idToken) {
    return { statusCode: 401, body: JSON.stringify({ error: 'يجب تسجيل الدخول أولًا.' }) };
  }

  const admin = getAdmin();

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(idToken);
  } catch (e) {
    return { statusCode: 401, body: JSON.stringify({ error: 'جلسة غير صالحة، سجّل الدخول من جديد.' }) };
  }

  try {
    const userRecord = await admin.auth().getUser(decoded.uid);
    const email = userRecord.email;
    const name = userRecord.displayName || 'عميلنا العزيز';

    if (!email) {
      return { statusCode: 400, body: JSON.stringify({ error: 'لا يوجد بريد إلكتروني مرتبط بهذا الحساب.' }) };
    }

    const actionCodeSettings = { url: CONTINUE_URL, handleCodeInApp: false };
    const verificationLink = await admin.auth().generateEmailVerificationLink(email, actionCodeSettings);

    const html = verificationTemplate
      .replace(/{{VERIFICATION_LINK}}/g, verificationLink)
      .replace(/{{NAME}}/g, name);

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
        to: [email],
        subject: 'فعّل حسابك في NC-PM',
        html,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('Resend send failed:', errText);
      return { statusCode: 502, body: JSON.stringify({ error: 'تعذّر إرسال إيميل التفعيل، حاول مرة أخرى.' }) };
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (e) {
    console.error('send-verification-email error:', e);
    return { statusCode: 500, body: JSON.stringify({ error: 'حدث خطأ غير متوقع.' }) };
  }
};
