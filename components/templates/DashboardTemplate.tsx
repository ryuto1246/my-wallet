/**
 * ダッシュボードテンプレート（Template）
 * ダッシュボードページのレイアウト
 * Liquid Glassスタイルの背景を適用
 */

import { ReactNode } from "react";

interface DashboardTemplateProps {
  children: ReactNode;
}

export function DashboardTemplate({ children }: DashboardTemplateProps) {
  return (
    <div className="space-y-6 sm:space-y-8 relative">
      {/* デコレーション用のグラデーションブロブ */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* コンテンツ */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
