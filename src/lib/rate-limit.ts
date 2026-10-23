import { RateLimiterRedis } from "rate-limiter-flexible";
import { Redis } from "ioredis";
import { NextResponse } from "next/server";

const redis = new Redis(process.env.REDIS_URL!)

export async function rateLimit(limiter: RateLimiterRedis, id: string) {
    try {
        await limiter.consume(id)
    } catch (rejRes) {
        const seconds = Math.ceil((rejRes as { msBeforeNext: number }).msBeforeNext / 1000)
        return NextResponse.json({
            title: 'Too Many Requests',
            status: 429,
            detail: 'Rate limit exceeded, try again later'
        }, {
            status: 429,
            headers: { 'Retry-After': String(seconds) }
        })
    }
}

export const storyCreationLimiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: "rl_story_create",
    points: Number(process.env.RATE_LIMIT_STORY_CREATION ?? 10),
    duration: 3600
})

export const bookmarkLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: "rl_bookmark",
  points: Number(process.env.RATE_LIMIT_BOOKMARK ?? 60),
  duration: 60, // 1 minute
});

/** Écritures sensibles (PUT story) : 100/h et par utilisateur. */
export const storyEditionLimiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: "rl_write",
    points: Number(process.env.RATE_LIMIT_STORY_EDITION ?? 250),
    duration: 3600
});

/** Suppressions (DELETE story, DELETE bookmark) : 10/h et par utilisateur. */
export const deletionLimiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: "rl_delete",
    points: Number(process.env.RATE_LIMIT_DELETE ?? 10),
    duration: 3600
});

/** Changements de settings (PUT settings) : 5/min et par utilisateur. */
export const settingsLimiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: "rl_settings",
    points: Number(process.env.RATE_LIMIT_SETTINGS ?? 5),
    duration: 60
});