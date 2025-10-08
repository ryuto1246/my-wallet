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
    <div className="flex items-center justify-between gap-4 px-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onPreviousPage}
        disabled={!hasPrevious || loading}
        className="rounded-xl bg-white/40 hover:bg-white/60 border-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        前のページ
      </Button>

      <div className="text-sm font-medium text-gray-700">
        ページ {currentPage}
        {totalPages && ` / ${totalPages}`}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onNextPage}
        disabled={!hasNext || loading}
        className="rounded-xl bg-white/40 hover:bg-white/60 border-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        次のページ
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}
