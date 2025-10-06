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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* ヘッダー */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Smart Wallet
              </h1>
            </Link>
            <nav className="flex space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                ダッシュボード
              </Link>
              <Link
                href="/transactions"
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                取引一覧
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700 font-medium">
              {user?.displayName}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="rounded-full border-2 hover:bg-gray-100 hover:border-gray-400 transition-all"
            >
              ログアウト
            </Button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
