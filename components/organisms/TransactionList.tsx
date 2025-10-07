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
}: TransactionListProps) {
  return (
    <GlassCard variant="soft" intensity="strong" className="overflow-hidden">
      <div className="p-8">
        <div className="flex flex-row items-center justify-between pb-6 mb-2">
          <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
          {!showAll && transactions.length > 0 && onViewAllClick && (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl hover:bg-white/50 transition-all font-semibold"
              onClick={onViewAllClick}
            >
              すべて表示 →
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-700">読み込み中...</div>
        ) : transactions.length === 0 ? (
          <div
            className="text-center py-16 bg-gradient-to-br from-white/40 to-white/20 
                          backdrop-blur-sm rounded-2xl border border-white/30"
          >
            <p className="text-gray-800 mb-6 text-lg font-medium">
              {emptyMessage}
            </p>
            <Button
              onClick={onAddClick}
              className="rounded-2xl bg-gradient-to-r from-blue-500/90 to-purple-500/90 hover:from-blue-600/90 hover:to-purple-600/90 
                         backdrop-blur-xl border border-white/30 shadow-glass-lg 
                         transition-all duration-300 hover:scale-105 text-white font-semibold"
            >
              <Plus className="mr-2 h-4 w-4" />
              {emptyButtonText}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
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
                showBadge={showBadge}
                showPaymentMethod={showPaymentMethod}
                dateFormat={dateFormat}
              />
            ))}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
