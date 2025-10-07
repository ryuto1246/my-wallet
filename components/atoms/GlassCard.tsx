/**
 * GlassCard（Atom）
 * Liquid Glass（Glassmorphism）スタイルのカードコンポーネント
 * 再利用可能で、様々なバリエーションに対応
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "gradient" | "soft";
  intensity?: "light" | "medium" | "strong";
  gradient?: "blue" | "purple" | "pink" | "green" | "orange" | "none";
}

const variants = {
  default: "bg-white/90",
  gradient: "bg-gradient-to-br",
  soft: "bg-white/95",
};

const intensities = {
  light: "backdrop-blur-md",
  medium: "backdrop-blur-xl",
  strong: "backdrop-blur-2xl",
};

const gradients = {
  blue: "from-blue-500/30 to-cyan-500/30",
  purple: "from-purple-500/30 to-pink-500/30",
  pink: "from-pink-500/30 to-rose-500/30",
  green: "from-emerald-500/30 to-teal-500/30",
  orange: "from-orange-500/30 to-amber-500/30",
  none: "",
};

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      className,
      variant = "default",
      intensity = "medium",
      gradient = "none",
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          // ベーススタイル
          "rounded-3xl border-2 border-white/40",
          "shadow-glass-lg",
          "transition-all duration-300 ease-in-out",
          "hover:shadow-glass-lg hover:scale-[1.01] hover:border-white/60",

          // バリアント
          variants[variant],

          // ぼかし強度
          intensities[intensity],

          // グラデーション
          gradient !== "none" && gradients[gradient],

          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";
