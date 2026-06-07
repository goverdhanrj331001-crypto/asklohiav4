import { NextResponse } from 'next/server';
import { requireAdminRequest, validateUploadFile } from '@/lib/serverSecurity';

const EXTRACTION_MODEL = process.env.NEXT_PUBLIC_OPENROUTER_MODEL || 'openai/gpt-oss-120b';
const BASE_URL = (process.env.NEXT_PUBLIC_OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, '');

const stripJsonFence = (value: string) =>
  value
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

const isTextLike = (file: File) => {
  const name = file.name.toLowerCase();
  return (
    file.type.startsWith('text/') ||
    ['.txt', '.csv', '.md', '.json', '.html', '.xml'].some(ext => name.endsWith(ext))
  );
};

const buildPrompt = (file: File, notes: string, extractedFileText?: string) => `Analyze this Lohia College information file and extract clean structured data for a chatbot.

File name: ${file.name}
File type: ${file.type || 'unknown'}
User notes: ${notes || 'none'}

${extractedFileText ? `Readable file text:\n${extractedFileText.slice(0, 18000)}` : ''}

Return ONLY valid JSON with this exact shape:
{
  "title": "short clear title",
  "category": "Admission | Exam | Notice | Event | Faculty | Scholarship | Facility | General",
  "summary": "2-3 line short summary",
  "answer_text": "student-facing answer in natural Hinglish/Hindi or English, concise but complete",
  "extracted_text": "important extracted text, dates, names, contacts, rules, links",
  "tags": ["keyword1", "keyword2"]
}

Rules:
- Keep answer_text polished and ready for chatbot.
- Preserve exact dates, phone numbers, names, fees, room numbers, links, and deadlines.
- Do not invent missing facts.
- If visible/readable content is not available, return a useful title from file name and explain in extracted_text that manual details should be filled.`;

export async function POST(request: Request) {
  try {
    const auth = await requireAdminRequest(request);
    if ('error' in auth) return auth.error;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const notes = String(formData.get('notes') || '');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const validationError = validateUploadFile(file);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenRouter API key is missing' }, { status: 500 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const readableText = isTextLike(file) ? buffer.toString('utf-8') : '';
    const prompt = buildPrompt(file, notes, readableText);

    const content: any[] = [{ type: 'text', text: prompt }];
    if (file.type.startsWith('image/')) {
      content.push({
        type: 'image_url',
        image_url: {
          url: `data:${file.type};base64,${buffer.toString('base64')}`
        }
      });
    }

    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'Lohia College Admin Extraction'
      },
      body: JSON.stringify({
        model: EXTRACTION_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You extract structured college knowledge. Return valid JSON only. Never add markdown.'
          },
          {
            role: 'user',
            content
          }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message || data?.message || 'OpenRouter extraction failed' },
        { status: response.status }
      );
    }

    const rawText = stripJsonFence(data?.choices?.[0]?.message?.content || '{}');
    const parsed = JSON.parse(rawText);

    return NextResponse.json({
      title: parsed.title || file.name,
      category: parsed.category || 'General',
      summary: parsed.summary || '',
      answer_text: parsed.answer_text || '',
      extracted_text: parsed.extracted_text || '',
      tags: Array.isArray(parsed.tags) ? parsed.tags : []
    });
  } catch (error: any) {
    console.error('Knowledge extraction failed:', error);
    return NextResponse.json(
      { error: error?.message || 'AI extraction failed. Please fill details manually.' },
      { status: 500 }
    );
  }
}
