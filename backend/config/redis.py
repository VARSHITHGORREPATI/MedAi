import redis.asyncio as redis
from typing import Optional
import json
import os
from datetime import timedelta

class RedisClient:
    """Async Redis client wrapper"""
    
    def __init__(self):
        self.redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
        self.client: Optional[redis.Redis] = None
    
    async def connect(self):
        """Connect to Redis"""
        self.client = await redis.from_url(
            self.redis_url,
            encoding="utf-8",
            decode_responses=True
        )
        return self.client
    
    async def disconnect(self):
        """Close Redis connection"""
        if self.client:
            await self.client.close()
    
    async def get(self, key: str):
        """Get value from cache"""
        if not self.client:
            return None
        value = await self.client.get(key)
        if value:
            try:
                return json.loads(value)
            except:
                return value
        return None
    
    async def set(self, key: str, value, expire: int = 3600):
        """Set value in cache with expiration (default 1 hour)"""
        if not self.client:
            return False
        if isinstance(value, (dict, list)):
            value = json.dumps(value)
        return await self.client.setex(key, expire, value)
    
    async def delete(self, key: str):
        """Delete key from cache"""
        if not self.client:
            return False
        return await self.client.delete(key)
    
    async def exists(self, key: str):
        """Check if key exists"""
        if not self.client:
            return False
        return await self.client.exists(key)
    
    async def increment(self, key: str, amount: int = 1):
        """Increment counter (for rate limiting)"""
        if not self.client:
            return 0
        return await self.client.incrby(key, amount)
    
    async def expire(self, key: str, seconds: int):
        """Set expiration on key"""
        if not self.client:
            return False
        return await self.client.expire(key, seconds)
    
    async def clear_pattern(self, pattern: str):
        """Clear all keys matching pattern"""
        if not self.client:
            return 0
        keys = await self.client.keys(pattern)
        if keys:
            return await self.client.delete(*keys)
        return 0


# Global Redis client instance
redis_client = RedisClient()


async def get_redis():
    """Dependency for FastAPI routes"""
    return redis_client
