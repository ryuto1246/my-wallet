/**
 * ページヘッダー（Organism）
 * ページのタイトルとアクションボタンを表示
 * Liquid Glassスタイルを適用
 */

"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Image as ImageIcon,
  ArrowLeftRight,
  MoreVertical,
} from "lucide-react";

interface PageHeaderProps {
  title: string;
  userName?: string;
  showAddButton?: boolean;
  onAddClick?: () => void;
  showImageButton?: boolean;
  onImageClick?: () => void;
  showTransferButton?: boolean;
  onTransferClick?: () => void;
}

export function PageHeader({
  title,
  userName,
  showAddButton = false,
  onAddClick,
  showImageButton = false,
  onImageClick,
  showTransferButton = false,
  onTransferClick,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4 sm:mb-5 md:mb-6">
      <div className="space-y-1">
        {/* ユーザー名を先に表示 */}
        {userName && (
          <p className="text-gray-700 text-base sm:text-lg md:text-xl font-medium">
            ようこそ、{userName}さん
          </p>
        )}

        {/* ページタイトルを適切なサイズで表示 */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
          {title}
        </h1>
      </div>

      {/* ボタンエリア */}
      {(showAddButton || showImageButton || showTransferButton) && (
        <div className="flex gap-2">
          {/* デスクトップ用ボタン */}
          {showImageButton && onImageClick && (
            <Button
              onClick={onImageClick}
              size="default"
              variant="outline"
              className="hidden md:flex rounded-xl border-2 border-purple-200/80 bg-white/60
                         backdrop-blur-xl hover:bg-purple-50/80 hover:border-purple-300/80
                         transition-all duration-300 hover:scale-105 text-purple-700 font-semibold"
            >
              <ImageIcon className="mr-2 h-5 w-5" />
              画像から入力
            </Button>
          )}
          {showTransferButton && onTransferClick && (
            <Button
              onClick={onTransferClick}
              size="default"
              variant="outline"
              className="hidden md:flex rounded-xl border-2 border-green-200/80 bg-white/60
                         backdrop-blur-xl hover:bg-green-50/80 hover:border-green-300/80
                         transition-all duration-300 hover:scale-105 text-green-700 font-semibold"
            >
              <ArrowLeftRight className="mr-2 h-5 w-5" />
              振替
            </Button>
          )}
          {showAddButton && onAddClick && (
            <Button
              onClick={onAddClick}
              size="default"
              className="hidden md:flex rounded-xl bg-gradient-to-r from-blue-500/90 to-purple-500/90 hover:from-blue-600/90 hover:to-purple-600/90 
                         backdrop-blur-xl border border-white/30 shadow-glass 
                         transition-all duration-300 hover:scale-105 text-white font-semibold"
            >
              <Plus className="mr-2 h-5 w-5" />
              新規追加
            </Button>
          )}

          {/* スマホ用アクションメニュー */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="default"
                className="md:hidden rounded-xl bg-gradient-to-r from-blue-500/90 to-purple-500/90 hover:from-blue-600/90 hover:to-purple-600/90 
                           backdrop-blur-xl border border-white/30 shadow-glass 
                           transition-all duration-300 hover:scale-105 text-white font-semibold"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 bg-white/95 backdrop-blur-xl border-2 border-white/50 shadow-glass"
            >
              {showAddButton && onAddClick && (
                <DropdownMenuItem
                  onClick={onAddClick}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>新規追加</span>
                </DropdownMenuItem>
              )}
              {showImageButton && onImageClick && (
                <DropdownMenuItem
                  onClick={onImageClick}
                  className="flex items-center gap-2 cursor-pointer text-purple-700"
                >
                  <ImageIcon className="h-4 w-4" />
                  <span>画像から入力</span>
                </DropdownMenuItem>
              )}
              {showTransferButton && onTransferClick && (
                <DropdownMenuItem
                  onClick={onTransferClick}
                  className="flex items-center gap-2 cursor-pointer text-green-700"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                  <span>振替</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
