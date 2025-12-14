"""
JASPER CRM - Redis Caching Service

Provides high-performance caching for:
- API response caching
- Session management
- Rate limiting data
- Frequently accessed data (keywords, leads)
"""

import os
import json
import logging
import hashlib
from datetime import timedelta
from typing import Optional, Any, Callable, TypeVar
from functools import wraps

logger = logging.getLogger(__name__)

T = TypeVar('T')


class CacheConfig:
    """Cache configuration."""

    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self.default_ttl = int(os.getenv("CACHE_TTL", "300"))  # 5 minutes
        self.key_prefix = os.getenv("CACHE_PREFIX", "jasper:")
        self.enabled = os.getenv("CACHE_ENABLED", "true").lower() == "true"


class CacheService:
    """
    Redis-based caching service.

    Provides caching functionality with automatic serialization,
    TTL management, and cache invalidation patterns.
    """

    _instance = None
    _redis = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self.config = CacheConfig()
        self._connect()
        self._initialized = True

    def _connect(self):
        """Connect to Redis."""
        if not self.config.enabled:
            logger.info("Cache disabled by configuration")
            return

        try:
            import redis
            self._redis = redis.from_url(
                self.config.redis_url,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
            )
            # Test connection
            self._redis.ping()
            logger.info(f"Connected to Redis at {self.config.redis_url}")
        except ImportError:
            logger.warning("redis package not installed. Caching disabled.")
            self._redis = None
        except Exception as e:
            logger.warning(f"Failed to connect to Redis: {e}. Caching disabled.")
            self._redis = None

    @property
    def is_available(self) -> bool:
        """Check if cache is available."""
        return self._redis is not None

    def _make_key(self, key: str) -> str:
        """Create prefixed cache key."""
        return f"{self.config.key_prefix}{key}"

    def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache.

        Args:
            key: Cache key

        Returns:
            Cached value or None if not found
        """
        if not self.is_available:
            return None

        try:
            full_key = self._make_key(key)
            value = self._redis.get(full_key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.warning(f"Cache get error for {key}: {e}")
            return None

    def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None
    ) -> bool:
        """
        Set value in cache.

        Args:
            key: Cache key
            value: Value to cache (must be JSON serializable)
            ttl: Time to live in seconds (default from config)

        Returns:
            True if successful, False otherwise
        """
        if not self.is_available:
            return False

        try:
            full_key = self._make_key(key)
            ttl = ttl or self.config.default_ttl
            serialized = json.dumps(value)
            self._redis.setex(full_key, ttl, serialized)
            return True
        except Exception as e:
            logger.warning(f"Cache set error for {key}: {e}")
            return False

    def delete(self, key: str) -> bool:
        """Delete key from cache."""
        if not self.is_available:
            return False

        try:
            full_key = self._make_key(key)
            self._redis.delete(full_key)
            return True
        except Exception as e:
            logger.warning(f"Cache delete error for {key}: {e}")
            return False

    def delete_pattern(self, pattern: str) -> int:
        """
        Delete all keys matching pattern.

        Args:
            pattern: Glob-style pattern (e.g., "user:*")

        Returns:
            Number of keys deleted
        """
        if not self.is_available:
            return 0

        try:
            full_pattern = self._make_key(pattern)
            keys = self._redis.keys(full_pattern)
            if keys:
                return self._redis.delete(*keys)
            return 0
        except Exception as e:
            logger.warning(f"Cache delete_pattern error for {pattern}: {e}")
            return 0

    def get_or_set(
        self,
        key: str,
        factory: Callable[[], T],
        ttl: Optional[int] = None
    ) -> T:
        """
        Get from cache or compute and cache.

        Args:
            key: Cache key
            factory: Function to compute value if not cached
            ttl: Time to live in seconds

        Returns:
            Cached or computed value
        """
        cached = self.get(key)
        if cached is not None:
            return cached

        value = factory()
        self.set(key, value, ttl)
        return value

    async def get_or_set_async(
        self,
        key: str,
        factory: Callable[[], T],
        ttl: Optional[int] = None
    ) -> T:
        """Async version of get_or_set."""
        cached = self.get(key)
        if cached is not None:
            return cached

        # Handle both sync and async factories
        import asyncio
        if asyncio.iscoroutinefunction(factory):
            value = await factory()
        else:
            value = factory()

        self.set(key, value, ttl)
        return value

    def increment(self, key: str, amount: int = 1) -> int:
        """Increment a counter."""
        if not self.is_available:
            return 0

        try:
            full_key = self._make_key(key)
            return self._redis.incr(full_key, amount)
        except Exception as e:
            logger.warning(f"Cache increment error for {key}: {e}")
            return 0

    def get_stats(self) -> dict:
        """Get cache statistics."""
        if not self.is_available:
            return {"status": "unavailable"}

        try:
            info = self._redis.info("stats")
            return {
                "status": "connected",
                "hits": info.get("keyspace_hits", 0),
                "misses": info.get("keyspace_misses", 0),
                "keys": self._redis.dbsize(),
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}


# Singleton instance
cache_service = CacheService()


def cached(
    key_prefix: str,
    ttl: int = 300,
    key_builder: Optional[Callable[..., str]] = None
):
    """
    Decorator for caching function results.

    Usage:
        @cached("users", ttl=600)
        async def get_user(user_id: int):
            return await db.get_user(user_id)

        @cached("search", key_builder=lambda q, **kw: f"search:{q}")
        async def search(query: str):
            return await perform_search(query)
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            # Build cache key
            if key_builder:
                key = key_builder(*args, **kwargs)
            else:
                key_data = f"{args}:{sorted(kwargs.items())}"
                key_hash = hashlib.md5(key_data.encode()).hexdigest()[:12]
                key = f"{key_prefix}:{key_hash}"

            # Try cache
            cached_value = cache_service.get(key)
            if cached_value is not None:
                logger.debug(f"Cache hit: {key}")
                return cached_value

            # Compute and cache
            logger.debug(f"Cache miss: {key}")
            result = await func(*args, **kwargs)
            cache_service.set(key, result, ttl)
            return result

        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            # Build cache key
            if key_builder:
                key = key_builder(*args, **kwargs)
            else:
                key_data = f"{args}:{sorted(kwargs.items())}"
                key_hash = hashlib.md5(key_data.encode()).hexdigest()[:12]
                key = f"{key_prefix}:{key_hash}"

            # Try cache
            cached_value = cache_service.get(key)
            if cached_value is not None:
                return cached_value

            # Compute and cache
            result = func(*args, **kwargs)
            cache_service.set(key, result, ttl)
            return result

        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper

    return decorator


def invalidate_cache(pattern: str):
    """
    Decorator to invalidate cache after function execution.

    Usage:
        @invalidate_cache("users:*")
        async def update_user(user_id: int, data: dict):
            return await db.update_user(user_id, data)
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            result = await func(*args, **kwargs)
            cache_service.delete_pattern(pattern)
            return result

        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            result = func(*args, **kwargs)
            cache_service.delete_pattern(pattern)
            return result

        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper

    return decorator
