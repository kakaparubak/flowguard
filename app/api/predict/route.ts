import { NextResponse } from 'next/server';
import { predictFailure } from '@/lib/qwen';

export async function POST(request: Request) {
    try {
        const txn = await request.json();
        const score = await predictFailure(txn);
        return NextResponse.json({ failure_score: score });
    } catch (error) {
        console.error('Prediction API Error:', error);
        return NextResponse.json({ error: 'Failed to predict failure risk' }, { status: 500 });
    }
}
