import { cookies } from 'next/headers';

const SESSION_COOKIE = 'gsd-session';
const SESSION_VALUE = 'authenticated';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function validateSession(): Promise<boolean> {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE);
    return session?.value === SESSION_VALUE;
}

export function getSessionCookieConfig() {
    return {
        name: SESSION_COOKIE,
        value: SESSION_VALUE,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: COOKIE_MAX_AGE,
        path: '/',
    };
}
