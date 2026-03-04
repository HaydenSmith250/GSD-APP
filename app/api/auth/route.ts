import { NextResponse } from 'next/server';
import { getSessionCookieConfig } from '@/lib/auth';

export async function POST(request: Request) {
    try {
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
