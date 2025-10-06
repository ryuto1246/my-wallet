/**
 * 統計カード（Molecule）
 * ダッシュボードの統計情報を表示するカード
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    bg: "bg-gradient-to-br from-emerald-500 to-teal-600",
    text: "text-white",
    loadingText: "text-emerald-50",
  },
  red: {
    bg: "bg-gradient-to-br from-rose-500 to-pink-600",
    text: "text-white",
    loadingText: "text-rose-50",
  },
  blue: {
    bg: "bg-gradient-to-br from-blue-500 to-indigo-600",
    text: "text-white",
    loadingText: "text-blue-50",
  },
  orange: {
    bg: "bg-gradient-to-br from-amber-500 to-orange-600",
    text: "text-white",
    loadingText: "text-amber-50",
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
    <Card
      className={`border-0 shadow-soft rounded-3xl overflow-hidden ${colors.bg}`}
    >
      <CardHeader className="pb-3">
        <CardTitle
          className={`text-sm font-medium ${colors.text} flex items-center gap-2`}
        >
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-white mb-1">
          {prefix}¥{value.toLocaleString()}
        </div>
        {loading && (
          <p className={`text-xs ${colors.loadingText}`}>読み込み中...</p>
        )}
      </CardContent>
    </Card>
  );
}
