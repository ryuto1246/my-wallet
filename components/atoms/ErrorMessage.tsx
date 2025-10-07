/**
 * エラーメッセージ（Atom）
 * エラー表示用の再利用可能なコンポーネント
 * Liquid Glassスタイルを適用
 */

import { AlertCircle } from "lucide-react";

interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-2xl 
                    bg-red-50/70
                    backdrop-blur-md
                    border-2 border-red-200/60
                    shadow-sm
                    transition-all duration-200"
    >
      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
      <p className="text-sm font-medium text-red-800 leading-relaxed">
        {message}
      </p>
    </div>
  );
}
