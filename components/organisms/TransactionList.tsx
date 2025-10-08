/**
 * トランザクションリスト（Organism）
 * トランザクション一覧を表示するカード
 * Liquid Glassスタイルを適用
 */

import { GlassCard } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TransactionListItem } from "@/components/molecules";
import { Transaction } from "@/types";

interface TransactionListProps {
  title: string;
  transactions: Transaction[];
  loading?: boolean;
  showAll?: boolean;
  showBadge?: boolean;
  showPaymentMethod?: boolean;
  dateFormat?: string;
  emptyMessage?: string;
  emptyButtonText?: string;
  onAddClick: () => void;
  onViewAllClick?: () => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export function TransactionList({
  title,
  transactions,
  loading = false,
  showAll = false,
  showBadge = false,
  showPaymentMethod = false,
  dateFormat = "M/d(E)",
  emptyMessage = "まだ取引がありません",
  emptyButtonText = "最初の取引を追加",
  onAddClick,
  onViewAllClick,
  onDelete,
  onEdit,
}: TransactionListProps) {
  return (
    <GlassCard variant="soft" intensity="strong" className="overflow-hidden">
      <div className="p-4 sm:p-5 md:p-6">
        <div className="flex flex-row items-center justify-between pb-3 sm:pb-4 mb-2">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
            {title}
          </h2>
          {!showAll && transactions.length > 0 && onViewAllClick && (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl hover:bg-white/50 transition-all font-semibold text-sm"
              onClick={onViewAllClick}
            >
              すべて表示 →
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8 sm:py-12 text-sm sm:text-base text-gray-700">
            読み込み中...
          </div>
        ) : transactions.length === 0 ? (
          <div
            className="text-center py-10 sm:py-16 bg-gradient-to-br from-white/40 to-white/20 
                          backdrop-blur-sm rounded-2xl border border-white/30"
          >
            <p className="text-gray-800 mb-4 sm:mb-6 text-base sm:text-lg font-medium">
              {emptyMessage}
            </p>
            <Button
              onClick={onAddClick}
              className="rounded-2xl bg-gradient-to-r from-blue-500/90 to-purple-500/90 hover:from-blue-600/90 hover:to-purple-600/90 
                         backdrop-blur-xl border border-white/30 shadow-glass-lg 
                         transition-all duration-300 hover:scale-105 text-white font-semibold text-sm sm:text-base"
            >
              <Plus className="mr-2 h-4 w-4" />
              {emptyButtonText}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((transaction) => (
              <TransactionListItem
                key={transaction.id}
                id={transaction.id}
                date={transaction.date}
                description={transaction.description}
                amount={transaction.amount}
                isIncome={transaction.isIncome}
                categoryMain={transaction.category.main}
                categorySub={transaction.category.sub}
                paymentMethod={transaction.paymentMethod}
                advance={transaction.advance}
                transfer={transaction.transfer}
                showBadge={showBadge}
                showPaymentMethod={showPaymentMethod}
                dateFormat={dateFormat}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            ))}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
