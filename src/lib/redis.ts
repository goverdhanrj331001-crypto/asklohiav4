import { Redis } from '@upstash/redis';

let redis: Redis | null = null;

export function getRedisClient() {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      console.warn('Upstash Redis environment variables are missing. Global caching is disabled.');
      return null;
    }

    redis = new Redis({
      url,
      token,
    });
  }
  return redis;
}
