# Brevo Setup for OTP Emails

## ✅ **Use the Correct Brevo API Key Type**

Brevo มีทั้ง **SMTP key** (ขึ้นต้นด้วย `xsmtpsib-`) และ **REST API key** (ขึ้นต้นด้วย `xkeysib-`).  
**ระบบ OTP ของ `portfolio-backend` ใช้ REST API (ผ่าน SDK `@getbrevo/brevo`) ดังนั้นต้องใช้คีย์ที่ขึ้นต้นด้วย `xkeysib-` เท่านั้น**  
ถ้าใช้คีย์ที่ขึ้นต้นด้วย `xsmtpsib-` จะส่งเมลไม่ผ่าน และจะเห็น error ประเภท `Authentication Error - Please check your BREVO_API_KEY` ใน log

ตัวอย่างในไฟล์นี้ที่เคยเป็น `xsmtpsib-...` ให้เปลี่ยนไปใช้คีย์แบบ `xkeysib-...` แทน เช่น (เอาจาก Brevo ของคุณเอง):

- **API Key (ถูกต้อง)**: `xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-YYYYYYYYYYYYYYYY`
- **From Email**: `67409010014@cmtc.ac.th`

> คุณสามารถใช้คีย์ตัวเดียวกับที่ `backend-otp` ใช้ได้เลย (ใน `.env` ของ `Backend-otp/uport-api` หรือดูตัวอย่างใน `Backend-otp/uport-api/README.md`)

## 🚀 **How to Test**

1. **ตั้งค่าไฟล์ `.env` ของ `portfolio-backend`**

   ที่โฟลเดอร์ `portfolio-backend` ให้สร้าง/แก้ไฟล์ `.env` ให้มีค่าอย่างน้อยนี้ (ใช้คีย์ `xkeysib-` ของคุณเอง):

   ```env
   BREVO_API_KEY=xkeysib-...ใส่คีย์จาก Brevo ของคุณ...
   BREVO_FROM_EMAIL=67409010014@cmtc.ac.th
   MONGODB_URI=mongodb://localhost:27017/portfolio
   ```

   > ถ้าคุณรันผ่าน `docker-compose` จะมี default `BREVO_API_KEY` แบบ `xkeysib-...` ให้แล้วใน `docker-compose.yml`  
   > แต่ถ้ารัน `npm run dev` ตรงๆ ใน `portfolio-backend` **ต้องมี `.env` นี้เองด้วย**

2. **Start the backend server**:

   ```bash
   npm run dev
   ```

3. **Test the OTP system**:
   - Go to your registration page
   - Enter a CMTC email (e.g., `67409010014@cmtc.ac.th`)
   - Click submit
   - Check your email for the OTP code!

## 📧 **Email Features**

- ✅ **Beautiful HTML emails** with UPORT branding
- ✅ **6-digit OTP codes** for verification
- ✅ **5-minute expiration** for security
- ✅ **Professional design** with gradient headers
- ✅ **Mobile responsive** email templates

## 🔧 **Brevo Dashboard**

1. Go to [app.brevo.com](https://app.brevo.com)
2. Check **"Email"** → **"Campaigns"** → **"Sent"** to see delivery status
3. Monitor **"Statistics"** for delivery rates

## 📊 **Free Tier Limits**

- **300 emails/day** (9,000/month)
- **Perfect for development** and small projects
- **No credit card required**

## 🎯 **Production Ready**

The system is now ready to send real OTP emails to CMTC users during registration!
