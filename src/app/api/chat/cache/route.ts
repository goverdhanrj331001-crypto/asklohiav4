import { NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';
import { chatRateLimit } from '@/lib/ratelimit';

export const runtime = 'nodejs'; // Redis client requires Node.js runtime

export async function POST(req: Request) {
  try {
    // RATE LIMITING (For High Traffic Protection)
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const { success, limit, remaining, reset } = await chatRateLimit.limit(ip);

    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          }
        }
      );
    }

    const { action, key, value, ttl } = await req.json();
    const redis = getRedisClient();

    if (!redis) {
      return NextResponse.json({ error: 'Redis not configured' }, { status: 503 });
    }

    if (action === 'get') {
      const cachedValue = await redis.get(key);
      return NextResponse.json({ value: cachedValue });
    }

    if (action === 'set') {
      await redis.set(key, value, { ex: ttl || 3600 }); // Default 1 hour
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[LC-Cache] Cache operation failed.');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
