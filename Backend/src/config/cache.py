"""
Redis Cache Configuration
Uses fastapi-cache2 for decorator-based caching on route handlers.
"""
import logging
from contextlib import asynccontextmanager

from config.settings import settings
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from redis import asyncio as aioredis

logger = logging.getLogger(__name__)

_redis: aioredis.Redis | None = None


async def init_cache() -> None:
    """Connect to Redis and initialise FastAPICache. Called at app startup."""
    global _redis
    try:
        _redis = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=False,
            max_connections=50,
        )
        await _redis.ping()
        FastAPICache.init(RedisBackend(_redis), prefix="crm-cache")
        logger.info(f"Redis cache connected: {settings.REDIS_URL}")
    except Exception as exc:
        # Cache is non-critical — app can still run without it
        logger.warning(f"Redis unavailable, caching disabled: {exc}")
        _redis = None


async def close_cache() -> None:
    """Close Redis connection on app shutdown."""
    global _redis
    if _redis:
        await _redis.aclose()
        logger.info("Redis connection closed")


def get_redis() -> aioredis.Redis | None:
    """Return the active Redis client (None if Redis is down)."""
    return _redis


async def invalidate_prefix(prefix: str) -> None:
    """Delete all cache keys that start with *prefix*."""
    if not _redis:
        return
    try:
        pattern = f"crm-cache:{prefix}*"
        keys = await _redis.keys(pattern)
        if keys:
            await _redis.delete(*keys)
            logger.debug(f"Invalidated {len(keys)} cache keys for prefix '{prefix}'")
    except Exception as exc:
        logger.warning(f"Cache invalidation error: {exc}")
