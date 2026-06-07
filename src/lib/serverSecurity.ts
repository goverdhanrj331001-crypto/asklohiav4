import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const adminEmails = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(email => email.trim().toLowerCase())
  .filter(Boolean);

export async function requireAdminRequest(request: Request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false }
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return { error: NextResponse.json({ error: 'Invalid session' }, { status: 401 }) };
  }

  const email = data.user.email?.toLowerCase() || '';
  if (adminEmails.length > 0 && !adminEmails.includes(email)) {
    return { error: NextResponse.json({ error: 'Admin access required' }, { status: 403 }) };
  }

  return { user: data.user };
}

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'video/mp4',
  'video/webm',
  'video/quicktime'
]);

const blockedExtensions = new Set(['html', 'htm', 'js', 'mjs', 'svg', 'exe', 'bat', 'cmd', 'ps1', 'php']);

export function validateUploadFile(file: File) {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const maxVideoSize = 100 * 1024 * 1024;
  const maxRegularSize = 25 * 1024 * 1024;
  const maxSize = file.type.startsWith('video/') ? maxVideoSize : maxRegularSize;

  if (blockedExtensions.has(ext)) {
    return `.${ext} files are not allowed for security reasons.`;
  }

  if (!allowedMimeTypes.has(file.type)) {
    return `File type ${file.type || 'unknown'} is not allowed.`;
  }

  if (file.size > maxSize) {
    return file.type.startsWith('video/')
      ? 'Video file is too large. Maximum allowed size is 100MB.'
      : 'File is too large. Maximum allowed size is 25MB.';
  }

  return null;
}

export function safeObjectKey(fileName: string) {
  return `${Date.now()}-${fileName}`
    .replace(/[^\w.\-]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 180);
}
