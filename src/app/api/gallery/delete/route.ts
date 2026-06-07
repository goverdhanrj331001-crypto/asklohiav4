import { NextResponse } from 'next/server';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, R2_BUCKET_NAME } from '@/lib/r2';
import { requireAdminRequest } from '@/lib/serverSecurity';

export async function POST(request: Request) {
  try {
    const auth = await requireAdminRequest(request);
    if ('error' in auth) return auth.error;

    const { key } = await request.json();
    if (!key || typeof key !== 'string' || key.includes('..')) {
      return NextResponse.json({ error: 'Invalid object key' }, { status: 400 });
    }

    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting from R2:', error);
    return NextResponse.json({ error: error.message || 'Error deleting from Cloudflare R2' }, { status: 500 });
  }
}
