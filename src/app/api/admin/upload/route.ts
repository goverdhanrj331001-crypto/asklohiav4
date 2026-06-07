import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { requireAdminRequest, safeObjectKey, validateUploadFile } from '@/lib/serverSecurity';

const accessKeyId     = process.env.R2_ACCESS_KEY_ID     || '4cb9e47d360466afd98826d28e96439a';
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';
const accountId       = process.env.R2_ACCOUNT_ID        || '4c9ef585625af9abe3c96d5c189a2ef5';
const bucketName      = process.env.R2_BUCKET_NAME       || 'lohia-college-assets';

// Guard: If secret key is missing, all uploads will silently fail auth
if (!secretAccessKey) {
  console.error('[LC-Storage] Storage secret key is not configured.');
}

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

export async function POST(request: Request) {
  try {
    const auth = await requireAdminRequest(request);
    if ('error' in auth) return auth.error;

    if (!secretAccessKey) {
      return NextResponse.json({ error: 'Storage service not configured.' }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const validationError = validateUploadFile(file);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = safeObjectKey(file.name);

    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    });

    await r2Client.send(uploadCommand);

    // Note: This URL logic depends on whether your bucket is public or has a custom domain
    // Usually R2 public URLs look like: https://pub-xyz.r2.dev/filename
    // We'll return the key for now, or you can configure a public domain
    // R2 Public URLs are typically formatted as: https://pub-[unique-id].r2.dev or your custom domain
    // If you haven't set up a custom domain or made it public, use the Cloudflare dashboard to get the public URL.
    // For now, we will return a format that is more likely to work if public access is enabled:
    const publicUrl = `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${fileName}`;
    
    // The Public Development URL from the user's screenshot
    const publicDevBaseUrl = process.env.R2_PUBLIC_DOMAIN || "https://pub-8bc21fd3ffc042a79a7bf25ee57d61d1.r2.dev";
    const imageDisplayUrl = `${publicDevBaseUrl}/${fileName}`;

    return NextResponse.json({ 
      success: true, 
      url: imageDisplayUrl,
      key: fileName 
    });

  } catch (error) {
    console.error('[LC-Storage] Upload failed.');
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 });
  }
}
