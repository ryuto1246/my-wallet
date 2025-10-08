/**
 * ページネーションコンポーネント（Atom）
 */

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages?: number;
  hasNext: boolean;
  hasPrevious: boolean;
  onNextPage: () => void;
  onPreviousPage: () => void;
  loading?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  hasNext,
  hasPrevious,
  onNextPage,
  onPreviousPage,
  loading = false,
}: PaginationProps) {
  return (
    <div className="flex items-center justify-between gap-2 md:gap-4 px-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onPreviousPage}
        disabled={!hasPrevious || loading}
        className="rounded-xl bg-white/40 hover:bg-white/60 border-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed px-2 md:px-3"
      >
        <ChevronLeft className="h-4 w-4 md:mr-1" />
        <span className="hidden md:inline">前のページ</span>
      </Button>

      <div className="text-xs md:text-sm font-medium text-gray-700 text-center flex-1">
        <span className="hidden sm:inline">ページ </span>
        {currentPage}
        {totalPages && (
          <span className="text-gray-500">
            <span className="hidden sm:inline"> / </span>
            <span className="sm:hidden">/</span>
            {totalPages}
          </span>
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onNextPage}
        disabled={!hasNext || loading}
        className="rounded-xl bg-white/40 hover:bg-white/60 border-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed px-2 md:px-3"
      >
        <span className="hidden md:inline">次のページ</span>
        <ChevronRight className="h-4 w-4 md:ml-1" />
      </Button>
    </div>
  );
}
