// netlify/functions/verify-payment.js
//
// Called by the client after returning from Moyasar's hosted invoice
// page (invoice id comes back as "id" in the redirect URL query string).
// Verifies the payment status directly with Moyasar's server (never
// trusts the browser), and if paid + matches this user/course, marks the
// purchase in Firestore using the Admin SDK — the only path that can
// write to `purchases` now that the Firestore rules deny client writes there.
//
// Required environment variables: same as initiate-payment.js
//   MOYASAR_SECRET_KEY

const { getAdmin } = require('./_firebase-admin');

// نتأكد من توفر fetch بغض النظر عن نسخة Node على Netlify —
// لو مو متوفرة تلقائيًا (global fetch)، نستخدم مكتبة node-fetch كبديل.
const fetchFn = (typeof fetch !== 'undefined') ? fetch : require('node-fetch');

const MOYASAR_BASE_URL = 'https://api.moyasar.com/v1';

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

    // paymentId هنا هو invoice id اللي يرجع بالـ callback من ميسر (?id=...)
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

    if (!process.env.MOYASAR_SECRET_KEY) {
      console.error('MOYASAR_SECRET_KEY is not set in environment variables');
      return { statusCode: 500, body: JSON.stringify({ error: 'إعداد بوابة الدفع ناقص من جهة السيرفر.' }) };
    }

    const authToken = Buffer.from(`${process.env.MOYASAR_SECRET_KEY}:`).toString('base64');

    const res = await fetchFn(`${MOYASAR_BASE_URL}/invoices/${paymentId}`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${authToken}`,
      },
    });

    const rawText = await res.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      console.error('Moyasar returned non-JSON response:', res.status, rawText);
      return { statusCode: 502, body: JSON.stringify({ error: `استجابة غير متوقعة من Moyasar (HTTP ${res.status}): ${rawText.slice(0, 300)}` }) };
    }

    if (!res.ok) {
      console.error('Moyasar GetInvoice failed:', JSON.stringify(data));
      return { statusCode: 502, body: JSON.stringify({ error: (data && data.message) || 'تعذر الاستعلام عن حالة الدفع.' }) };
    }

    const status = data && data.status; // 'initiated' | 'paid' | 'failed' | 'expired' ...
    const metadata = (data && data.metadata) || {};
    const reference = metadata.reference || '';

    if (status !== 'paid') {
      return { statusCode: 200, body: JSON.stringify({ paid: false, status: status || 'unknown' }) };
    }

    if (reference !== `${uid}_${courseId}`) {
      return { statusCode: 403, body: JSON.stringify({ error: 'بيانات الدفع غير متطابقة.' }) };
    }

    const db = admin.firestore();
    await db.doc(`users/${uid}/purchases/${courseId}`).set({
      purchasedAt: admin.firestore.FieldValue.serverTimestamp(),
      amount: (data.amount || 0) / 100, // تحويل من هللات لريال
      gateway: 'moyasar',
      invoiceId: data.id,
    });

    return { statusCode: 200, body: JSON.stringify({ paid: true }) };
  } catch (e) {
    console.error('verify-payment unhandled error:', e && e.stack ? e.stack : e);
    return { statusCode: 500, body: JSON.stringify({ error: 'تعذر التحقق من حالة الدفع: ' + (e && e.message ? e.message : String(e)) }) };
  }
};
