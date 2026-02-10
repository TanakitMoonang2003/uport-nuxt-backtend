import * as brevo from '@getbrevo/brevo';

// Initialize Brevo API client
let apiInstance: brevo.TransactionalEmailsApi;

function getApiInstance(): brevo.TransactionalEmailsApi {
  if (!apiInstance) {
    const apiKey = process.env.BREVO_API_KEY;
    
    console.log('🔧 Initializing Brevo API client...');
    console.log('   BREVO_API_KEY exists:', !!apiKey);
    console.log('   BREVO_API_KEY starts with:', apiKey ? apiKey.substring(0, 10) + '...' : 'N/A');
    
    if (!apiKey) {
      const error = new Error('BREVO_API_KEY is not set in environment variables');
      console.error('❌', error.message);
      throw error;
    }
    
    if (apiKey.startsWith('xsmtpsib-')) {
      const error = new Error('BREVO_API_KEY is SMTP key (xsmtpsib-), but REST API key (xkeysib-) is required');
      console.error('❌', error.message);
      throw error;
    }
    
    // Create API instance with authentication
    apiInstance = new brevo.TransactionalEmailsApi();
    
    // Set API key - Brevo SDK v3 uses this method
    apiInstance.setApiKey(
      brevo.TransactionalEmailsApiApiKeys.apiKey,
      apiKey
    );
    
    console.log('✅ Brevo API client initialized (API key length:', apiKey.length, ')');
  }
  return apiInstance;
}

interface SendOTPEmailParams {
  email: string;
  otp: string;
}

/**
 * Send OTP email using Brevo
 */
export async function sendOTPEmail({ email, otp }: SendOTPEmailParams): Promise<boolean> {
  try {
    const api = getApiInstance();
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    
    sendSmtpEmail.subject = 'UPORT - รหัสยืนยันอีเมล (Email Verification Code)';
    sendSmtpEmail.htmlContent = `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: #ffffff;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px 10px 0 0;
            text-align: center;
            margin: -30px -30px 30px -30px;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .otp-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-size: 36px;
            font-weight: bold;
            text-align: center;
            padding: 20px;
            border-radius: 8px;
            letter-spacing: 8px;
            margin: 30px 0;
            font-family: 'Courier New', monospace;
          }
          .content {
            margin: 20px 0;
          }
          .content p {
            margin: 15px 0;
            color: #555;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            color: #999;
            font-size: 12px;
          }
          .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .warning p {
            margin: 5px 0;
            color: #856404;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 UPORT</h1>
          </div>
          
          <div class="content">
            <p>สวัสดีครับ/ค่ะ,</p>
            
            <p>คุณได้ทำการขอรหัสยืนยันอีเมลสำหรับการลงทะเบียนในระบบ UPORT</p>
            
            <p><strong>รหัสยืนยันของคุณคือ:</strong></p>
            
            <div class="otp-box">
              ${otp}
            </div>
            
            <div class="warning">
              <p><strong>⚠️ คำเตือน:</strong></p>
              <p>• รหัสนี้จะหมดอายุใน 5 นาที</p>
              <p>• ห้ามแชร์รหัสนี้กับผู้อื่น</p>
              <p>• หากคุณไม่ได้เป็นผู้ขอรหัสนี้ กรุณาเพิกเฉยต่ออีเมลนี้</p>
            </div>
            
            <p>หากคุณไม่ได้เป็นผู้ขอรหัสนี้ กรุณาเพิกเฉยต่ออีเมลนี้</p>
            
            <p>ขอบคุณครับ/ค่ะ,<br>
            <strong>ทีม UPORT</strong></p>
          </div>
          
          <div class="footer">
            <p>อีเมลนี้ถูกส่งโดยอัตโนมัติ กรุณาอย่าตอบกลับ</p>
            <p>© ${new Date().getFullYear()} UPORT - Portfolio Management System</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    sendSmtpEmail.textContent = `
UPORT - รหัสยืนยันอีเมล

สวัสดีครับ/ค่ะ,

คุณได้ทำการขอรหัสยืนยันอีเมลสำหรับการลงทะเบียนในระบบ UPORT

รหัสยืนยันของคุณคือ: ${otp}

คำเตือน:
- รหัสนี้จะหมดอายุใน 5 นาที
- ห้ามแชร์รหัสนี้กับผู้อื่น
- หากคุณไม่ได้เป็นผู้ขอรหัสนี้ กรุณาเพิกเฉยต่ออีเมลนี้

ขอบคุณครับ/ค่ะ,
ทีม UPORT

---
อีเมลนี้ถูกส่งโดยอัตโนมัติ กรุณาอย่าตอบกลับ
© ${new Date().getFullYear()} UPORT - Portfolio Management System
    `;
    
    sendSmtpEmail.sender = {
      name: 'UPORT',
      email: process.env.BREVO_FROM_EMAIL || '67409010014@cmtc.ac.th'
    };
    
    sendSmtpEmail.to = [{ email }];
    
    const result = await api.sendTransacEmail(sendSmtpEmail);
    return true;
  } catch (error: any) {
    console.error('❌ Error sending email via Brevo:', error);
    
    // Extract more detailed error information
    const errorDetails: any = {
      message: error.message,
      code: error.code,
      status: error.status || error.response?.status || error.response?.statusCode,
    };
    
    // Try to get response body
    if (error.response) {
      try {
        errorDetails.responseBody = error.response.body || error.response.data;
      } catch (e) {
        // Ignore if can't parse
      }
    }
    
    // Check if it's an authentication error
    if (errorDetails.status === 401 || errorDetails.status === 403) {
      console.error('🔐 Authentication Error - Please check your BREVO_API_KEY');
      console.error('   Make sure the API key starts with "xkeysib-" for REST API');
      console.error('   Current API key length:', process.env.BREVO_API_KEY?.length || 0);
    }
    
    console.error('Error details:', errorDetails);
    throw error;
  }
}
