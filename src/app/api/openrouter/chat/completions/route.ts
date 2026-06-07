import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Server-side only — real endpoint never sent to browser
const LC_ENGINE_URL = (
  process.env.LC_ENGINE_BASE_URL ||
  process.env.OPENROUTER_BASE_URL ||
  'https://openrouter.ai/api/v1'
).replace(/\/$/, '');

// Real model mapping: LC alias → actual model
const MODEL_ALIAS_MAP: Record<string, string> = {
  'lc-pro-120b': process.env.LC_ENGINE_REAL_MODEL || 'openai/gpt-oss-120b',
  'lc-pro':      process.env.LC_ENGINE_REAL_MODEL || 'openai/gpt-oss-120b',
};

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('[LC-Engine] API key not configured.');
      return NextResponse.json({ error: 'Lohia AI engine is not configured on the server.' }, { status: 500 });
    }

    // Parse body and resolve model alias on server — client never sees real model name
    let bodyObj: any;
    try {
      bodyObj = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    // Resolve alias: if model is a LC alias, map to real model
    if (bodyObj?.model && MODEL_ALIAS_MAP[bodyObj.model]) {
      bodyObj.model = MODEL_ALIAS_MAP[bodyObj.model];
    }

    const response = await fetch(`${LC_ENGINE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin') || 'http://localhost:3000',
        'X-Title': 'Lohia College AI'
      },
      body: JSON.stringify(bodyObj)
    });

    // Strip response headers that reveal the upstream service
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json'
      }
    });

  } catch (error: any) {
    console.error('[LC-Engine] Proxy error occurred.');
    return NextResponse.json({ error: 'Lohia AI service temporarily unavailable.' }, { status: 500 });
  }
}
