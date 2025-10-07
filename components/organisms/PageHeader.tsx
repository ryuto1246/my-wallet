/**
 * ページヘッダー（Organism）
 * ページのタイトルとアクションボタンを表示
 * Liquid Glassスタイルを適用
 */

import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  userName?: string;
  showAddButton?: boolean;
  onAddClick?: () => void;
}

export function PageHeader({
  title,
  description,
  userName,
  showAddButton = false,
  onAddClick,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-5 sm:mb-6 md:mb-8">
      <div className="space-y-1 sm:space-y-2 md:space-y-3">
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
          <div className="p-1.5 sm:p-2 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 backdrop-blur-md border-2 border-white/40 shadow-lg">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 md:h-7 md:w-7 text-blue-700" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-700 via-purple-700 to-pink-700 bg-clip-text text-transparent">
            {title}
          </h1>
        </div>
        <p className="text-gray-800 text-sm sm:text-base md:text-xl font-semibold ml-7 sm:ml-10 md:ml-16">
          {userName ? `ようこそ、${userName}さん` : description}
        </p>
      </div>
      {showAddButton && onAddClick && (
        <Button
          onClick={onAddClick}
          size="lg"
          className="hidden sm:flex rounded-2xl bg-gradient-to-r from-blue-500/90 to-purple-500/90 hover:from-blue-600/90 hover:to-purple-600/90 
                     backdrop-blur-xl border border-white/30 shadow-glass-lg 
                     transition-all duration-300 hover:scale-105 hover:shadow-glass-lg px-10 py-6 text-white font-semibold"
        >
          <Plus className="mr-2 h-6 w-6" />
          新規追加
        </Button>
      )}
    </div>
  );
}
