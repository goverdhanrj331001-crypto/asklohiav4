import { NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_DOMAIN } from '@/lib/r2';
import { requireAdminRequest, safeObjectKey, validateUploadFile } from '@/lib/serverSecurity';

export async function POST(request: Request) {
  try {
    const auth = await requireAdminRequest(request);
    if ('error' in auth) return auth.error;

    if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
      return NextResponse.json({
        error: 'Cloudflare R2 configuration is missing. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY in your environment variables.'
      }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const validationError = validateUploadFile(file);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `gallery/${safeObjectKey(file.name)}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    });

    await r2Client.send(command);

    const publicUrl = `${R2_PUBLIC_DOMAIN}/${key}`;
    return NextResponse.json({ success: true, url: publicUrl, key });
  } catch (error: any) {
    console.error('Error uploading to R2:', error);
    return NextResponse.json({ error: error.message || 'Error uploading to Cloudflare R2' }, { status: 500 });
  }
}
