from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from config.redis import redis_client
import time


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware"""
    
    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks
        if request.url.path in ["/", "/health", "/docs", "/openapi.json"]:
            return await call_next(request)
        
        # Get client identifier (IP or user ID)
        client_id = request.client.host if request.client else "unknown"
        
        # Check if user is authenticated
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            # Use user ID from token if available (implement based on your auth)
            client_id = f"user:{auth_header[:20]}"
        
        # Create rate limit key
        window = int(time.time() / 60)  # 1-minute windows
        rate_limit_key = f"rate_limit:{client_id}:{window}"
        
        try:
            # Increment request count
            request_count = await redis_client.increment(rate_limit_key)
            
            # Set expiration on first request in window
            if request_count == 1:
                await redis_client.expire(rate_limit_key, 60)
            
            # Check if limit exceeded
            if request_count > self.requests_per_minute:
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "detail": "Rate limit exceeded. Please try again later.",
                        "retry_after": 60
                    },
                    headers={"Retry-After": "60"}
                )
            
            # Add rate limit headers
            response = await call_next(request)
            response.headers["X-RateLimit-Limit"] = str(self.requests_per_minute)
            response.headers["X-RateLimit-Remaining"] = str(
                max(0, self.requests_per_minute - request_count)
            )
            response.headers["X-RateLimit-Reset"] = str((window + 1) * 60)
            
            return response
        
        except Exception as e:
            # If Redis is down, allow request but log error
            print(f"Rate limiting error: {e}")
            return await call_next(request)
