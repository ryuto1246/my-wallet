/**
 * 残高推移グラフ（Organism）
 * 決済手段別の残高推移を積み上げ棒グラフと総資産を折れ線グラフで表示
 */

"use client";

import { useMemo, useCallback } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { GlassCard } from "@/components/atoms";
import { formatCurrency } from "@/lib/helpers/format";
import {
  calculateBalanceChartData,
  getPaymentMethodsForChart,
  ChartPeriodType,
} from "@/lib/helpers/balance-chart";
import type { Transaction } from "@/types/transaction";
import type { BalanceAdjustment } from "@/types/balance-adjustment";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BalanceChartProps {
  transactions: Transaction[];
  adjustments: BalanceAdjustment[];
  period: ChartPeriodType;
  onPeriodChange: (period: ChartPeriodType) => void;
}

export function BalanceChart({
  transactions,
  adjustments,
  period,
  onPeriodChange,
}: BalanceChartProps) {
  // グラフデータを計算
  const chartData = useMemo(
    () => calculateBalanceChartData(transactions, adjustments, period),
    [transactions, adjustments, period]
  );

  // 決済手段リストを取得
  const paymentMethods = useMemo(() => getPaymentMethodsForChart(), []);

  // カスタムツールチップ
  const CustomTooltip = useMemo(() => {
    const TooltipComponent = ({
      active,
      payload,
      label,
    }: {
      active?: boolean;
      payload?: Array<{ dataKey: string; value: number }>;
      label?: string;
    }) => {
      if (!active || !payload || !payload.length) return null;

      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="font-bold text-sm mb-2">{label}</p>
          <div className="space-y-1">
            {/* 総資産 */}
            <div className="flex items-center justify-between gap-4 border-b border-gray-200 pb-1 mb-1">
              <span className="text-xs font-bold text-black">総資産</span>
              <span className="text-xs font-black text-blue-600">
                {formatCurrency(
                  payload.find((p) => p.dataKey === "totalAssets")?.value || 0
                )}
              </span>
            </div>
            {/* 各決済手段 */}
            {paymentMethods.map(({ key, label, color }) => {
              const positiveItem = payload.find(
                (p) => p.dataKey === `${key}_positive`
              );
              const negativeItem = payload.find(
                (p) => p.dataKey === `${key}_negative`
              );
              const value =
                (positiveItem?.value || 0) + (negativeItem?.value || 0);
              if (value === 0) return null;
              return (
                <div
                  key={key}
                  className="flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs font-medium">{label}</span>
                  </div>
                  <span
                    className={`text-xs font-bold ${
                      value >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {formatCurrency(value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    };
    TooltipComponent.displayName = "CustomTooltip";
    return TooltipComponent;
  }, [paymentMethods]);

  // カスタム凡例
  const CustomLegend = useMemo(() => {
    const LegendComponent = () => (
      <div className="flex flex-wrap justify-center gap-x-2 sm:gap-x-4 gap-y-1 sm:gap-y-2 mt-3 px-2">
        {/* 総資産 */}
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="w-6 sm:w-8 h-0.5 bg-blue-600" />
          <span className="text-xs font-bold text-black whitespace-nowrap">
            総資産
          </span>
        </div>
        {/* 各決済手段 */}
        {paymentMethods.map(({ key, label, color }) => (
          <div key={key} className="flex items-center gap-1 sm:gap-2">
            <div
              className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs font-medium text-black whitespace-nowrap">
              {label}
            </span>
          </div>
        ))}
      </div>
    );
    LegendComponent.displayName = "CustomLegend";
    return LegendComponent;
  }, [paymentMethods]);

  // Y軸のフォーマット
  const formatYAxis = useCallback((value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 10000) {
      return `${value >= 0 ? "" : "-"}${(absValue / 10000).toFixed(0)}万`;
    }
    return formatCurrency(value);
  }, []);

  return (
    <div className="space-y-3">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-black">残高推移</h3>
        <Tabs
          value={period}
          onValueChange={(v) => onPeriodChange(v as ChartPeriodType)}
        >
          <TabsList>
            <TabsTrigger value="month">月次</TabsTrigger>
            <TabsTrigger value="year">年次</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* グラフ */}
      <GlassCard className="p-4">
        <div className="w-full h-[280px] sm:h-[350px]">
          <ResponsiveContainer>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={formatYAxis} />
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />

              {/* X軸（ゼロライン） */}
              <ReferenceLine y={0} stroke="#9CA3AF" strokeWidth={2} />

              {/* 各決済手段の積み上げ棒グラフ（正の値） */}
              {paymentMethods.map(({ key, color }) => (
                <Bar
                  key={`${key}_positive`}
                  dataKey={`${key}_positive`}
                  stackId="positive"
                  fill={color}
                  isAnimationActive={false}
                />
              ))}

              {/* 各決済手段の積み上げ棒グラフ（負の値） */}
              {paymentMethods.map(({ key, color }) => (
                <Bar
                  key={`${key}_negative`}
                  dataKey={`${key}_negative`}
                  stackId="negative"
                  fill={color}
                  isAnimationActive={false}
                />
              ))}

              {/* 総資産の折れ線グラフ */}
              <Line
                type="monotone"
                dataKey="totalAssets"
                stroke="#2563EB"
                strokeWidth={3}
                dot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  );
}
