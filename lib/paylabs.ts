import { Transaction } from './qwen';

export type PayLabsResponse = {
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    transactionId: string;
    channel: string;
};

// Channel Priority Matrix (Indonesia-focused)
// 1. QRIS (if failure_score < 20%) - 200ms avg
// 2. OVO/GOPAY - 350ms  
// 3. BCA/BNI - 650ms
// 4. Mandiri - 900ms (last resort)

export const getNextChannel = (country: string, currentChannel: string) => {
    const channelList = ['QRIS', 'OVO', 'GOPAY', 'BCA', 'BNI', 'Mandiri'];
    const idx = channelList.indexOf(currentChannel);
    if (idx === -1 || idx >= channelList.length - 1) return 'Mandiri';
    return channelList[idx + 1];
};

export const calculateOptimalDelay = (hour: number, channel: string) => {
    const baseDelay = channel === 'QRIS' ? 200 : channel.includes('OVO') ? 350 : 650;
    return baseDelay + Math.floor(Math.random() * 300); // add some jitter for realism
};

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const processWithPayLabs = async (txn: Transaction, channel: string): Promise<PayLabsResponse> => {
    const secretKey = process.env.PAYLABS_SECRET;
    const webhookUrl = `${process.env.ALIBABA_CLOUD_URL || 'http://localhost:3000'}/api/webhook`;

    const paylabsPayload = {
        amount: txn.amount,
        bank_issuer: channel,
        customer_ip: txn.ip,
        device_fingerprint: txn.device_id,
        callback_url: webhookUrl
    };

    if (!secretKey) {
        // Mock PayLabs response
        await sleep(channel === 'QRIS' ? 200 : 500); // Mock latency
        const isSuccess = Math.random() > 0.1; // 90% success rate mock
        return {
            status: isSuccess ? 'SUCCESS' : 'FAILED',
            transactionId: `tx_${Math.random().toString(36).substring(7)}`,
            channel
        };
    }

    try {
        const response = await fetch('https://api.paylabs.co.id/v4.8.1/transactions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${secretKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paylabsPayload)
        });

        if (!response.ok) {
            // Mock fallback in case real API fails in demo
            throw new Error('Real API failure');
        }

        return await response.json();
    } catch (error) {
        console.error('PayLabs transaction error:', error);
        return {
            status: 'FAILED',
            transactionId: `tx_err_${Date.now()}`,
            channel
        };
    }
};
