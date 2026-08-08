// netlify/functions/verify-payment.js
//
// Called by the client after returning from MyFatoorah's hosted payment
// page (paymentId comes back in the redirect URL). Verifies the payment
// status directly with MyFatoorah's server (never trusts the browser),
// and if paid + matches this user/course, marks the purchase in Firestore
// using the Admin SDK — the only path that can write to `purchases` now
// that the Firestore rules deny client writes there.
//
// Required environment variables: same as initiate-payment.js

const { getAdmin } = require('./_firebase-admin');

// نتأكد من توفر fetch بغض النظر عن نسخة Node على Netlify —
// لو مو متوفرة تلقائيًا (global fetch)، نستخدم مكتبة node-fetch كبديل.
const fetchFn = (typeof fetch !== 'undefined') ? fetch : require('node-fetch');

const MYFATOORAH_BASE_URL = 'https://api.myfatoorah.com';

exports.handler = async (event) => {
  // نغلّف الدالة كاملة بـ try/catch عام لنفس الأسباب الموجودة بـinitiate-payment.js
  try {
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

    let paymentId, courseId;
    try {
      const parsed = JSON.parse(event.body || '{}');
      paymentId = parsed.paymentId;
      courseId = parsed.courseId;
    } catch (e) {
      return { statusCode: 400, body: JSON.stringify({ error: 'طلب غير صالح.' }) };
    }

    if (!paymentId || !courseId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'بيانات ناقصة.' }) };
    }

    const uid = decoded.uid;

    if (!process.env.MYFATOORAH_API_KEY) {
      console.error('MYFATOORAH_API_KEY is not set in environment variables');
      return { statusCode: 500, body: JSON.stringify({ error: 'إعداد بوابة الدفع ناقص من جهة السيرفر.' }) };
    }

    const res = await fetchFn(`${MYFATOORAH_BASE_URL}/v2/GetPaymentStatus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MYFATOORAH_API_KEY}`,
      },
      body: JSON.stringify({ Key: paymentId, KeyType: 'PaymentId' }),
    });

    const rawText = await res.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      console.error('MyFatoorah returned non-JSON response:', res.status, rawText);
      return { statusCode: 502, body: JSON.stringify({ error: `استجابة غير متوقعة من MyFatoorah (HTTP ${res.status}): ${rawText.slice(0, 300)}` }) };
    }

    const status = data && data.Data && data.Data.InvoiceStatus;
    const reference = (data && data.Data && data.Data.CustomerReference) || '';

    if (status !== 'Paid') {
      return { statusCode: 200, body: JSON.stringify({ paid: false, status: status || 'unknown' }) };
    }

    if (reference !== `${uid}_${courseId}`) {
      return { statusCode: 403, body: JSON.stringify({ error: 'بيانات الدفع غير متطابقة.' }) };
    }

    const db = admin.firestore();
    await db.doc(`users/${uid}/purchases/${courseId}`).set({
      purchasedAt: admin.firestore.FieldValue.serverTimestamp(),
      amount: data.Data.InvoiceValue,
      gateway: 'myfatoorah',
      invoiceId: data.Data.InvoiceId,
    });

    return { statusCode: 200, body: JSON.stringify({ paid: true }) };
  } catch (e) {
    console.error('verify-payment unhandled error:', e && e.stack ? e.stack : e);
    return { statusCode: 500, body: JSON.stringify({ error: 'تعذر التحقق من حالة الدفع: ' + (e && e.message ? e.message : String(e)) }) };
  }
};
