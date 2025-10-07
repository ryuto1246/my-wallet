/**
 * 認証テンプレート（Template）
 * ログイン・サインアップページのレイアウト
 * トップページと同じ明るいテーマを適用
 */

import { ReactNode } from "react";

interface AuthTemplateProps {
  children: ReactNode;
}

export function AuthTemplate({ children }: AuthTemplateProps) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Liquid Glass効果を引き立てるグラデーションブロブ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-purple-300/30 rounded-full blur-3xl" />
        <div className="absolute top-3/4 left-1/3 w-72 h-72 bg-pink-300/25 rounded-full blur-3xl" />
      </div>

      {/* コンテンツ */}
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
