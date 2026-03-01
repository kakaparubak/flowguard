import { TransactionFeed } from '@/components/TransactionFeed';
import { ChannelGauges } from '@/components/ChannelGauges';
import { FailureHeatmap } from '@/components/FailureHeatmap';
import { MetricsCard } from '@/components/MetricsCard';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-100/40 to-purple-100/60 text-foreground p-4 md:p-8 font-sans selection:bg-purple-200">
      <header className="mb-6 flex justify-between items-end border-b border-purple-200/60 pb-4 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-purple-950">
            Flowguard
          </h1>
          <p className="text-purple-400 text-[11px] mt-1 uppercase tracking-[0.18em] font-semibold">
            AI Dynamic Payment Routing
          </p>
        </div>
        <div className="text-right flex space-x-5 items-center">
          <div className="hidden md:flex flex-col text-[11px] text-purple-400 text-right uppercase tracking-wider gap-0.5">
            <span className="font-semibold text-purple-900">Qwen AI v2.5</span>
            <span className="font-semibold text-purple-900">PayLabs v4.8.1 API</span>
            <span className="font-semibold text-purple-900">Alibaba Serverless Cloud</span>
          </div>
          <div className="h-9 w-9 bg-gradient-to-br from-purple-700 to-indigo-900 rounded-xl flex items-center justify-center shadow-lg shadow-purple-300/40">
            <span className="text-white font-bold text-base">F</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 h-[calc(100vh-140px)] min-h-[700px]">
          {/* Left Column - Realtime Feed */}
          <div className="lg:col-span-2 flex flex-col space-y-4 h-full">
            <div className="shrink-0">
              <MetricsCard />
            </div>
            <div className="flex-1 min-h-[400px]">
              <TransactionFeed />
            </div>
          </div>

          {/* Right Column - Analytics & Heatmap */}
          <div className="flex flex-col space-y-4 h-full">
            <div className="shrink-0">
              <ChannelGauges />
            </div>
            <div className="shrink-0">
              <FailureHeatmap />
            </div>

            {/* System status block */}
            <div className="h-auto bg-gradient-to-br from-purple-900 to-indigo-950 border border-purple-700/30 rounded-2xl p-4 flex flex-col text-sm text-purple-100 shadow-[0_8px_30px_-6px_rgba(88,28,135,0.25)]">
              <h3 className="font-semibold text-white mb-2 flex items-center gap-2 text-sm">
                <span className="w-5 h-5 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-[10px]">⚡</span>
                System Status
              </h3>
              <p className="text-purple-200 text-xs leading-relaxed">
                <span className="font-semibold text-white">Smart Routing Engine:</span> Active — predicting failures via Alibaba Qwen.
              </p>
              <p className="text-[11px] text-purple-300/70 mt-2 bg-purple-800/30 border border-purple-700/20 p-2 rounded-xl">
                Live Hackathon simulation. Validating PayLabs + serverless metrics.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
