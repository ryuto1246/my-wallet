/**
 * トランザクションリストアイテム（Molecule）
 * 単一のトランザクション情報を表示
 * Liquid Glassスタイルを適用
 */

"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, Pencil } from "lucide-react";
import { getPaymentMethodLabel } from "@/constants/paymentMethods";
import { AdvanceInfo } from "@/types/advance";
import { PaymentMethodValue } from "@/types/transaction";

interface TransactionListItemProps {
  id: string;
  date: Date;
  description: string;
  amount: number;
  isIncome: boolean;
  categoryMain: string;
  categorySub: string;
  paymentMethod?: PaymentMethodValue;
  advance?: AdvanceInfo;
  showBadge?: boolean;
  showPaymentMethod?: boolean;
  dateFormat?: string;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export function TransactionListItem({
  id,
  date,
  description,
  amount,
  isIncome,
  categoryMain,
  categorySub,
  paymentMethod,
  advance,
  showBadge = false,
  showPaymentMethod = false,
  dateFormat = "M/d(E)",
  onDelete,
  onEdit,
}: TransactionListItemProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isAdvanceRecovery = isIncome && categorySub === "立替金回収";
  const isBalanceAdjustment =
    categoryMain === "その他" && categorySub === "残高確認/修正";

  const handleDelete = async () => {
    if (!onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(id);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("削除エラー:", error);
      alert("削除に失敗しました");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div
        className="flex items-center justify-between p-4 md:p-4 rounded-2xl 
                      bg-white/95 backdrop-blur-xl 
                      border-2 border-white/60
                      hover:bg-white
                      hover:border-white/80
                      transition-all duration-300 hover:shadow-glass-lg group"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="font-bold text-base text-gray-900 group-hover:text-blue-700 transition-colors">
              {description}
            </h3>
            {showBadge && (
              <Badge
                variant={isIncome ? "default" : "secondary"}
                className="rounded-full px-2.5 py-0.5 text-xs backdrop-blur-sm font-semibold shadow-none"
              >
                {isIncome ? "収入" : "支出"}
              </Badge>
            )}
            {isAdvanceRecovery && (
              <Badge
                variant="outline"
                className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-blue-600 border-blue-600 bg-blue-50"
              >
                立替金回収
              </Badge>
            )}
            {advance && (
              <Badge
                variant="outline"
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  advance.type === "friend"
                    ? "text-orange-600 border-orange-600 bg-orange-50"
                    : "text-purple-600 border-purple-600 bg-purple-50"
                }`}
              >
                {advance.type === "friend" ? "友人立替" : "親負担"}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-700 flex-wrap font-medium">
            <span className="px-2.5 py-0.5 rounded-full bg-white/70 backdrop-blur-md border border-white/50">
              {format(date, dateFormat, { locale: ja })}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/70 backdrop-blur-md border border-white/50">
              {categoryMain} / {categorySub}
            </span>
            {showPaymentMethod && paymentMethod && (
              <span className="px-2.5 py-0.5 rounded-full bg-white/70 backdrop-blur-md border border-white/50">
                {getPaymentMethodLabel(paymentMethod)}
              </span>
            )}
            {advance && (
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 backdrop-blur-md border border-blue-200 text-blue-700">
                立替: ¥{advance.advanceAmount.toLocaleString()} / 自己: ¥
                {advance.personalAmount.toLocaleString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 ml-4">
          <div className="text-right">
            <div
              className={`text-xl font-bold transition-all ${
                isAdvanceRecovery
                  ? "text-blue-600"
                  : isIncome
                  ? "text-emerald-700"
                  : "text-gray-900"
              }`}
            >
              {isIncome ? "+" : "-"}¥{amount.toLocaleString()}
            </div>
            {isAdvanceRecovery && (
              <div className="text-xs text-blue-500 mt-0.5">回収</div>
            )}
          </div>
          <div
            className={`flex items-center ${
              onEdit && !isBalanceAdjustment ? "gap-2" : "gap-0"
            }`}
          >
            {onEdit && !isBalanceAdjustment && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(id)}
                className="rounded-xl h-9 w-9 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                title="編集"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteDialogOpen(true)}
                className="rounded-xl h-9 w-9 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="削除"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 削除確認ダイアログ */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>取引を削除しますか？</DialogTitle>
            <DialogDescription className="text-gray-600 pt-2">
              この操作は取り消せません。本当にこの取引を削除してもよろしいですか？
            </DialogDescription>
          </DialogHeader>
          <div className="bg-gray-50 rounded-xl p-4 my-2">
            <div className="text-sm text-gray-600 mb-2">
              {format(date, "yyyy年M月d日(E)", { locale: ja })}
            </div>
            <div className="font-bold text-lg text-gray-900 mb-1">
              {description}
            </div>
            <div className="text-sm text-gray-600">
              {categoryMain} / {categorySub}
            </div>
            <div
              className={`text-xl font-bold mt-2 ${
                isIncome ? "text-emerald-700" : "text-gray-900"
              }`}
            >
              {isIncome ? "+" : "-"}¥{amount.toLocaleString()}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
              className="rounded-xl"
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-xl bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "削除中..." : "削除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
