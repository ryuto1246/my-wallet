/**
 * ページヘッダー（Organism）
 * ページのタイトルとアクションボタンを表示
 */

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

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
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
          {title}
        </h1>
        <p className="text-gray-700 mt-2 text-lg">
          {userName ? `ようこそ、${userName}さん` : description}
        </p>
      </div>
      {showAddButton && onAddClick && (
        <Button
          onClick={onAddClick}
          size="lg"
          className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/30 px-8"
        >
          <Plus className="mr-2 h-5 w-5" />
          新規追加
        </Button>
      )}
    </div>
  );
}
