/**
 * 統計カード（Molecule）
 * ダッシュボードの統計情報を表示するカード
 * Liquid Glassスタイルを適用
 */

import { GlassCard } from "@/components/atoms";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  colorScheme: "green" | "red" | "blue" | "orange";
  loading?: boolean;
  prefix?: string;
}

const colorSchemes = {
  green: {
    iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
    iconColor: "text-white",
    textColor: "text-gray-800",
    valueColor: "text-emerald-800",
    loadingText: "text-emerald-700",
  },
  red: {
    iconBg: "bg-gradient-to-br from-rose-500 to-pink-600",
    iconColor: "text-white",
    textColor: "text-gray-800",
    valueColor: "text-rose-800",
    loadingText: "text-rose-700",
  },
  blue: {
    iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
    iconColor: "text-white",
    textColor: "text-gray-800",
    valueColor: "text-blue-800",
    loadingText: "text-blue-700",
  },
  orange: {
    iconBg: "bg-gradient-to-br from-amber-500 to-orange-600",
    iconColor: "text-white",
    textColor: "text-gray-800",
    valueColor: "text-amber-800",
    loadingText: "text-amber-700",
  },
};

export function StatsCard({
  title,
  value,
  icon: Icon,
  colorScheme,
  loading = false,
  prefix = "",
}: StatsCardProps) {
  const colors = colorSchemes[colorScheme];

  return (
    <GlassCard
      variant="soft"
      intensity="strong"
      className="overflow-hidden group"
    >
      <div className="p-4 sm:p-6 md:p-8">
        <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
          <div
            className={`p-2.5 sm:p-3 md:p-4 rounded-xl md:rounded-2xl ${colors.iconBg} shadow-xl transition-transform duration-300 group-hover:scale-110`}
          >
            <Icon
              className={`h-5 w-5 sm:h-5 sm:w-5 md:h-6 md:w-6 ${colors.iconColor}`}
            />
          </div>
        </div>

        <h3
          className={`text-xs sm:text-sm font-semibold ${colors.textColor} mb-2 md:mb-3 tracking-wide uppercase`}
        >
          {title}
        </h3>

        <div
          className={`text-2xl sm:text-3xl md:text-4xl font-bold ${colors.valueColor} mb-1 md:mb-2`}
        >
          {prefix}¥{value.toLocaleString()}
        </div>

        {loading && (
          <p className={`text-xs sm:text-sm ${colors.loadingText} font-medium`}>
            読み込み中...
          </p>
        )}
      </div>
    </GlassCard>
  );
}
