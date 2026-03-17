import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/session';

export async function POST() {
    let res = NextResponse.json({ message: 'Logged out' });

    res = clearSessionCookie(res) as typeof res;

    return res;
}