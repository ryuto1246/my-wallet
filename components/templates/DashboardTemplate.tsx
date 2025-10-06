/**
 * ダッシュボードテンプレート（Template）
 * ダッシュボードページのレイアウト
 */

import { ReactNode } from "react";

interface DashboardTemplateProps {
  children: ReactNode;
}

export function DashboardTemplate({ children }: DashboardTemplateProps) {
  return <div className="space-y-8">{children}</div>;
}
