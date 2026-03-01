"use client";

import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";

export function MetricsCard() {
  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    revenueProtected: 0,
  });

  useEffect(() => {
    const handleTxn = (e: any) => {
      const { status, amount, isAiRouted } = e.detail;
      setStats((prev) => {
        const isSuccess = status === "SUCCESS";
        return {
          total: prev.total + 1,
          success: prev.success + (isSuccess ? 1 : 0),
          revenueProtected:
            prev.revenueProtected + (isSuccess && isAiRouted ? amount : 0),
        };
      });
    };
    window.addEventListener("transaction_update", handleTxn);
    return () => window.removeEventListener("transaction_update", handleTxn);
  }, []);

  const successRate =
    stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(1) : "0.0";
  const revenueM = (stats.revenueProtected / 1000000).toFixed(1);

  return (
    <Card className="bg-gradient-to-br from-purple-900 to-indigo-950 border border-purple-700/30 rounded-2xl shadow-lg shadow-purple-900/20">
      <div className="flex items-center divide-x divide-purple-700/40">
        <div className="flex-1 py-3 px-4">
          <div className="text-[11px] font-medium text-purple-300">Success Rate</div>
          <div className="text-xl font-bold text-emerald-400 leading-tight mt-0.5">{successRate}%</div>
        </div>
        <div className="flex-1 py-3 px-4">
          <div className="text-[11px] font-medium text-purple-300">Revenue Protected</div>
          <div className="text-xl font-bold text-emerald-400 leading-tight mt-0.5">Rp {revenueM}M</div>
        </div>
      </div>
    </Card>
  );
}
