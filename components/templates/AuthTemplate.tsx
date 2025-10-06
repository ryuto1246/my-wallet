/**
 * 認証テンプレート（Template）
 * ログイン・サインアップページのレイアウト
 */

import { ReactNode } from "react";

interface AuthTemplateProps {
  children: ReactNode;
}

export function AuthTemplate({ children }: AuthTemplateProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      {children}
    </div>
  );
}
