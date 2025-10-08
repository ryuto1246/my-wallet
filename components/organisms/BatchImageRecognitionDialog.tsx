/**
 * 一括画像認識ダイアログ
 * 取引リストの画像から複数の取引を認識して一括登録
 */

"use client";

import { useState } from "react";
import { Loader2, Check, AlertTriangle, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ImageUploadZone } from "@/components/organisms/ImageUploadZone";
import { TransactionFormNew } from "@/components/organisms";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/helpers/format";
import { useAuth, useTransactions } from "@/hooks";
import { recognizeBatchTransactionsFromImage } from "@/lib/gemini/batch-vision";
import { uploadTransactionImage } from "@/lib/firebase/storage";
import { batchDetectDuplicates } from "@/lib/helpers/duplicate-detection";
import type {
  RecognizedTransaction,
  PaymentService,
} from "@/types/image-recognition";
import type { TransactionInput } from "@/types/transaction";
import { TransactionFormValues } from "@/lib/validations/transaction";

interface BatchImageRecognitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBatchSubmit: (transactions: TransactionInput[]) => Promise<void>;
}

interface RecognitionItem {
  transaction: RecognizedTransaction;
  selected: boolean;
  isDuplicate: boolean;
  duplicateReason?: string;
  matchingTransactions?: Transaction[];
}

interface Transaction {
  id: string;
  date: Date;
  amount: number;
  description: string;
  category: {
    main: string;
    sub: string;
  };
}

