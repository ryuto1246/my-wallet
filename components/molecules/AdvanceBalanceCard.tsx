/**
 * 立替金残高表示カード
 */

"use client";

import { GlassCard } from "@/components/atoms";
import { Badge } from "@/components/ui/badge";
import { ArrowDownRight, ArrowUpRight, DollarSign } from "lucide-react";

interface AdvanceBalanceCardProps {
  totalAdvanced: number;
  totalRecovered: number;
  remaining: number;
  className?: string;
}

export function AdvanceBalanceCard({
  totalAdvanced,
  totalRecovered,
  remaining,
  className,
}: AdvanceBalanceCardProps) {
  const colorScheme = remaining > 0 ? "orange" : "green";
  const colors = {
    orange: {
      iconBg: "bg-gradient-to-br from-amber-500 to-orange-600",
      iconColor: "text-white",
      textColor: "text-gray-800",
      valueColor: "text-amber-800",
    },
    green: {
      iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
      iconColor: "text-white",
      textColor: "text-gray-800",
      valueColor: "text-emerald-800",
    },
  };
  const currentColors = colors[colorScheme];

  return (
    <GlassCard
      variant="soft"
      intensity="strong"
      className={`overflow-hidden group ${className}`}
    >
      <div className="p-3 sm:p-4">
        {/* アイコンとタイトルを横並び */}
        <div className="flex items-center gap-3 mb-2">
          <div
            className={`p-2 rounded-lg ${currentColors.iconBg} shadow-lg transition-transform duration-300 group-hover:scale-110 flex-shrink-0`}
          >
            <DollarSign
              className={`h-4 w-4 sm:h-5 sm:w-5 ${currentColors.iconColor}`}
            />
          </div>
          <h3
            className={`text-xs sm:text-sm font-semibold ${currentColors.textColor} tracking-wide uppercase`}
          >
            立替金残高
          </h3>
        </div>

        {/* 金額とバッジ */}
        <div className="flex items-center gap-2 mb-2">
          <div
            className={`text-xl sm:text-2xl md:text-3xl font-bold ${currentColors.valueColor}`}
          >
            ¥{remaining.toLocaleString()}
          </div>
          {remaining > 0 && (
            <Badge
              variant="outline"
              className="text-orange-600 border-orange-600 text-xs"
            >
              未回収
            </Badge>
          )}
          {remaining === 0 && totalAdvanced > 0 && (
            <Badge
              variant="outline"
              className="text-green-600 border-green-600 text-xs"
            >
              回収済み
            </Badge>
          )}
          {remaining === 0 && totalAdvanced === 0 && (
            <Badge
              variant="outline"
              className="text-gray-600 border-gray-600 text-xs"
            >
              立替なし
            </Badge>
          )}
        </div>

        {/* 詳細情報 */}
        <div className="mt-2 pt-2 border-t border-gray-200/50 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-red-500" />
              <span className="text-gray-600 font-medium">立替済み</span>
            </div>
            <span className={`font-semibold ${currentColors.textColor}`}>
              ¥{totalAdvanced.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <ArrowDownRight className="h-3 w-3 text-green-500" />
              <span className="text-gray-600 font-medium">回収済み</span>
            </div>
            <span className={`font-semibold ${currentColors.textColor}`}>
              ¥{totalRecovered.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
