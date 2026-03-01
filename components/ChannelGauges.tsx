'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CHANNELS = ['QRIS', 'BCA', 'OVO', 'GOPAY', 'Mandiri', 'BNI'] as const;

const getLoadColor = (load: number) => {
  if (load >= 65) return { bar: 'bg-red-500', text: 'text-red-400' };
  if (load >= 50) return { bar: 'bg-orange-500', text: 'text-orange-400' };
  if (load >= 35) return { bar: 'bg-amber-400', text: 'text-amber-400' };
  if (load >= 20) return { bar: 'bg-emerald-400', text: 'text-emerald-400' };
  return { bar: 'bg-green-400', text: 'text-green-400' };
};

const WINDOW = 20;

export function ChannelGauges() {
  const [counts, setCounts] = useState<Record<string, number>>({
    QRIS: 5, BCA: 4, OVO: 3, GOPAY: 3, Mandiri: 3, BNI: 2,
  });
  const [total, setTotal] = useState(WINDOW);

  useEffect(() => {
    const handleTxn = (e: Event) => {
      const channel: string = (e as CustomEvent).detail?.routedChannel;
      if (!channel) return;
      setCounts(prev => ({ ...prev, [channel]: (prev[channel] ?? 0) + 1 }));
      setTotal(prev => prev + 1);
    };
    window.addEventListener('transaction_update', handleTxn);
    return () => window.removeEventListener('transaction_update', handleTxn);
  }, []);

  const activeChannels = CHANNELS.filter(ch => (counts[ch] ?? 0) > 0);

  return (
    <Card className="bg-gradient-to-br from-purple-900 to-indigo-950 border border-purple-700/30 rounded-2xl shadow-lg shadow-purple-900/20 col-span-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-white flex items-center justify-between">
          Channel Load Gauges
          <span className="text-[10px] text-purple-400 font-normal uppercase tracking-wide">Live</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeChannels.map((ch) => {
          const load = Math.min(100, Math.round(((counts[ch] ?? 0) / total) * 100));
          const style = getLoadColor(load);
          return (
            <div key={ch} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-purple-100">{ch}</span>
                <span className={`text-[11px] font-semibold tabular-nums ${style.text}`}>
                  {load}%
                  <span className="text-[10px] font-normal text-purple-500 ml-1">({counts[ch] ?? 0})</span>
                </span>
              </div>
              <div className="h-1.5 bg-purple-800/50 w-full rounded-full overflow-hidden">
                <div
                  className={`h-full ${style.bar} rounded-full transition-all duration-700 ease-out`}
                  style={{ width: `${load}%` }}
                />
              </div>
            </div>
          );
        })}
        {activeChannels.length === 0 && (
          <p className="text-xs text-purple-400 text-center py-4">Awaiting transactions...</p>
        )}
      </CardContent>
    </Card>
  );
}
