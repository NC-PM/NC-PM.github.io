// Shared branded email HTML templates (inlined so Netlify Functions
// don't need to read files off disk at runtime).
// Placeholders: {{NAME}}, {{VERIFICATION_LINK}} / {{RESET_LINK}}

exports.verificationTemplate = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>معاينة إيميل التفعيل — NC-PM</title>
</head>
<body style="margin:0; padding:0; background:#EFEDFB; font-family:'Tahoma','Segoe UI',Arial,sans-serif;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EFEDFB; padding:40px 16px;">
<tr>
<td align="center">

<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px; width:100%; background:#FFFFFF; border-radius:20px; overflow:hidden; box-shadow:0 8px 30px rgba(108,108,225,0.18);">

  <!-- Header band with signature diagonal pattern -->
  <tr>
    <td style="background:linear-gradient(135deg,#6C6CE1 0%,#8285EA 60%,#6C6CE1 100%); background-color:#6C6CE1; padding:0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:36px 40px 30px; text-align:center;">
            <div style="font-family:'Tahoma','Segoe UI',Arial,sans-serif; font-size:26px; font-weight:bold; color:#FFFFFF; letter-spacing:1px;">
              NC-PM
            </div>
            <div style="font-family:'Tahoma','Segoe UI',Arial,sans-serif; font-size:12px; color:#E4C878; letter-spacing:2px; margin-top:6px; text-transform:uppercase;">
              National Center for Project Management
            </div>
          </td>
        </tr>
        <!-- thin gold accent rule with dot -->
        <tr>
          <td style="padding:0 40px 22px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="height:2px; background:rgba(228,200,120,0.35); width:45%;"></td>
                <td width="14" style="width:14px;">
                  <div style="width:8px; height:8px; border-radius:50%; background:#E4C878; margin:0 auto;"></div>
                </td>
                <td style="height:2px; background:rgba(228,200,120,0.35); width:45%;"></td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Body -->
  <tr>
    <td style="padding:40px 40px 8px; text-align:right;">
      <div style="font-family:'Tahoma','Segoe UI',Arial,sans-serif; font-size:20px; font-weight:bold; color:#171A21; margin-bottom:14px;">
        أهلًا {{NAME}} 👋
      </div>
      <div style="font-family:'Tahoma','Segoe UI',Arial,sans-serif; font-size:15px; line-height:1.9; color:#5B6472;">
        سعداء بانضمامك إلى <b style="color:#6C6CE1;">NC-PM</b> — بقي خطوة وحدة بسيطة لتفعيل حسابك والبدء في رحلتك نحو شهاداتك المهنية في إدارة المشاريع.
      </div>
    </td>
  </tr>

  <!-- CTA button -->
  <tr>
    <td style="padding:28px 40px 8px; text-align:center;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
        <tr>
          <td style="border-radius:999px; background:#C89B3C;">
            <a href="{{VERIFICATION_LINK}}" target="_blank" style="display:inline-block; padding:16px 48px; font-family:'Tahoma','Segoe UI',Arial,sans-serif; font-size:16px; font-weight:bold; color:#0F1B33; text-decoration:none; border-radius:999px;">
              تفعيل حسابي الآن ←
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- fallback link -->
  <tr>
    <td style="padding:18px 40px 8px; text-align:center;">
      <div style="font-family:'Tahoma','Segoe UI',Arial,sans-serif; font-size:11.5px; color:#9AA0AC;">
        إذا لم يعمل الزر، انسخ هذا الرابط والصقه في متصفحك:
      </div>
      <div style="font-family:'Tahoma','Segoe UI',Arial,sans-serif; font-size:11px; color:#6C6CE1; word-break:break-all; margin-top:6px; direction:ltr; display:inline-block;">
        {{VERIFICATION_LINK}}
      </div>
    </td>
  </tr>

  <!-- divider -->
  <tr>
    <td style="padding:28px 40px 0;">
      <div style="height:1px; background:#E5E1D6;"></div>
    </td>
  </tr>

  <!-- what's next mini section -->
  <tr>
    <td style="padding:24px 40px 8px; text-align:right;">
      <div style="font-family:'Tahoma','Segoe UI',Arial,sans-serif; font-size:13px; font-weight:bold; color:#171A21; margin-bottom:12px;">
        بعد التفعيل، بيكون بإمكانك:
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0; font-family:'Tahoma','Segoe UI',Arial,sans-serif; font-size:13px; color:#5B6472;">
            <span style="color:#6C6CE1;">◆</span>&nbsp; دخول بنك أسئلة PMP وPMI-ACP وPMI-RMP وCAPM
          </td>
        </tr>
        <tr>
          <td style="padding:6px 0; font-family:'Tahoma','Segoe UI',Arial,sans-serif; font-size:13px; color:#5B6472;">
            <span style="color:#6C6CE1;">◆</span>&nbsp; محاكاة اختبار فعلي بزمن محدد
          </td>
        </tr>
        <tr>
          <td style="padding:6px 0; font-family:'Tahoma','Segoe UI',Arial,sans-serif; font-size:13px; color:#5B6472;">
            <span style="color:#6C6CE1;">◆</span>&nbsp; حفظ نتائجك وتتبّع إنجازك عبر أي جهاز
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- footer -->
  <tr>
    <td style="padding:32px 40px 36px; text-align:center;">
      <div style="font-family:'Tahoma','Segoe UI',Arial,sans-serif; font-size:11.5px; color:#9AA0AC; line-height:1.8;">
        إذا لم تطلب إنشاء هذا الحساب، تجاهل هذا البريد ولن يتم اتخاذ أي إجراء.<br>
        © 2026 المركز الوطني لإدارة المشاريع NC-PM
      </div>
    </td>
  </tr>

  <!-- bottom accent strip -->
  <tr>
    <td style="height:6px; background:linear-gradient(90deg,#C89B3C 0%,#6C6CE1 100%); background-color:#6C6CE1;"></td>
  </tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`;

exports.passwordResetTemplate = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>معاينة إيميل إعادة تعيين كلمة المرور — NC-PM</title>
</head>
<body style="margin:0; padding:0; background:#EFEDFB; font-family:'Tahoma','Segoe UI',Arial,sans-serif;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EFEDFB; padding:40px 16px;">
<tr>
<td align="center">

<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px; width:100%; background:#FFFFFF; border-radius:20px; overflow:hidden; box-shadow:0 8px 30px rgba(108,108,225,0.18);">

  <!-- Header band with signature diagonal pattern -->
  <tr>
    <td style="background:linear-gradient(135deg,#6C6CE1 0%,#8285EA 60%,#6C6CE1 100%); background-color:#6C6CE1; padding:0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:36px 40px 30px; text-align:center;">
            <div style="font-family:'Tahoma','Segoe UI',Arial,sans-serif; font-size:26px; font-weight:bold; color:#FFFFFF; letter-spacing:1px;">
              NC-PM
            </div>
            <div style="font-family:'Tahoma','Segoe UI',Arial,sans-serif; font-size:12px; color:#E4C878; letter-spacing:2px; margin-top:6px; text-transform:uppercase;">
              National Center for Project Management
            </div>
          </td>
        </tr>
        <!-- thin gold accent rule with dot -->
        <tr>
          <td style="padding:0 40px 22px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="height:2px; background:rgba(228,200,120,0.35); width:45%;"></td>
                <td width="14" style="width:14px;">
                  <div style="width:8px; height:8px; border-radius:50%; background:#E4C878; margin:0 auto;"></div>
                </td>
                <td style="height:2px; background:rgba(228,200,120,0.35); width:45%;"></td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Body -->
  <tr>
    <td style="padding:40px 40px 8px; text-align:right;">
      <div style="font-family:'Tahoma','Segoe UI',Arial,sans-serif; font-size:20px; font-weight:bold; color:#171A21; margin-bottom:14px;">
        أهلًا {{NAME}} 🔒
      </div>
      <div style="font-family:'Tahoma','Segoe UI',Arial,sans-serif; font-size:15px; line-height:1.9; color:#5B6472;">
        وصلنا طلب لإعادة تعيين كلمة المرور الخاصة بحسابك في <b style="color:#6C6CE1;">NC-PM</b>. اضغط الزر أدناه لاختيار كلمة مرور جديدة.
      </div>
    </td>
  </tr>

  <!-- CTA button -->
  <tr>
    <td style="padding:28px 40px 8px; text-align:center;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
        <tr>
          <td style="border-radius:999px; background:#C89B3C;">
            <a href="{{RESET_LINK}}" target="_blank" style="display:inline-block; padding:16px 48px; font-family:'Tahoma','Segoe UI',Arial,sans-serif; font-size:16px; font-weight:bold; color:#0F1B33; text-decoration:none; border-radius:999px;">
              إعادة تعيين كلمة المرور ←
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- fallback link -->
  <tr>
    <td style="padding:18px 40px 8px; text-align:center;">
      <div style="font-family:'Tahoma','Segoe UI',Arial,sans-serif; font-size:11.5px; color:#9AA0AC;">
        إذا لم يعمل الزر، انسخ هذا الرابط والصقه في متصفحك:
      </div>
      <div style="font-family:'Tahoma','Segoe UI',Arial,sans-serif; font-size:11px; color:#6C6CE1; word-break:break-all; margin-top:6px; direction:ltr; display:inline-block;">
        {{RESET_LINK}}
      </div>
    </td>
  </tr>

  <!-- divider -->
  <tr>
    <td style="padding:28px 40px 0;">
      <div style="height:1px; background:#E5E1D6;"></div>
    </td>
  </tr>

  <!-- security note section -->
  <tr>
    <td style="padding:24px 40px 8px; text-align:right;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F2; border-radius:12px;">
        <tr>
          <td style="padding:16px 18px;">
            <div style="font-family:'Tahoma','Segoe UI',Arial,sans-serif; font-size:13px; color:#5B6472; line-height:1.8;">
              <b style="color:#171A21;">لم تطلب هذا؟</b><br>
              إذا لم تطلب إعادة تعيين كلمة المرور، تجاهل هذا البريد — حسابك آمن ولن يتغيّر شيء ما لم تضغط الرابط أعلاه.
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- footer -->
  <tr>
    <td style="padding:32px 40px 36px; text-align:center;">
      <div style="font-family:'Tahoma','Segoe UI',Arial,sans-serif; font-size:11.5px; color:#9AA0AC; line-height:1.8;">
        هذا الرابط صالح لفترة محدودة لأسباب أمنية.<br>
        © 2026 المركز الوطني لإدارة المشاريع NC-PM
      </div>
    </td>
  </tr>

  <!-- bottom accent strip -->
  <tr>
    <td style="height:6px; background:linear-gradient(90deg,#C89B3C 0%,#6C6CE1 100%); background-color:#6C6CE1;"></td>
  </tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`;
