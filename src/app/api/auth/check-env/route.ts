import { NextResponse } from 'next/server';

export async function GET() {
  const brevoKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.BREVO_FROM_EMAIL;
  const mongoUri = process.env.MONGODB_URI;

  return NextResponse.json({
    brevo: {
      hasKey: !!brevoKey,
      keyPrefix: brevoKey?.substring(0, 10) || 'NOT_SET',
      keyLength: brevoKey?.length || 0,
      isRestKey: brevoKey?.startsWith('xkeysib-') || false,
      isSmtpKey: brevoKey?.startsWith('xsmtpsib-') || false,
      fromEmail: fromEmail || 'NOT_SET',
    },
    mongo: {
      hasUri: !!mongoUri,
      uriPrefix: mongoUri?.substring(0, 20) || 'NOT_SET',
    },
    nodeEnv: process.env.NODE_ENV || 'NOT_SET',
  });
}
