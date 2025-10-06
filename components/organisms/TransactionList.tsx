/**
 * トランザクションリスト（Organism）
 * トランザクション一覧を表示するカード
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="border-0 shadow-soft rounded-3xl">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-2xl">{title}</CardTitle>
        {!showAll && transactions.length > 0 && onViewAllClick && (
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full"
            onClick={onViewAllClick}
          >
            すべて表示 →
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-12 text-gray-700">読み込み中...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
            <p className="text-gray-700 mb-6 text-lg">{emptyMessage}</p>
            <Button
              onClick={onAddClick}
              className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/30"
            >
              <Plus className="mr-2 h-4 w-4" />
              {emptyButtonText}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
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
      </CardContent>
    </Card>
  );
}