export function BatchImageRecognitionDialog({
  open,
  onOpenChange,
  onBatchSubmit,
}: BatchImageRecognitionDialogProps) {
  const { user } = useAuth();
  const { transactions } = useTransactions();
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [recognitionItems, setRecognitionItems] = useState<RecognitionItem[]>(
    []
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [selectedPaymentService, setSelectedPaymentService] =
    useState<PaymentService>("unknown");

  // 画像アップロードと認識
  const handleImageUpload = async (files: File[]) => {
    if (!user || files.length === 0) return;

    const file = files[0]; // 最初の1枚のみ処理
    setIsRecognizing(true);
    setError(null);

    try {
      // 1. Firebase Storageにアップロード
      const uploadedUrl = await uploadTransactionImage(file, user.id);
      setImageUrl(uploadedUrl);

      // 2. 画像から複数の取引を認識
      const recognizedTransactions = await recognizeBatchTransactionsFromImage(
        file,
        {
          serviceHint:
            selectedPaymentService !== "unknown"
              ? selectedPaymentService
              : undefined,
        }
      );

      if (recognizedTransactions.length === 0) {
        setError(
          "取引を認識できませんでした。画像が不鮮明か、取引リストが含まれていない可能性があります。"
        );
        return;
      }

      // 3. 重複検出
      const { unique, duplicates } = batchDetectDuplicates(
        recognizedTransactions,
        transactions,
        { threshold: 0.8 }
      );

      // 4. 認識結果をステートに保存
      const items: RecognitionItem[] = [
        ...unique.map((t) => ({
          transaction: t,
          selected: true,
          isDuplicate: false,
        })),
        ...duplicates.map((d) => {
          // 重複している既存取引を取得
          const matchingTransactions = transactions
            .filter((t) => d.result.matchingTransactionIds.includes(t.id))
            .slice(0, 2) // 最大2件まで表示
            .map((t) => ({
              id: t.id,
              date:
                t.date instanceof Date
                  ? t.date
                  : (t.date as { toDate: () => Date }).toDate(),
              amount: t.amount,
              description: t.description,
              category: t.category,
            }));

          return {
            transaction: d.transaction,
            selected: false,
            isDuplicate: true,
            duplicateReason: d.result.reason,
            matchingTransactions,
          };
        }),
      ];

      setRecognitionItems(items);
    } catch (err) {
      console.error("認識エラー:", err);
      setError(err instanceof Error ? err.message : "画像認識に失敗しました");
    } finally {
      setIsRecognizing(false);
    }
  };

  // 選択状態の切り替え
  const toggleSelection = (index: number) => {
    setRecognitionItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, selected: !item.selected } : item
      )
    );
  };

  // 認識アイテムをクリックして編集
  const handleItemClick = (index: number) => {
    setEditingIndex(index);
    setEditFormOpen(true);
  };

  // 編集フォームの送信
  const handleEditSubmit = async (data: TransactionFormValues) => {
    if (editingIndex === null) return;

    // 認識アイテムを更新
    setRecognitionItems((prev) =>
      prev.map((item, i) => {
        if (i !== editingIndex) return item;

        return {
          ...item,
          transaction: {
            ...item.transaction,
            date: data.date,
            amount: data.amount,
            merchantName: data.description,
            suggestedCategory: {
              main: data.categoryMain,
              sub: data.categorySub,
            },
          } as RecognizedTransaction,
        };
      })
    );

    setEditFormOpen(false);
    setEditingIndex(null);
  };

  // 編集中のアイテムのデフォルト値を取得
  const getEditDefaultValues = ():
    | Partial<TransactionFormValues>
    | undefined => {
    if (editingIndex === null) return undefined;

    const item = recognitionItems[editingIndex];
    if (!item) return undefined;

    const { transaction } = item;
    const isIncome = transaction.suggestedCategory?.main === "収入" || false;

    return {
      date: transaction.date || new Date(),
      amount: transaction.amount || 0,
      categoryMain: transaction.suggestedCategory?.main || "",
      categorySub: transaction.suggestedCategory?.sub || "",
      description: transaction.merchantName || "",
      paymentMethod: getPaymentMethodFromService(transaction.paymentService),
      isIncome,
      hasAdvance: false,
      // 画像から読み取った元の店舗名をメモ欄に表示
      memo: transaction.originalMerchantName
        ? `元の店舗名: ${transaction.originalMerchantName}`
        : "",
      // 元の店舗名を保持（キーワード入力欄用）
      originalMerchantName: transaction.originalMerchantName || undefined,
    };
  };

  // 一括登録
  const handleBatchRegister = async () => {
    const selectedItems = recognitionItems.filter((item) => item.selected);

    if (selectedItems.length === 0) {
      setError("登録する取引を選択してください");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const transactionsData: TransactionInput[] = selectedItems.map((item) => {
        const { transaction } = item;

        // カテゴリーから収入/支出を判定
        const isIncome =
          transaction.suggestedCategory?.main === "収入" || false;

        return {
          date: transaction.date || new Date(),
          amount: transaction.amount || 0,
          category: transaction.suggestedCategory || {
            main: "その他",
            sub: "その他",
          },
          description: transaction.merchantName || "",
          paymentMethod: getPaymentMethodFromService(
            transaction.paymentService
          ),
          isIncome,
          imageUrl: imageUrl || undefined,
          // 画像から読み取った元の店舗名をAI情報として保存
          ai: transaction.originalMerchantName
            ? {
                suggested: true,
                confidence: transaction.confidence,
                originalSuggestion: {
                  category: transaction.suggestedCategory || {
                    main: "その他",
                    sub: "その他",
                  },
                  description: transaction.merchantName || "",
                },
                userModified: false,
                originalMerchantName: transaction.originalMerchantName,
              }
            : undefined,
        };
      });

      await onBatchSubmit(transactionsData);

      // 成功後、ダイアログを閉じる
      onOpenChange(false);
      setRecognitionItems([]);
      setImageUrl("");
    } catch (err) {
      console.error("一括登録エラー:", err);
      setError("一括登録に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  // リセット
  const handleReset = () => {
    setRecognitionItems([]);
    setImageUrl("");
    setError(null);
    setSelectedPaymentService("unknown");
  };

  // ダイアログを閉じる時にリセット
  const handleDialogChange = (isOpen: boolean) => {
    if (!isOpen) {
      handleReset();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogTitle>取引リストから一括入力</DialogTitle>
        <DialogDescription>
          決済アプリの取引リスト画像から複数の取引を一度に認識します
        </DialogDescription>

        <div className="space-y-6">
          {/* 決済サービス選択 */}
          {recognitionItems.length === 0 && !isRecognizing && (
            <div className="space-y-2">
              <Label htmlFor="payment-service">決済サービス</Label>
              <Select
                value={selectedPaymentService}
                onValueChange={(value) =>
                  setSelectedPaymentService(value as PaymentService)
                }
              >
                <SelectTrigger id="payment-service">
                  <SelectValue placeholder="決済サービスを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unknown">自動判定</SelectItem>
                  <SelectItem value="olive">三井住友OLIVE</SelectItem>
                  <SelectItem value="sony">ソニー銀行</SelectItem>
                  <SelectItem value="dpayment">d払い</SelectItem>
                  <SelectItem value="dcard">dカード</SelectItem>
                  <SelectItem value="paypay">PayPay</SelectItem>
                  <SelectItem value="cash">現金</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                決済サービスを選択すると、より正確に認識できます
              </p>
            </div>
          )}

          {/* 画像アップロードエリア */}
          {recognitionItems.length === 0 && (
            <ImageUploadZone
              onUpload={handleImageUpload}
              maxFiles={1}
              multiple={false}
              isRecognizing={isRecognizing}
            />
          )}

          {/* 認識中 */}
          {isRecognizing && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">
                  画像から取引を認識しています...
                </p>
              </div>
            </div>
          )}

          {/* エラー */}
          {error && (
            <div className="rounded-lg bg-destructive/10 p-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* 認識結果リスト */}
          {recognitionItems.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  認識された取引（
                  {recognitionItems.filter((i) => i.selected).length}/
                  {recognitionItems.length}件を登録）
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={isSubmitting}
                >
                  最初から
                </Button>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {recognitionItems.map((item, index) => (
                  <div
                    key={index}
                    className={`p-4 border rounded-lg transition-all hover:shadow-md ${
                      item.isDuplicate
                        ? "border-yellow-300 bg-yellow-50/50"
                        : item.selected
                        ? "border-primary bg-primary/5"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* チェックボックス */}
                      <div className="pt-1">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={() => toggleSelection(index)}
                          className="w-5 h-5 rounded border-gray-300"
                        />
                      </div>

                      {/* 取引情報 */}
                      <div className="flex-1 flex items-center justify-between">
                        <div className="flex-1">
                          {/* 店舗名とバッジ */}
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <h3 className="font-bold text-base text-gray-900">
                              {item.transaction.merchantName || "不明"}
                            </h3>
                            {item.isDuplicate && (
                              <Badge
                                variant="outline"
                                className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-yellow-700 border-yellow-400 bg-yellow-50"
                              >
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                重複
                              </Badge>
                            )}
                            {item.transaction.confidence && (
                              <Badge
                                variant={
                                  item.transaction.confidence >= 0.8
                                    ? "default"
                                    : "secondary"
                                }
                                className="rounded-full px-2.5 py-0.5 text-xs backdrop-blur-sm font-semibold"
                              >
                                {Math.round(item.transaction.confidence * 100)}%
                              </Badge>
                            )}
                          </div>

                          {/* 日付・カテゴリー - 小さなバッジ */}
                          <div className="flex items-center gap-2 text-xs text-gray-700 flex-wrap font-medium">
                            <span className="px-2.5 py-0.5 rounded-full bg-white/70 backdrop-blur-md border border-white/50">
                              {item.transaction.date
                                ? formatDate(item.transaction.date)
                                : "不明"}
                            </span>
                            {item.transaction.suggestedCategory && (
                              <span className="px-2.5 py-0.5 rounded-full bg-white/70 backdrop-blur-md border border-white/50">
                                {item.transaction.suggestedCategory.main} /{" "}
                                {item.transaction.suggestedCategory.sub}
                              </span>
                            )}
                          </div>

                          {/* 重複理由と類似取引 */}
                          {item.isDuplicate && (
                            <div className="mt-3 space-y-2">
                              {item.duplicateReason && (
                                <p className="text-xs text-yellow-700 font-medium">
                                  {item.duplicateReason}
                                </p>
                              )}

                              {/* 類似している既存取引 */}
                              {item.matchingTransactions &&
                                item.matchingTransactions.length > 0 && (
                                  <div className="space-y-2">
                                    {item.matchingTransactions.map((match) => (
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
                                                {match.category.main} /{" "}
                                                {match.category.sub}
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

                        {/* 金額と編集ボタン - 右側 */}
                        <div className="flex items-center gap-3 ml-4">
                          <div className="text-right">
                            <div className="text-xl font-bold text-gray-900">
                              {item.transaction.amount !== null
                                ? `¥${item.transaction.amount.toLocaleString()}`
                                : "不明"}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleItemClick(index)}
                            className="rounded-xl h-9 w-9 hover:bg-blue-50 hover:text-blue-600 transition-colors flex-shrink-0"
                            title="編集"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 一括登録ボタン */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  キャンセル
                </Button>
                <Button
                  onClick={handleBatchRegister}
                  disabled={
                    isSubmitting ||
                    recognitionItems.filter((i) => i.selected).length === 0
                  }
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      登録中...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      {recognitionItems.filter((i) => i.selected).length}
                      件を登録
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* 編集フォーム */}
        <TransactionFormNew
          key={editingIndex !== null ? `edit-${editingIndex}` : "new"}
          open={editFormOpen}
          onOpenChange={setEditFormOpen}
          onSubmit={handleEditSubmit}
          mode="edit"
          defaultValues={getEditDefaultValues()}
        />
      </DialogContent>
    </Dialog>
  );
}

/**
 * 決済サービスから決済方法を取得
 */
function getPaymentMethodFromService(service: string): string {
  const methodMap: Record<string, string> = {
    olive: "三井住友 OLIVE",
    sony: "ソニー銀行",
    dpayment: "d払い",
    dcard: "dカード",
    paypay: "PayPay",
    cash: "現金",
  };
  return methodMap[service] || "その他";
}
