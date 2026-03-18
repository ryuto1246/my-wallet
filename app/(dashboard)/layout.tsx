/**
 * ダッシュボードレイアウト
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/firebase/auth";
import Link from "next/link";
import { Menu, LayoutDashboard, List, LogOut, FileText, CreditCard, BarChart2, Bot } from "lucide-react";
import { useState } from "react";
import { ParentAdvanceInvoiceDialog } from "@/components/organisms";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { loading, isAuthenticated, user } = useAuth();
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);

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
        <div className="container mx-auto px-5 md:px-6 lg:px-8 py-3 sm:py-4 md:py-5 flex items-center justify-between">
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

            {/* デスクトップ用ナビゲーション */}
            <nav className="hidden md:flex space-x-2 md:space-x-3">
              <Link href="/dashboard" className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-sm text-gray-800 hover:bg-white/60 font-semibold transition-all hover:shadow-glass">
                ダッシュボード
              </Link>
              <Link href="/transactions" className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-sm text-gray-800 hover:bg-white/60 font-semibold transition-all hover:shadow-glass">
                取引一覧
              </Link>
              <Link href="/advances" className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-sm text-gray-800 hover:bg-white/60 font-semibold transition-all hover:shadow-glass">
                債権管理
              </Link>
              <Link href="/recurring" className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-sm text-gray-800 hover:bg-white/60 font-semibold transition-all hover:shadow-glass">
                固定費
              </Link>
              <Link href="/chat" className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-sm text-gray-800 hover:bg-white/60 font-semibold transition-all hover:shadow-glass">
                AI分析
              </Link>
              <button
                onClick={() => setInvoiceDialogOpen(true)}
                className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-sm text-gray-800 hover:bg-white/60 font-semibold transition-all hover:shadow-glass"
              >
                親立替請求書
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {/* デスクトップ用ログアウトボタン */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="hidden md:flex rounded-lg md:rounded-xl border-2 border-white/50 bg-white/60 
                         text-gray-900 hover:bg-white/75
                         backdrop-blur-md shadow-glass transition-all hover:scale-105 font-semibold text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
            >
              ログアウト
            </Button>

            {/* スマホ用ハンバーガーメニュー */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="md:hidden rounded-lg border-2 border-white/50 bg-white/60 
                             text-gray-900 hover:bg-white/75
                             backdrop-blur-md shadow-glass transition-all hover:scale-105 p-2"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 bg-white/95 backdrop-blur-xl border-2 border-white/50 shadow-glass"
              >
                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span>ダッシュボード</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/transactions" className="flex items-center gap-2 cursor-pointer">
                    <List className="h-4 w-4" />
                    <span>取引一覧</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/advances" className="flex items-center gap-2 cursor-pointer">
                    <CreditCard className="h-4 w-4" />
                    <span>債権管理</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/recurring" className="flex items-center gap-2 cursor-pointer">
                    <BarChart2 className="h-4 w-4" />
                    <span>固定費分析</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/chat" className="flex items-center gap-2 cursor-pointer">
                    <Bot className="h-4 w-4" />
                    <span>AI分析チャット</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setInvoiceDialogOpen(true)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="h-4 w-4" />
                  <span>親立替請求書</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="flex items-center gap-2 cursor-pointer text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  <span>ログアウト</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-5 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-10">
        {children}
      </main>

      {/* 請求書ダイアログ */}
      {user?.id && (
        <ParentAdvanceInvoiceDialog
          open={invoiceDialogOpen}
          onOpenChange={setInvoiceDialogOpen}
          userId={user.id}
        />
      )}
    </div>
  );
}
