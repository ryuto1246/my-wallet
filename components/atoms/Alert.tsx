/**
 * Alert（Atom）
 * 様々な種類のメッセージを表示する汎用的なアラートコンポーネント
 * Liquid Glassスタイルを適用
 */

import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";

interface AlertProps {
  message: string;
  variant?: "error" | "success" | "info" | "warning";
}

const variants = {
  error: {
    bg: "bg-red-50/70",
    border: "border-red-200/60",
    icon: AlertCircle,
    iconColor: "text-red-600",
    textColor: "text-red-800",
  },
  success: {
    bg: "bg-emerald-50/70",
    border: "border-emerald-200/60",
    icon: CheckCircle,
    iconColor: "text-emerald-600",
    textColor: "text-emerald-800",
  },
  info: {
    bg: "bg-blue-50/70",
    border: "border-blue-200/60",
    icon: Info,
    iconColor: "text-blue-600",
    textColor: "text-blue-800",
  },
  warning: {
    bg: "bg-amber-50/70",
    border: "border-amber-200/60",
    icon: AlertTriangle,
    iconColor: "text-amber-600",
    textColor: "text-amber-800",
  },
};

export function Alert({ message, variant = "info" }: AlertProps) {
  if (!message) return null;

  const config = variants[variant];
  const Icon = config.icon;

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-2xl 
                  ${config.bg}
                  backdrop-blur-md
                  border-2 ${config.border}
                  shadow-sm
                  transition-all duration-200`}
    >
      <Icon className={`h-5 w-5 ${config.iconColor} mt-0.5 flex-shrink-0`} />
      <p className={`text-sm font-medium ${config.textColor} leading-relaxed`}>
        {message}
      </p>
    </div>
  );
}
