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

// نتأكد من توفر fetch بغض النظر عن نسخة Node على Netlify —
// لو مو متوفرة تلقائيًا (global fetch)، نستخدم مكتبة node-fetch كبديل.
const fetchFn = (typeof fetch !== 'undefined') ? fetch : require('node-fetch');

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
  // نغلّف الدالة كاملة بـ try/catch عام — أي خطأ غير متوقع (حتى لو ببيانات
  // الاعتماد أو Firestore) يرجع كـ JSON واضح بدل ما ينهار بصفحة خطأ عامة
  // من Netlify لا تفيد بالتشخيص.
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

    if (!process.env.MYFATOORAH_API_KEY) {
      console.error('MYFATOORAH_API_KEY is not set in environment variables');
      return { statusCode: 500, body: JSON.stringify({ error: 'إعداد بوابة الدفع ناقص من جهة السيرفر (مفتاح MyFatoorah غير موجود).' }) };
    }

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

    const res = await fetchFn(`${MYFATOORAH_BASE_URL}/v2/SendPayment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MYFATOORAH_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const rawText = await res.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      console.error('MyFatoorah returned non-JSON response:', res.status, rawText);
      return { statusCode: 502, body: JSON.stringify({ error: `استجابة غير متوقعة من MyFatoorah (HTTP ${res.status}): ${rawText.slice(0, 300)}` }) };
    }

    if (!data.IsSuccess) {
      console.error('MyFatoorah SendPayment failed:', JSON.stringify(data));
      const validationDetail = Array.isArray(data.ValidationErrors)
        ? data.ValidationErrors.map(v => `${v.Name}: ${v.Error}`).join(' | ')
        : '';
      return {
        statusCode: 502,
        body: JSON.stringify({ error: [data.Message, validationDetail].filter(Boolean).join(' — ') || 'تعذر إنشاء عملية الدفع.' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ invoiceURL: data.Data.InvoiceURL, invoiceId: data.Data.InvoiceId }),
    };
  } catch (e) {
    console.error('initiate-payment unhandled error:', e && e.stack ? e.stack : e);
    return { statusCode: 500, body: JSON.stringify({ error: 'حدث خطأ غير متوقع بالسيرفر: ' + (e && e.message ? e.message : String(e)) }) };
  }
};
