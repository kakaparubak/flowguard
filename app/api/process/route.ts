import { NextResponse } from 'next/server';
import { selectRoute } from '@/lib/qwen';
import { processWithPayLabs, getNextChannel, calculateOptimalDelay, sleep } from '@/lib/paylabs';
import { logDecision } from '@/lib/alibabacloud';

export async function POST(request: Request) {
    try {
        const txn = await request.json();

        // Qwen decides both the failure score AND the optimal channel in one call
        const { failureScore, optimalChannel: aiChannel, reason } = await selectRoute(txn);

        console.log(`[SMART ROUTE] ${txn.id} → ${aiChannel} (score: ${failureScore}) | ${reason}`);

        let optimalChannel = aiChannel;
        let result = await processWithPayLabs(txn, optimalChannel);
        let retryAttempted = false;

        // Auto-Retry Logic: if the AI-chosen channel still fails, fall to the next one
        if (result.status === 'FAILED') {
            const altChannel = getNextChannel(txn.country, optimalChannel);
            const delay = calculateOptimalDelay(txn.hour, optimalChannel);
            console.log(`[RETRY] ${txn.id} | ${optimalChannel} failed → retrying on ${altChannel}`);
            await sleep(delay);
            result = await processWithPayLabs(txn, altChannel);
            optimalChannel = altChannel;
            retryAttempted = true;
        }

        await logDecision({ txn, failureScore, channel: optimalChannel, result });

        return NextResponse.json({
            ...result,
            failure_score: failureScore,
            routedChannel: optimalChannel,
            retryAttempted,
            routingReason: reason,
        });
    } catch (error) {
        console.error('Process API Error:', error);
        return NextResponse.json({ error: 'Transaction processing failed' }, { status: 500 });
    }
}
