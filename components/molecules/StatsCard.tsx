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
  details?: { label: string; value: number }[];
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
  details,
}: StatsCardProps) {
  const colors = colorSchemes[colorScheme];

  return (
    <GlassCard
      variant="soft"
      intensity="strong"
      className="overflow-hidden group"
    >
      <div className="p-3 sm:p-4">
        {/* アイコンとタイトルを横並び */}
        <div className="flex items-center gap-3 mb-2">
          <div
            className={`p-2 rounded-lg ${colors.iconBg} shadow-lg transition-transform duration-300 group-hover:scale-110 flex-shrink-0`}
          >
            <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${colors.iconColor}`} />
          </div>
          <h3
            className={`text-xs sm:text-sm font-semibold ${colors.textColor} tracking-wide uppercase`}
          >
            {title}
          </h3>
        </div>

        {/* 金額 */}
        <div
          className={`text-xl sm:text-2xl md:text-3xl font-bold ${colors.valueColor} mb-1`}
        >
          {prefix}¥{value.toLocaleString()}
        </div>

        {/* 詳細情報 */}
        {details && details.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200/50 space-y-1">
            {details.map((detail, index) => (
              <div
                key={index}
                className="flex justify-between items-center text-xs"
              >
                <span className="text-gray-600 font-medium">
                  {detail.label}
                </span>
                <span className={`font-semibold ${colors.textColor}`}>
                  ¥{detail.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ローディング */}
        {loading && (
          <p className={`text-xs ${colors.loadingText} font-medium mt-1`}>
            読み込み中...
          </p>
        )}
      </div>
    </GlassCard>
  );
}
