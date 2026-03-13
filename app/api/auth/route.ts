import { NextResponse } from 'next/server';
import { getSessionCookieConfig } from '@/lib/auth';

// In-memory rate limiter — max 10 attempts per IP per minute
// Note: resets per serverless instance; sufficient for a single-user personal app
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = loginAttempts.get(ip) || { count: 0, resetAt: now + 60_000 };
    if (now > record.resetAt) {
        loginAttempts.set(ip, { count: 1, resetAt: now + 60_000 });
        return true;
    }
    if (record.count >= 10) return false;
    loginAttempts.set(ip, { count: record.count + 1, resetAt: record.resetAt });
    return true;
}

export async function POST(request: Request) {
    try {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
        if (!checkRateLimit(ip)) {
            return NextResponse.json(
                { success: false, error: 'Too many attempts. Try again in a minute.' },
                { status: 429 }
            );
        }

        const { password } = await request.json();
        const appPassword = process.env.APP_PASSWORD;

        if (!appPassword) {
            return NextResponse.json(
                { success: false, error: 'APP_PASSWORD not configured on server' },
                { status: 500 }
            );
        }

        if (password !== appPassword) {
            return NextResponse.json(
                { success: false, error: 'Wrong password. Try again.' },
                { status: 401 }
            );
        }

        const cookie = getSessionCookieConfig();
        const response = NextResponse.json({ success: true });
        response.cookies.set(cookie);
        return response;
    } catch {
        return NextResponse.json(
            { success: false, error: 'Something went wrong' },
            { status: 500 }
        );
    }
}
