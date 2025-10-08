/**
 * ページヘッダー（Organism）
 * ページのタイトルとアクションボタンを表示
 * Liquid Glassスタイルを適用
 */

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface PageHeaderProps {
  title: string;
  userName?: string;
  showAddButton?: boolean;
  onAddClick?: () => void;
}

export function PageHeader({
  title,
  userName,
  showAddButton = false,
  onAddClick,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4 sm:mb-5 md:mb-6">
      <div className="space-y-1">
        {/* ユーザー名を先に表示 */}
        {userName && (
          <p className="text-gray-700 text-sm sm:text-base font-medium">
            ようこそ、{userName}さん
          </p>
        )}
        
        {/* ページタイトルを適切なサイズで表示 */}
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
          {title}
        </h1>
      </div>
      {showAddButton && onAddClick && (
        <Button
          onClick={onAddClick}
          size="default"
          className="hidden sm:flex rounded-xl bg-gradient-to-r from-blue-500/90 to-purple-500/90 hover:from-blue-600/90 hover:to-purple-600/90 
                     backdrop-blur-xl border border-white/30 shadow-glass 
                     transition-all duration-300 hover:scale-105 text-white font-semibold"
        >
          <Plus className="mr-2 h-5 w-5" />
          新規追加
        </Button>
      )}
    </div>
  );
}
