/**
 * アプリケーションロゴ（Atom）
 * ブランディング用のロゴコンポーネント
 */

interface LogoProps {
  size?: "sm" | "md" | "lg";
}

export function Logo({ size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "text-2xl",
    md: "text-3xl",
    lg: "text-4xl",
  };

  return (
    <h1
      className={`${sizeClasses[size]} font-bold text-center bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent`}
    >
      Smart Wallet
    </h1>
  );
}
