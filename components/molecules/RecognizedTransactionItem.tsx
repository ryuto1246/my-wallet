/**
 * 認識された取引アイテム
 * 一括画像認識ダイアログで使用
 */

"use client";

import { AlertTriangle, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/helpers/format";
import type { RecognizedTransaction } from "@/types/image-recognition";
import type { AdvanceInfo } from "@/types/advance";

interface RecognizedTransactionItemProps {
  transaction: RecognizedTransaction;
  selected: boolean;
  isDuplicate: boolean;
  duplicateReason?: string;
  matchingTransactions?: Array<{
    id: string;
    date: Date;
    amount: number;
    description: string;
    category: {
      main: string;
      sub: string;
    };
  }>;
  // 画像から読み込み後に編集で付与された立替情報
  advance?: Partial<AdvanceInfo>;
  // 推測した取引タイプ
  inferredType?: "income" | "expense" | "transfer";
  onToggleSelect: () => void;
  onEdit: () => void;
}

export function RecognizedTransactionItem({
  transaction,
  selected,
  isDuplicate,
  duplicateReason,
  matchingTransactions,
  advance,
  inferredType,
  onToggleSelect,
  onEdit,
}: RecognizedTransactionItemProps) {
  return (
    <div
      className={`p-4 border rounded-lg transition-all hover:shadow-md ${
        isDuplicate
          ? "border-yellow-300 bg-yellow-50/50"
          : selected
          ? "border-primary bg-primary/5"
          : "border-gray-200"
      }`}
    >
      <div className="flex items-start gap-4">
        {/* チェックボックス */}
        <div className="pt-1">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            className="w-5 h-5 rounded border-gray-300"
          />
        </div>

        {/* 取引情報 */}
        <div className="flex-1 flex items-center justify-between">
          <div className="flex-1">
            {/* 店舗名とバッジ */}
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <h3 className="font-bold text-base text-gray-900">
                {transaction.merchantName || "不明"}
              </h3>
              {/* 取引タイプバッジ */}
              {inferredType && (
                <Badge
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    inferredType === "income"
                      ? "bg-green-600 text-white"
                      : inferredType === "transfer"
                      ? "bg-purple-600 text-white"
                      : "bg-blue-600 text-white"
                  }`}
                >
                  {inferredType === "income"
                    ? "収入"
                    : inferredType === "transfer"
                    ? "振替"
                    : "支出"}
                </Badge>
              )}
              {/* 立替/援助バッジ */}
              {advance && (
                <Badge className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                  {advance.type === "parent" ? "援助" : "立替"}
                </Badge>
              )}
              {isDuplicate && (
                <Badge
                  variant="outline"
                  className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-yellow-700 border-yellow-400 bg-yellow-50"
                >
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  重複
                </Badge>
              )}
              {transaction.confidence && (
                <Badge
                  variant={
                    transaction.confidence >= 0.8 ? "default" : "secondary"
                  }
                  className="rounded-full px-2.5 py-0.5 text-xs backdrop-blur-sm font-semibold"
                >
                  {Math.round(transaction.confidence * 100)}%
                </Badge>
              )}
            </div>

            {/* 日付・カテゴリー */}
            <div className="flex items-center gap-2 text-xs text-gray-700 flex-wrap font-medium">
              <span className="px-2.5 py-0.5 rounded-full bg-white/70 backdrop-blur-md border border-white/50">
                {transaction.date ? formatDate(transaction.date) : "不明"}
              </span>
              {transaction.suggestedCategory && (
                <span className="px-2.5 py-0.5 rounded-full bg-white/70 backdrop-blur-md border border-white/50">
                  {transaction.suggestedCategory.main} /{" "}
                  {transaction.suggestedCategory.sub}
                </span>
              )}
            </div>

            {/* 重複理由と類似取引 */}
            {isDuplicate && (
              <div className="mt-3 space-y-2">
                {duplicateReason && (
                  <p className="text-xs text-yellow-700 font-medium">
                    {duplicateReason}
                  </p>
                )}

                {/* 類似している既存取引 */}
                {matchingTransactions && matchingTransactions.length > 0 && (
                  <div className="space-y-2">
                    {matchingTransactions.map((match) => (
                      <div
                        key={match.id}
                        className="p-2 rounded-lg bg-yellow-50/80 border border-yellow-200"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate">
                              {match.description}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-gray-600">
                                {formatDate(match.date)}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                •
                              </span>
                              <span className="text-[10px] text-gray-600">
                                {match.category.main} / {match.category.sub}
                              </span>
                            </div>
                          </div>
                          <div className="text-xs font-bold text-gray-800 whitespace-nowrap">
                            ¥{match.amount.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 金額と編集ボタン */}
          <div className="flex items-center gap-3 ml-4">
            <div className="text-right">
              <div className="text-xl font-bold text-gray-900">
                {transaction.amount !== null
                  ? `¥${transaction.amount.toLocaleString()}`
                  : "不明"}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="rounded-xl h-9 w-9 hover:bg-blue-50 hover:text-blue-600 transition-colors flex-shrink-0"
              title="編集"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
