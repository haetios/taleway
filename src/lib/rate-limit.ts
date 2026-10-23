import { RateLimiterRedis } from "rate-limiter-flexible";
import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_URL!)

export const storyCreateLimiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: "rl_story_create",
    points: Number(process.env.RATE_LIMIT_STORY ?? 10),
    duration: 3600
})

export const bookmarkLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: "rl_bookmark",
  points: Number(process.env.RATE_LIMIT_BOOKMARK ?? 60),
  duration: 60, // 1 minute
});