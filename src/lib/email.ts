interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey || apiKey === "re_your_api_key_here") {
    console.log("Email would be sent to:", to);
    console.log("Subject:", subject);
    console.log("BODY:", html);
    return { success: true, message: "Email logged (API key not configured)" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "HoneyStore <onboarding@resend.dev>",
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send email: ${response.statusText}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Email error:", error);
    return { success: false, error };
  }
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function generatePasswordResetEmail(code: string, email: string, resetUrl?: string) {
  const baseUrl = resetUrl || process.env.NEXTAUTH_URL || "https://honeystore-seven.vercel.app";
  const link = `${baseUrl}/reset-password?email=${encodeURIComponent(email)}&code=${code}`;
  
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; color: #d4a574; }
        .button { display: block; width: fit-content; margin: 20px auto; background: #d97706; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; }
        .code { font-size: 24px; font-weight: bold; color: #333; text-align: center; margin: 30px 0; letter-spacing: 3px; background: #fef3c7; padding: 15px; border-radius: 8px; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🍯 استعادة كلمة المرور</div>
        </div>
        <h2 style="text-align: center;">مرحباً بك في HoneyStore</h2>
        <p style="text-align: center; color: #666;">اضغط على الزر أدناه لإعادة تعيين كلمة المرور:</p>
        
        <a href="${link}" class="button">إعادة تعيين كلمة المرور</a>
        
        <p style="text-align: center; color: #666; margin-top: 20px;">أو استخدم هذا الرمز:</p>
        <div class="code">${code}</div>
        
        <p style="text-align: center; color: #666; font-size: 12px;">هذا الرابط والرمز صالحان لمدة 15 دقيقة</p>
        
        <div class="footer">
          <p>إذا لم تطلب إعادة كلمة المرور، تجاهل هذا البريد.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generateWelcomeEmail(customerName: string, storeName: string = "HoneyStore") {
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; color: #d4a574; }
        .content { text-align: center; }
        .button { display: inline-block; background: #d4a574; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🍯 ${storeName}</div>
        </div>
        <div class="content">
          <h2>مرحباً بك، ${customerName}!</h2>
          <p>تم إنشاء حسابك بنجاح في متجر ${storeName}</p>
          <p>يمكنك الآن:</p>
          <ul style="text-align: right; display: inline-block;">
            <li>تصفح منتجاتنا</li>
            <li>إجراء طلبات</li>
            <li>تتبع طلباتك</li>
          </ul>
          <br>
          <a href="${process.env.NEXTAUTH_URL || "https://honeystore-seven.vercel.app"}" class="button">تسوق الآن</a>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendPasswordResetEmail(email: string, code: string) {
  const html = await generatePasswordResetEmail(code, email);
  return sendEmail({
    to: email,
    subject: "استعادة كلمة المرور - HoneyStore",
    html,
  });
}

export async function sendVerificationEmail(email: string, name: string) {
  return sendEmail({
    to: email,
    subject: "مرحباً بك في HoneyStore",
    html: generateWelcomeEmail(name),
  });
}
