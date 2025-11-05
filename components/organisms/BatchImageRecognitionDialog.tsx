/**
 * 一括画像認識ダイアログ
 * 取引リストの画像から複数の取引を認識して一括登録
 */

"use client";

import { useState } from "react";
import { Loader2, Check } from "lucide-react";
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
import { RecognizedTransactionItem } from "@/components/molecules";
import { useAuth, useTransactions } from "@/hooks";
import { recognizeBatchTransactionsFromImage } from "@/lib/gemini/batch-vision";
import { uploadTransactionImage } from "@/lib/firebase/storage";
import { batchDetectDuplicates } from "@/lib/helpers/duplicate-detection";
import {
  getPaymentMethodFromService,
  getPaymentServiceFromMethod,
} from "@/lib/helpers";
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
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [recognitionItems, setRecognitionItems] = useState<RecognitionItem[]>(
    []
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [selectedPaymentService, setSelectedPaymentService] =
    useState<PaymentService>("unknown");
  const [recognitionProgress, setRecognitionProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  // 画像アップロードと認識（複数枚対応）
  const handleImageUpload = async (files: File[]) => {
    if (!user || files.length === 0) return;

    setIsRecognizing(true);
    setError(null);
    setRecognitionProgress({ current: 0, total: files.length });

    const allRecognizedTransactions: RecognizedTransaction[] = [];
    const uploadedUrls: string[] = [];

    try {
      // 各画像を順番に処理
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setRecognitionProgress({ current: i + 1, total: files.length });

        try {
          // 1. Firebase Storageにアップロード
          const uploadedUrl = await uploadTransactionImage(file, user.id);
          uploadedUrls.push(uploadedUrl);

          // 2. 画像から複数の取引を認識
          const recognizedTransactions =
            await recognizeBatchTransactionsFromImage(file, {
              serviceHint:
                selectedPaymentService !== "unknown"
                  ? selectedPaymentService
                  : undefined,
            });

          // 認識された取引を追加
          allRecognizedTransactions.push(...recognizedTransactions);
        } catch (err) {
          console.error(`画像${i + 1}の認識エラー:`, err);
          // エラーが発生した画像はスキップして続行
          continue;
        }
      }

      // すべての画像URLを保存
      setImageUrls(uploadedUrls);

      if (allRecognizedTransactions.length === 0) {
        setError(
          "取引を認識できませんでした。画像が不鮮明か、取引リストが含まれていない可能性があります。"
        );
        return;
      }

      // 3. 重複検出（すべての取引をまとめて）
      const { unique, duplicates } = batchDetectDuplicates(
        allRecognizedTransactions,
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

      // レートリミットエラーの検出
      const isRateLimit =
        err instanceof Error &&
        (err.message === "RATE_LIMIT_EXCEEDED" ||
          err.message.includes("quota") ||
          err.message.includes("Quota exceeded") ||
          err.message.includes("rate limit"));

      setError(
        isRateLimit
          ? "API利用制限に達しました。しばらく時間をおいてから再度お試しください。"
          : err instanceof Error
          ? err.message
          : "画像認識に失敗しました"
      );
    } finally {
      setIsRecognizing(false);
      setRecognitionProgress(null);
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

    // 決済サービスをpaymentMethodから逆変換
    const paymentService = getPaymentServiceFromMethod(data.paymentMethod);

    // 認識アイテムを更新
    setRecognitionItems((prev) =>
      prev.map((item, i) => {
        if (i !== editingIndex) return item;

        // 元の店舗名を保持（memoから抽出するか、originalMerchantNameを保持）
        const originalMerchantName =
          item.transaction.originalMerchantName ||
          (data.memo?.includes("元の店舗名: ")
            ? data.memo.split("元の店舗名: ")[1]?.trim()
            : undefined);

        return {
          ...item,
          transaction: {
            ...item.transaction,
            paymentService,
            date: data.date,
            amount: data.amount,
            merchantName: data.description,
            suggestedCategory: {
              main: data.categoryMain,
              sub: data.categorySub,
            },
            originalMerchantName:
              originalMerchantName || item.transaction.originalMerchantName,
          } as RecognizedTransaction,
        };
      })
    );

    setEditFormOpen(false);
    setEditingIndex(null);
  };

  // 決済手段変更時の処理
  const handlePaymentServiceChange = (newService: PaymentService) => {
    setSelectedPaymentService(newService);

    // 既に認識結果がある場合は、全ての取引の決済手段を更新
    if (recognitionItems.length > 0) {
      setRecognitionItems((prev) =>
        prev.map((item) => ({
          ...item,
          transaction: {
            ...item.transaction,
            paymentService: newService,
          },
        }))
      );
    }
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
          imageUrl: imageUrls.length > 0 ? imageUrls[0] : undefined,
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
      setImageUrls([]);
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
    setImageUrls([]);
    setError(null);
    setSelectedPaymentService("unknown");
    setRecognitionProgress(null);
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
      <DialogContent className="md:max-w-4xl">
        <DialogTitle>取引リストから一括入力</DialogTitle>
        <DialogDescription>
          決済アプリの取引リスト画像から複数の取引を一度に認識します
        </DialogDescription>

        <div className="space-y-6">
          {/* 決済サービス選択 */}
          {!isRecognizing && (
            <div className="space-y-2">
              <Label htmlFor="payment-service">決済サービス</Label>
              <Select
                value={selectedPaymentService}
                onValueChange={(value) =>
                  handlePaymentServiceChange(value as PaymentService)
                }
              >
                <SelectTrigger id="payment-service">
                  <SelectValue placeholder="決済サービスを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="olive">三井住友OLIVE</SelectItem>
                  <SelectItem value="sony">ソニー銀行</SelectItem>
                  <SelectItem value="dpayment">d払い</SelectItem>
                  <SelectItem value="dcard">dカード</SelectItem>
                  <SelectItem value="paypay">PayPay</SelectItem>
                  <SelectItem value="cash">現金</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {recognitionItems.length === 0
                  ? "決済サービスを選択すると、より正確に認識できます"
                  : "決済サービスを変更すると、全ての取引に反映されます"}
              </p>
            </div>
          )}

          {/* 画像アップロードエリア */}
          {recognitionItems.length === 0 && (
            <ImageUploadZone
              onUpload={handleImageUpload}
              maxFiles={10}
              multiple={true}
              isRecognizing={isRecognizing}
            />
          )}

          {/* 認識中 */}
          {isRecognizing && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">
                  {recognitionProgress
                    ? `画像を認識しています... (${recognitionProgress.current}/${recognitionProgress.total}枚目)`
                    : "画像から取引を認識しています..."}
                </p>
              </div>
            </div>
          )}

          {/* エラー */}
          {error && (
            <div
              className={`rounded-lg p-4 ${
                error.includes("API利用制限") || error.includes("利用制限")
                  ? "bg-amber-50 border-2 border-amber-200"
                  : "bg-destructive/10"
              }`}
            >
              <p
                className={`text-sm font-medium ${
                  error.includes("API利用制限") || error.includes("利用制限")
                    ? "text-amber-800"
                    : "text-destructive"
                }`}
              >
                {error.includes("API利用制限") || error.includes("利用制限") ? (
                  <>
                    <span className="font-bold">
                      ⚠️ API利用制限に達しました
                    </span>
                    <br />
                    <span className="mt-1 block">
                      {error.split("。")[1] ||
                        "しばらく時間をおいてから再度お試しください。"}
                    </span>
                  </>
                ) : (
                  error
                )}
              </p>
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
                  <RecognizedTransactionItem
                    key={index}
                    transaction={item.transaction}
                    selected={item.selected}
                    isDuplicate={item.isDuplicate}
                    duplicateReason={item.duplicateReason}
                    matchingTransactions={item.matchingTransactions}
                    onToggleSelect={() => toggleSelection(index)}
                    onEdit={() => handleItemClick(index)}
                  />
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
          key={
            editingIndex !== null
              ? `edit-${editingIndex}-${JSON.stringify(
                  recognitionItems[editingIndex]?.transaction
                )}`
              : "new"
          }
          open={editFormOpen}
          onOpenChange={(open) => {
            setEditFormOpen(open);
            if (!open) {
              setEditingIndex(null);
            }
          }}
          onSubmit={handleEditSubmit}
          mode="edit"
          defaultValues={getEditDefaultValues()}
        />
      </DialogContent>
    </Dialog>
  );
}
