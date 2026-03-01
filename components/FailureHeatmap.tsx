'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type HourBucket = 'Night' | 'Morning' | 'Afternoon' | 'Peak';
type CellData = { totalScore: number; count: number };

const CHANNELS = ['QRIS', 'BCA', 'OVO', 'GOPAY', 'Mandiri', 'BNI'] as const;
const HOUR_BUCKETS: { label: HourBucket; range: [number, number] }[] = [
  { label: 'Night', range: [0, 8] },
  { label: 'Morning', range: [8, 12] },
  { label: 'Afternoon', range: [12, 18] },
  { label: 'Peak', range: [18, 24] },
];

const getHourBucket = (hour: number): HourBucket => {
  if (hour < 8) return 'Night';
  if (hour < 12) return 'Morning';
  if (hour < 18) return 'Afternoon';
  return 'Peak';
};

const getRiskStyle = (avg: number) => {
  if (avg >= 30) return { bg: 'bg-red-500/20 border-red-500/30', text: 'text-red-400' };
  if (avg >= 18) return { bg: 'bg-amber-500/20 border-amber-500/30', text: 'text-amber-400' };
  if (avg > 0) return { bg: 'bg-emerald-500/15 border-emerald-500/20', text: 'text-emerald-400' };
  return { bg: 'bg-purple-800/30 border-purple-700/20', text: 'text-purple-500' };
};

const MEDAL = ['🥇', '🥈', '🥉', '4.', '5.'];

export function FailureHeatmap() {
  const [heatmap, setHeatmap] = useState<Record<string, Record<HourBucket, CellData>>>(() => {
    const init: Record<string, Record<HourBucket, CellData>> = {};
    CHANNELS.forEach(ch => {
      init[ch] = {} as Record<HourBucket, CellData>;
      HOUR_BUCKETS.forEach(b => { init[ch][b.label] = { totalScore: 0, count: 0 }; });
    });
    return init;
  });

  const [channelTotals, setChannelTotals] = useState<Record<string, number>>({});
  const [seenChannels, setSeenChannels] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleTxn = (e: any) => {
      const { failure_score, bankIssuer, hour, routedChannel } = e.detail ?? {};
      if (typeof failure_score !== 'number' || !bankIssuer || typeof hour !== 'number') return;

      const bucket = getHourBucket(hour);

      setHeatmap(prev => {
        const channelRow = prev[bankIssuer] ?? {} as Record<HourBucket, CellData>;
        const cell = channelRow[bucket] ?? { totalScore: 0, count: 0 };
        return {
          ...prev,
          [bankIssuer]: {
            ...channelRow,
            [bucket]: { totalScore: cell.totalScore + failure_score, count: cell.count + 1 },
          },
        };
      });

      if (routedChannel) {
        setChannelTotals(prev => ({ ...prev, [routedChannel]: (prev[routedChannel] ?? 0) + 1 }));
      }
      setSeenChannels(prev => new Set([...prev, bankIssuer]));
    };

    window.addEventListener('transaction_update', handleTxn);
    return () => window.removeEventListener('transaction_update', handleTxn);
  }, []);

  const activeChannels = CHANNELS.filter(ch => seenChannels.has(ch));
  const top5 = Object.entries(channelTotals).sort(([, a], [, b]) => b - a).slice(0, 5);
  const totalRouted = Object.values(channelTotals).reduce((s, v) => s + v, 0);

  return (
    <Card className="bg-gradient-to-br from-purple-900 to-indigo-950 border border-purple-700/30 rounded-2xl shadow-lg shadow-purple-900/20 col-span-1">
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-semibold text-white flex items-center justify-between">
          Risk Heatmap
          <span className="text-[10px] font-normal text-purple-400 uppercase tracking-wide flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            Qwen 2.5 · Live
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {activeChannels.length === 0 ? (
          <p className="text-xs text-purple-400 text-center py-4">Awaiting transaction data...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] border-separate border-spacing-1">
              <thead>
                <tr>
                  <th className="text-left text-purple-400 font-medium pb-1 pl-1 w-14">Ch</th>
                  {HOUR_BUCKETS.map(b => (
                    <th key={b.label} className="text-center text-purple-400 font-medium pb-1">{b.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeChannels.map(ch => (
                  <tr key={ch}>
                    <td className="font-semibold text-purple-100 pl-1 pr-1 py-0.5 whitespace-nowrap text-xs">{ch}</td>
                    {HOUR_BUCKETS.map(b => {
                      const cell = heatmap[ch]?.[b.label] ?? { totalScore: 0, count: 0 };
                      const avg = cell.count > 0 ? cell.totalScore / cell.count : 0;
                      const style = getRiskStyle(avg);
                      return (
                        <td key={b.label} className="p-0">
                          <div
                            className={`${style.bg} ${style.text} border rounded-lg flex flex-col items-center justify-center h-8 transition-all duration-500 cursor-default hover:scale-105`}
                            title={cell.count > 0 ? `${ch} at ${b.label}: avg ${avg.toFixed(1)}% over ${cell.count} txns` : 'No data'}
                          >
                            {cell.count > 0 ? (
                              <>
                                <span className="font-bold leading-none text-[11px]">{avg.toFixed(0)}%</span>
                                <span className="text-[8px] opacity-50 leading-none">{cell.count}tx</span>
                              </>
                            ) : (
                              <span className="text-[10px] opacity-30">—</span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-3 text-[9px] text-purple-400 pt-1 border-t border-purple-700/30">
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500/20 border border-emerald-500/20 inline-block" />&lt;18%</div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500/20 border border-amber-500/30 inline-block" />18-30%</div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-500/20 border border-red-500/30 inline-block" />&gt;30%</div>
        </div>

        {/* Top 5 */}
        <div className="border-t border-purple-700/30 pt-2">
          <p className="text-[11px] font-semibold text-purple-200 mb-1.5">Top Channels</p>
          {top5.length === 0 ? (
            <p className="text-xs text-purple-500">Awaiting data...</p>
          ) : (
            <div className="space-y-1">
              {top5.map(([ch, count], i) => {
                const pct = totalRouted > 0 ? (count / totalRouted) * 100 : 0;
                return (
                  <div key={ch} className="flex items-center gap-2">
                    <span className="text-[10px] w-4 text-center">{MEDAL[i]}</span>
                    <span className="font-semibold text-purple-100 text-[11px] w-12">{ch}</span>
                    <div className="flex-1 h-1 bg-purple-800/40 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-purple-400 tabular-nums w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
