import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { processVerification } from '@/lib/verify-logic';

export async function POST(request: Request) {
    try {
        const isAuthenticated = await validateSession();
        if (!isAuthenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { taskId, imageBase64, checkinType } = body;

        if (!taskId || !imageBase64) {
            return NextResponse.json({ error: 'Missing taskId or image' }, { status: 400 });
        }

        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');

        const result = await processVerification(taskId, buffer, checkinType);

        if (!result.success) {
            return NextResponse.json({ success: false, error: result.error || 'Verification failed' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            verified: result.verified,
            coach_message: result.coach_message,
            image_url: result.image_url,
            xp_updates: result.xp_updates
        });

    } catch (error) {
        console.error('Verification POST error:', error);
        return NextResponse.json({ success: false, error: 'Verification failed' }, { status: 500 });
    }
}
