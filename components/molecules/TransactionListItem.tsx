/**
 * トランザクションリストアイテム（Molecule）
 * 単一のトランザクション情報を表示
 * Liquid Glassスタイルを適用
 */

"use client";

import { useState, useRef, useEffect } from "react";
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

import { PaymentMethodValue, TransferInfo } from "@/types/transaction";

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
  transfer?: TransferInfo;
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
  transfer,
  showBadge = false,
  showPaymentMethod = false,
  dateFormat = "M/d(E)",
  onDelete,
  onEdit,
}: TransactionListItemProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isSwipeOpen, setIsSwipeOpen] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isAdvanceRecovery = isIncome && categorySub === "立替金回収";
  const isTransfer = !!transfer;

  const handleDelete = async () => {
    if (!onDelete) return;

    setIsDeleting(true);
    setDeleteError(null);
    try {
      await onDelete(id);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("削除エラー:", error);
      setDeleteError("削除に失敗しました。もう一度お試しください。");
    } finally {
      setIsDeleting(false);
    }
  };

  // スワイプハンドラー
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!onEdit && !onDelete) return;
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || (!onEdit && !onDelete)) return;
    const deltaX = e.touches[0].clientX - startX;
    setCurrentX(Math.max(-120, Math.min(0, deltaX)));
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (currentX < -60) {
      setIsSwipeOpen(true);
      setCurrentX(-120);
    } else {
      setIsSwipeOpen(false);
      setCurrentX(0);
    }
  };

  // スワイプを閉じる
  const closeSwipe = () => {
    setIsSwipeOpen(false);
    setCurrentX(0);
  };

  // 他のアイテムがスワイプされたら閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        closeSwipe();
      }
    };

    if (isSwipeOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [isSwipeOpen]);

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl" ref={containerRef}>
        {/* スワイプアクション背景 */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-red-500 flex items-center justify-end pr-4">
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  onEdit(id);
                  closeSwipe();
                }}
                className="rounded-xl h-10 w-10 bg-white/20 hover:bg-white/30 text-white"
                title="編集"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setDeleteDialogOpen(true);
                  closeSwipe();
                }}
                className="rounded-xl h-10 w-10 bg-white/20 hover:bg-white/30 text-white"
                title="削除"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* メインコンテンツ */}
        <div
          className={`relative flex flex-col md:flex-row md:items-center justify-between p-2 md:p-4 rounded-2xl 
                      bg-white/95 backdrop-blur-xl 
                      border-2 border-white/60
                      hover:bg-white
                      hover:border-white/80
                      transition-all duration-300 hover:shadow-glass-lg group
                      ${
                        isDragging
                          ? "transition-none"
                          : "transition-transform duration-200"
                      }`}
          style={{ transform: `translateX(${currentX}px)` }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex-1 w-full">
            {/* ヘッダー部分: 説明とバッジ */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-gray-900 group-hover:text-blue-700 transition-colors truncate">
                  {description}
                </h3>
                {/* デスクトップ用の詳細情報 - 項目名の下 */}
                <div className="hidden md:flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 mt-1">
                  <span>{format(date, dateFormat, { locale: ja })}</span>
                  <span>•</span>
                  <span>
                    {categoryMain} / {categorySub}
                  </span>
                  {showPaymentMethod && paymentMethod && (
                    <>
                      <span>•</span>
                      <span>{getPaymentMethodLabel(paymentMethod)}</span>
                    </>
                  )}
                  {advance &&
                    advance.advanceAmount !== undefined &&
                    advance.personalAmount !== undefined && (
                      <>
                        <span>•</span>
                        <span className="text-blue-600">
                          立替: ¥{advance.advanceAmount.toLocaleString()} /
                          自己: ¥{advance.personalAmount.toLocaleString()}
                        </span>
                      </>
                    )}
                  {isTransfer && transfer && (
                    <>
                      <span>•</span>
                      <span className="text-indigo-600 font-medium">
                        {getPaymentMethodLabel(transfer.from)} →{" "}
                        {getPaymentMethodLabel(transfer.to)}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                {showBadge && (
                  <Badge
                    variant={
                      isTransfer
                        ? "secondary"
                        : isIncome
                        ? "default"
                        : "secondary"
                    }
                    className="rounded-full px-1.5 py-0.5 text-xs backdrop-blur-sm font-semibold shadow-none"
                  >
                    {isTransfer ? "振替" : isIncome ? "収入" : "支出"}
                  </Badge>
                )}
                {isAdvanceRecovery && (
                  <Badge
                    variant="outline"
                    className="rounded-full px-1.5 py-0.5 text-xs font-semibold text-blue-600 border-blue-600 bg-blue-50"
                  >
                    立替金回収
                  </Badge>
                )}
                {advance && (
                  <Badge
                    variant="outline"
                    className="rounded-full px-1.5 py-0.5 text-xs font-semibold text-orange-600 border-orange-600 bg-orange-50"
                  >
                    {advance.type === "friend" ? "友人立替"
                      : advance.type === "parent" ? "父"
                      : advance.type || "立替"}
                  </Badge>
                )}
              </div>
            </div>

            {/* 金額と詳細情報 - スマホのみ表示 */}
            <div className="flex items-center justify-between md:hidden">
              <div
                className={`text-base font-bold transition-all ${
                  isAdvanceRecovery
                    ? "text-blue-600"
                    : isTransfer
                    ? "text-indigo-700"
                    : isIncome
                    ? "text-emerald-700"
                    : "text-gray-900"
                }`}
              >
                {isTransfer ? "" : isIncome ? "+" : "-"}¥
                {amount.toLocaleString()}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span>{format(date, dateFormat, { locale: ja })}</span>
                <span>•</span>
                <span>{categoryMain}</span>
                {showPaymentMethod && paymentMethod && (
                  <>
                    <span>•</span>
                    <span>{getPaymentMethodLabel(paymentMethod)}</span>
                  </>
                )}
              </div>
            </div>

            {/* 追加情報 - スマホのみ表示 */}
            {(advance || isTransfer) && (
              <div className="mt-1 text-xs text-gray-600 md:hidden">
                {advance &&
                  advance.advanceAmount !== undefined &&
                  advance.personalAmount !== undefined && (
                    <span className="text-blue-600">
                      立替: ¥{advance.advanceAmount.toLocaleString()} / 自己: ¥
                      {advance.personalAmount.toLocaleString()}
                    </span>
                  )}
                {isTransfer && transfer && (
                  <span className="text-indigo-600 font-medium">
                    {getPaymentMethodLabel(transfer.from)} →{" "}
                    {getPaymentMethodLabel(transfer.to)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* デスクトップ用の金額とアクションボタンエリア */}
          <div className="hidden md:flex items-center gap-3 ml-4">
            <div className="text-right">
              <div
                className={`text-xl font-bold transition-all ${
                  isAdvanceRecovery
                    ? "text-blue-600"
                    : isTransfer
                    ? "text-indigo-700"
                    : isIncome
                    ? "text-emerald-700"
                    : "text-gray-900"
                }`}
              >
                {isTransfer ? "" : isIncome ? "+" : "-"}¥
                {amount.toLocaleString()}
              </div>
              {isAdvanceRecovery && (
                <div className="text-xs text-blue-500 mt-0.5">回収</div>
              )}
              {isTransfer && (
                <div className="text-xs text-indigo-600 mt-0.5">振替</div>
              )}
            </div>
            <div className={`flex items-center ${onEdit ? "gap-2" : "gap-0"}`}>
              {onEdit && (
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
      </div>

      {/* 削除確認ダイアログ */}
      <Dialog open={deleteDialogOpen} onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) setDeleteError(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>取引を削除しますか？</DialogTitle>
            <DialogDescription className="text-gray-600 pt-2">
              この操作は取り消せません。本当にこの取引を削除してもよろしいですか？
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <div className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">
              {deleteError}
            </div>
          )}
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
