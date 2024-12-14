import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

export async function middleware(request: NextRequest) {
  try {
    // Check if the request is to the /api/share endpoint
    if (request.url.includes("/api/share")) {
      // Pass the request through to the /api/share endpoint
      return NextResponse.next();
    }

    // Implement rate limiting with Redis
    const clientIP = request.headers.get('x-forwarded-for') || request.ip;
    const rateLimit = await redis.get(`rate-limit:${clientIP}`);

    if (rateLimit && parseInt(rateLimit) >= 10) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    await redis.incr(`rate-limit:${clientIP}`, { ex: 60 }); // Reset rate limit every minute
    
    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.next();
  }
}

// Configure which paths the middleware runs on, excluding the /api/share endpoint
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|/api/share).*)",
  ],
};