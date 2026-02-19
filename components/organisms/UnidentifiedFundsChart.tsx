/**
 * 使途不明金（残高確認による修正の絶対値）月別グラフ（小さめ表示）
 */

"use client";

import { useMemo, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { GlassCard } from "@/components/atoms";
import { formatCurrency } from "@/lib/helpers/format";
import { calculateMonthlyUnidentifiedFunds } from "@/lib/helpers/balance-chart";
import type { BalanceAdjustment } from "@/types/balance-adjustment";

interface UnidentifiedFundsChartProps {
  adjustments: BalanceAdjustment[];
}

export function UnidentifiedFundsChart({ adjustments }: UnidentifiedFundsChartProps) {
  const chartData = useMemo(
    () => calculateMonthlyUnidentifiedFunds(adjustments),
    [adjustments]
  );

  const formatYAxis = useCallback((value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 10000) {
      return `${(absValue / 10000).toFixed(0)}万`;
    }
    return value.toString();
  }, []);

  const CustomTooltip = useCallback(
    ({
      active,
      payload,
      label,
    }: {
      active?: boolean;
      payload?: Array<{ value: number }>;
      label?: string;
    }) => {
      if (!active || !payload?.length) return null;
      const value = payload[0]?.value ?? 0;
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg px-2 py-1.5 shadow text-xs">
          <p className="font-medium text-gray-700">{label}</p>
          <p className="font-bold">{formatCurrency(value)}</p>
        </div>
      );
    },
    []
  );

  return (
    <div className="space-y-1">
      <h3 className="text-sm font-bold text-black">使途不明金</h3>
      <GlassCard className="p-2 sm:p-3">
        <div className="w-full h-[140px]">
          <ResponsiveContainer>
            <BarChart
              data={chartData}
              margin={{ top: 4, right: 4, left: -8, bottom: -10 }}
            >
              <CartesianGrid strokeDasharray="2 2" stroke="#E5E7EB" />
              <XAxis
                dataKey="date"
                interval="preserveStartEnd"
                angle={-35}
                textAnchor="end"
                height={36}
                fontSize={10}
                tickMargin={2}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 30000]}
                tickFormatter={formatYAxis}
                width={28}
                tickMargin={0}
                axisLine={false}
                tickLine={false}
                fontSize={9}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="amount"
                fill="#EF4444"
                radius={[2, 2, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  );
}
