import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on('connect', () => {
  console.log('📦 Redis connected');
});

redis.on('error', (err) => {
  console.error('Redis error:', err.message);
});

// Cache helper functions
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function setCache(key: string, value: unknown, ttlSeconds = 3600): Promise<void> {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    console.error('Cache set error:', err);
  }
}

export async function deleteCache(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.error('Cache delete error:', err);
  }
}

export async function incrementViewCount(articleId: string): Promise<void> {
  const key = `views:pending:${articleId}`;
  await redis.incr(key);
}

export async function getAndResetViewCounts(): Promise<Map<string, number>> {
  const viewCounts = new Map<string, number>();
  
  try {
    const keys = await redis.keys('views:pending:*');
    
    for (const key of keys) {
      const count = await redis.getset(key, '0');
      if (count && parseInt(count) > 0) {
        const articleId = key.replace('views:pending:', '');
        viewCounts.set(articleId, parseInt(count));
        await redis.del(key);
      }
    }
  } catch (err) {
    console.error('Error getting view counts:', err);
  }
  
  return viewCounts;
}



