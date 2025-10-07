/**
 * ダッシュボードレイアウト
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/firebase/auth";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (error) {
      console.error("ログアウトエラー:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* ヘッダー - Liquid Glassスタイル */}
      <header className="bg-white/70 backdrop-blur-2xl border-b-2 border-white/40 sticky top-0 z-50 shadow-glass-lg">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-5 flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-8">
            <Link href="/dashboard" className="group">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                  <span className="text-white font-bold text-base sm:text-lg">
                    💰
                  </span>
                </div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Smart Wallet
                </h1>
              </div>
            </Link>
            <nav className="hidden sm:flex space-x-2 md:space-x-3">
              <Link
                href="/dashboard"
                className="px-3 md:px-5 py-1.5 md:py-2.5 rounded-lg md:rounded-xl text-sm md:text-base text-gray-800 hover:bg-white/60 font-semibold transition-all hover:shadow-glass"
              >
                ダッシュボード
              </Link>
              <Link
                href="/transactions"
                className="px-3 md:px-5 py-1.5 md:py-2.5 rounded-lg md:rounded-xl text-sm md:text-base text-gray-800 hover:bg-white/60 font-semibold transition-all hover:shadow-glass"
              >
                取引一覧
              </Link>
            </nav>
          </div>
          <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="rounded-lg md:rounded-xl border-2 border-white/50 bg-white/60 
                         text-gray-900 hover:bg-white/75
                         backdrop-blur-md shadow-glass transition-all hover:scale-105 font-semibold text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
            >
              ログアウト
            </Button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-10">
        {children}
      </main>
    </div>
  );
}
