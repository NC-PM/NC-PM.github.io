// netlify/functions/initiate-payment.js
//
// Called by the client with the user's Firebase ID token in the
// Authorization header + { courseId } in the body. Creates a MyFatoorah
// hosted payment invoice and returns its URL for the browser to redirect to.
//
// Required environment variables (Netlify dashboard — نفس الموجودة
// أصلاً لملفات الإيميل + وحدة جديدة):
//   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY  (موجودة أصلاً)
//   MYFATOORAH_API_KEY   (جديد — التوكن اللي أنشأته بحساب MyFatoorah)
//
// Optional:
//   SITE_BASE_URL   (default: https://nc-pm.com)

const { getAdmin } = require('./_firebase-admin');

const MYFATOORAH_BASE_URL = 'https://api.myfatoorah.com'; // مفتاح Live حقيقي
const SITE_BASE_URL = process.env.SITE_BASE_URL || 'https://nc-pm.com';

// عدّل الأسعار حسب منتجاتك الفعلية
const COURSE_PRICES = {
  capm: 200,
  pmp: 200,
  acp: 200,
  rmp: 200,
};

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

  // ممنوع الدفع بدون بريد مفعّل — قرار نهائي من السيرفر، ما يُلتف عليه من المتصفح
  if (!decoded.email_verified) {
    return { statusCode: 403, body: JSON.stringify({ error: 'يجب تفعيل بريدك الإلكتروني أولًا قبل الدفع.' }) };
  }

  let courseId;
  try {
    courseId = JSON.parse(event.body || '{}').courseId;
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'طلب غير صالح.' }) };
  }

  const price = COURSE_PRICES[courseId];
  if (!price) {
    return { statusCode: 400, body: JSON.stringify({ error: 'منتج غير معروف.' }) };
  }

  const uid = decoded.uid;
  const db = admin.firestore();

  // امنع إعادة الدفع لو مشترك مسبقًا
  const existing = await db.doc(`users/${uid}/purchases/${courseId}`).get();
  if (existing.exists) {
    return { statusCode: 409, body: JSON.stringify({ error: 'أنت مشترك مسبقًا بهذا المنتج.' }) };
  }

  const userRecord = await admin.auth().getUser(uid);
  const email = userRecord.email || '';
  const reference = `${uid}_${courseId}`;

  const body = {
    CustomerName: userRecord.displayName || (email.split('@')[0] || 'Customer'),
    NotificationOption: 'LNK',
    InvoiceValue: price,
    DisplayCurrencyIso: 'SAR',
    CustomerEmail: email,
    CallBackUrl: `${SITE_BASE_URL}/enroll.html?course=${courseId}`,
    ErrorUrl: `${SITE_BASE_URL}/enroll.html?course=${courseId}&payment=failed`,
    Language: 'AR',
    CustomerReference: reference,
    InvoiceItems: [
      { ItemName: `اشتراك ${courseId.toUpperCase()}`, Quantity: 1, UnitPrice: price },
    ],
  };

  try {
    const res = await fetch(`${MYFATOORAH_BASE_URL}/v2/SendPayment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MYFATOORAH_API_KEY}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (!data.IsSuccess) {
      console.error('MyFatoorah SendPayment failed:', data);
      return { statusCode: 502, body: JSON.stringify({ error: data.Message || 'تعذر إنشاء عملية الدفع.' }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ invoiceURL: data.Data.InvoiceURL, invoiceId: data.Data.InvoiceId }),
    };
  } catch (e) {
    console.error('initiate-payment error:', e);
    return { statusCode: 500, body: JSON.stringify({ error: 'حدث خطأ غير متوقع.' }) };
  }
};
