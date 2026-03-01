import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const payload = await request.json();
        console.log(`[WEBHOOK] Received PayLabs Webhook:`, payload);
        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook API Error:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
