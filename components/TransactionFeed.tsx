'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface TransactionData {
  id: string;
  bankIssuer: string;
  amount: number;
  hour: number;
  status: string;
  failure_score: number | string;
  routedChannel: string;
  routingReason?: string;
  retryAttempted?: boolean;
  timestamp?: number;
  [key: string]: unknown;
}

export function TransactionFeed() {
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const processingQueue = useRef<Set<string>>(new Set());

  useEffect(() => {
    const eventSource = new EventSource('/api/sse');
    eventSource.onmessage = async (event) => {
      try {
        const txn = JSON.parse(event.data);
        if (processingQueue.current.has(txn.id)) return;
        processingQueue.current.add(txn.id);

        setTransactions(prev => [{ ...txn, status: 'PROCESSING', failure_score: '...', routedChannel: '...', timestamp: Date.now() }, ...prev].slice(0, 10));

        const res = await fetch('/api/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(txn)
        });
        const result = await res.json();

        setTransactions(prev => prev.map(t => t.id === txn.id ? { ...t, ...result, status: result.status } : t));

        window.dispatchEvent(new CustomEvent('transaction_update', {
          detail: {
            status: result.status,
            amount: txn.amount,
            isAiRouted: txn.bankIssuer !== result.routedChannel,
            routedChannel: result.routedChannel,
            failure_score: result.failure_score,
            bankIssuer: txn.bankIssuer,
            hour: txn.hour,
          }
        }));
      } catch { }
    };

    return () => eventSource.close();
  }, []);

  return (
    <Card className="bg-white border-2 border-purple-200 rounded-2xl shadow-[0_8px_30px_-6px_rgba(88,28,135,0.15)] overflow-hidden h-full flex flex-col">
      <CardHeader className="border-b border-purple-100 pb-3">
        <CardTitle className="text-sm font-semibold flex justify-between items-center text-purple-900">
          Real-Time Transaction Feed
          <span className="flex items-center text-[11px] text-emerald-600 bg-emerald-50 py-1 px-2.5 rounded-full border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
            LIVE
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-3 pt-3">
        <div className="space-y-2">
          {transactions.map((txn) => (
            <div key={txn.id} className="flex flex-col md:flex-row items-center justify-between p-3 bg-purple-50/60 rounded-xl border border-purple-100 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 gap-3 group">
              <div className="flex-1 w-full">
                <div className="flex justify-between items-center w-full mb-1">
                  <span className="font-mono text-[11px] text-purple-400 group-hover:text-purple-600 transition-colors">{txn.id}</span>
                  <div className="flex items-center gap-2">
                    {txn.timestamp && (
                      <span className="text-[10px] text-purple-300 tabular-nums">
                        {new Date(txn.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    )}
                    <span className="font-bold text-purple-900 text-sm">Rp {(txn.amount).toLocaleString('id-ID')}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center w-full mt-1 bg-white p-2 rounded-lg border border-purple-100">
                  <span className="text-xs flex flex-col">
                    <span className="text-purple-400 mb-0.5 text-[10px]">Origin</span>
                    <span className="font-semibold text-purple-900 text-xs">{txn.bankIssuer}</span>
                  </span>

                  <span className="flex flex-col items-center justify-center px-2 text-xs">
                    {txn.retryAttempted
                      ? <span className="text-amber-500 text-[10px] font-medium animate-pulse">Retried</span>
                      : <span className="text-purple-300">→</span>
                    }
                  </span>

                  <span className="text-xs flex flex-col text-right" title={txn.routingReason || undefined}>
                    <span className="text-purple-400 mb-0.5 flex items-center gap-1 justify-end text-[10px]">
                      <span>🤖</span> Routed via AI
                    </span>
                    <span className="font-bold text-purple-700 text-xs">{txn.routedChannel || '...'}</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end shrink-0">
                <div className="flex flex-col text-right items-end justify-center">
                  <span className="text-[9px] text-purple-400 uppercase tracking-wider mb-1">Risk Score</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${typeof txn.failure_score === 'number' && txn.failure_score > 20
                    ? 'text-red-600 bg-red-50 border-red-200'
                    : 'text-emerald-600 bg-emerald-50 border-emerald-200'
                    }`}>
                    {typeof txn.failure_score === 'number' ? `${txn.failure_score.toFixed(1)}%` : '...'}
                  </span>
                </div>
                <div className="min-w-[80px] flex flex-col text-center items-center justify-center">
                  <span className="text-[9px] text-purple-400 uppercase tracking-wider mb-1">Status</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${txn.status === 'SUCCESS'
                    ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                    : txn.status === 'FAILED'
                      ? 'text-red-600 bg-red-50 border-red-200'
                      : 'text-purple-600 bg-purple-50 border-purple-200'
                    }`}>
                    {txn.status === 'PROCESSING' ? (
                      <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />PROCS</span>
                    ) : txn.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="text-center py-20 flex flex-col items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-purple-300 mb-4" />
              <p className="text-sm font-medium tracking-wide text-purple-400">Awaiting Live Transactions...</p>
              <p className="text-xs text-purple-300 mt-1">Listening to SSE channel</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
