import { Ratelimit } from "@upstash/ratelimit";
import { getRedisClient } from "./redis";

export const chatRateLimit = new Ratelimit({
  redis: getRedisClient() as any,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
  prefix: "@upstash/ratelimit/chat",
});

export const aiSearchRateLimit = new Ratelimit({
  redis: getRedisClient() as any,
  limiter: Ratelimit.slidingWindow(20, "10 s"),
  analytics: true,
  prefix: "@upstash/ratelimit/search",
});
