/**
 * 新しいトランザクション入力フォーム（AI自動サジェスチョン対応）
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import {
  transactionFormSchema,
  TransactionFormValues,
} from "@/lib/validations/transaction";
import type { PaymentMethodValue } from "@/types/transaction";
import { useAISuggestion, useImageRecognition } from "@/hooks";
import {
  SuggestionCarousel,
  TransactionAmountInput,
} from "@/components/molecules";
import { saveUserCorrection } from "@/lib/firebase/ai-learning";
import { useAuth } from "@/hooks";
import { ImageUploadZone, RecognitionResultCard } from "@/components/organisms";
import type { ImageRecognitionResult } from "@/types/image-recognition";
import {
  getTimeOfDay,
  getDayOfWeek,
  getPaymentMethodFromService,
} from "@/lib/helpers";
import { PAYMENT_METHODS } from "@/constants/paymentMethods";

interface TransactionFormNewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TransactionFormValues) => Promise<void>;
  defaultValues?: Partial<TransactionFormValues>;
  mode?: "create" | "edit";
  enableImageInput?: boolean;
  onImageInputToggle?: (enabled: boolean) => void;
}

export function TransactionFormNew({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  mode = "create",
  enableImageInput = false,
  onImageInputToggle,
}: TransactionFormNewProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [isAISuggestionApplied, setIsAISuggestionApplied] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [initialKeyword, setInitialKeyword] = useState<string | null>(null);

  // enableImageInputが変更されたら画像アップロードを表示
  useEffect(() => {
    if (enableImageInput) {
      setShowImageUpload(true);
    }
  }, [enableImageInput]);

  const {
    suggestions,
    isLoading: aiLoading,
    error: aiError,
    quotaExceeded,
    getMultipleSuggestions,
    clearSuggestion,
    isAvailable: aiAvailable,
  } = useAISuggestion();

  // サジェストの状態変化をログに記録
  useEffect(() => {
    console.log("📊 サジェスト状態:", {
      suggestionsCount: suggestions.length,
      isLoading: aiLoading,
      error: aiError,
      quotaExceeded,
      aiAvailable,
    });
    if (suggestions.length > 0) {
      console.log("✅ サジェスト取得成功:", suggestions);
    }
  }, [suggestions, aiLoading, aiError, quotaExceeded, aiAvailable]);

  const {
    results: recognitionResults,
    isRecognizing,
    error: recognitionError,
    recognizeImages,
    clearResults,
    removeResult,
  } = useImageRecognition({
    checkDuplicates: true,
    duplicateThreshold: 0.8,
  });

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema) as never,
    defaultValues: {
      date: new Date(),
      amount: 0,
      categoryMain: "",
      categorySub: "",
      description: "",
      paymentMethod: "",
      isIncome: false,
      isTransfer: false,
      hasAdvance: false,
      memo: "",
      advance: undefined,
      ...defaultValues,
    },
  });

  // 前回のopen状態とdefaultValuesを追跡
  const prevOpenRef = useRef<boolean>(false);
  const prevDefaultValuesKeyRef = useRef<string>("");

  // フォームが開かれたときにisTransferを確実に設定
  useEffect(() => {
    if (open) {
      const currentValue = form.getValues("isTransfer");
      if (currentValue === undefined || currentValue === null) {
        console.log("⚠️ isTransferが未設定のため、falseを設定します");
        form.setValue("isTransfer", false, { shouldValidate: false });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // defaultValuesが変更されたら、フォームをリセット
  // ただし、ダイアログが開かれた時（false → true）のみ実行
  useEffect(() => {
    const defaultValuesKey = defaultValues ? JSON.stringify(defaultValues) : "";
    const isOpening = open && !prevOpenRef.current;
    const isDefaultValuesChanged =
      open &&
      defaultValues &&
      prevOpenRef.current &&
      defaultValuesKey !== prevDefaultValuesKeyRef.current;

    // ダイアログが開かれた時（false → true）のみリセット
    if (isOpening) {
      if (defaultValues) {
        // 編集モード：defaultValuesでリセット
        const resetValues = {
          date: new Date(),
          amount: 0,
          categoryMain: "",
          categorySub: "",
          description: "",
          paymentMethod: "",
          isIncome: false,
          isTransfer: false,
          hasAdvance: false,
          memo: "",
          advance: undefined,
          ...defaultValues,
        };
        console.log("TransactionFormNew reset with values:", resetValues);
        form.reset(resetValues);

        // キーワード欄の初期値を設定（優先順位: ユーザーキーワード > 元の店舗名）
        const initKeyword =
          defaultValues.userKeyword || defaultValues.originalMerchantName || "";
        setKeyword(initKeyword);
        setInitialKeyword(initKeyword);
      } else {
        // 新規作成モード：空の値でリセット
        form.reset({
          date: new Date(),
          amount: 0,
          categoryMain: "",
          categorySub: "",
          description: "",
          paymentMethod: "",
          isIncome: false,
          isTransfer: false,
          hasAdvance: false,
          memo: "",
          advance: undefined,
        });
        setKeyword("");
        setInitialKeyword(null);
      }
    }

    // defaultValuesが変更された場合（編集モードで別のアイテムを編集する場合など）
    if (isDefaultValuesChanged) {
      const resetValues = {
        date: new Date(),
        amount: 0,
        categoryMain: "",
        categorySub: "",
        description: "",
        paymentMethod: "",
        isIncome: false,
        isTransfer: false,
        hasAdvance: false,
        memo: "",
        advance: undefined,
        ...defaultValues,
      };
      form.reset(resetValues);
      const initKeyword =
        defaultValues.userKeyword || defaultValues.originalMerchantName || "";
      setKeyword(initKeyword);
      setInitialKeyword(initKeyword);
    }

    // 状態を更新
    prevOpenRef.current = open;
    if (open && defaultValues) {
      prevDefaultValuesKeyRef.current = defaultValuesKey;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, JSON.stringify(defaultValues)]);

  const amount = form.watch("amount");
  const paymentMethod = form.watch("paymentMethod");
  const isTransfer = form.watch("isTransfer");

  // 編集モードかどうかを判定
  const isEditMode = mode === "edit" && defaultValues;

  // 現在の情報を表示するためのサジェスチョン（編集モード時）
  const currentInfoSuggestion =
    isEditMode && defaultValues
      ? {
          category: {
            main: defaultValues.categoryMain || "",
            sub: defaultValues.categorySub || "",
          },
          description: defaultValues.description || "",
          isIncome: defaultValues.isIncome || false,
          confidence: 1.0,
          hasAdvance: defaultValues.hasAdvance || false,
          advanceType: defaultValues.advance?.type || null,
          // advanceAmountは割合（0-1）である必要があるため、実際の金額を割合に変換
          advanceAmount:
            defaultValues.advance?.advanceAmount !== undefined &&
            defaultValues.advance?.totalAmount !== undefined &&
            defaultValues.advance.totalAmount > 0
              ? defaultValues.advance.advanceAmount /
                defaultValues.advance.totalAmount
              : undefined,
        }
      : null;

  // 金額とキーワードが変更されたら自動的にAIサジェスチョンを取得
  useEffect(() => {
    console.log("🔍 サジェスト取得チェック:", {
      aiAvailable,
      keyword: keyword.trim(),
      keywordLength: keyword.length,
      amount,
      paymentMethod,
      mode,
      initialKeyword,
    });

    if (!aiAvailable) {
      console.log("⚠️ AIが利用できません");
      clearSuggestion();
      return;
    }

    if (!keyword.trim() || keyword.length < 2) {
      console.log("⚠️ キーワードが短すぎます:", keyword);
      clearSuggestion();
      return;
    }

    // 編集モードで初期キーワードから変更されていない場合はサジェスチョンを取得しない
    const isInitialKeyword =
      mode === "edit" && initialKeyword !== null && keyword === initialKeyword;
    if (isInitialKeyword) {
      console.log("⚠️ 編集モードで初期キーワードから変更されていません");
      return;
    }

    console.log("✅ サジェスト取得を開始:", { keyword, amount, paymentMethod });

    const timer = setTimeout(() => {
      console.log("🚀 サジェスト取得実行:", { keyword, amount, paymentMethod });
      getMultipleSuggestions(keyword, {
        amount,
        paymentMethod: paymentMethod as PaymentMethodValue | undefined,
        // isIncomeはAIに判定させるので送らない
      }).catch((err) => {
        console.error("❌ サジェスト取得エラー:", err);
      });
    }, 500); // デバウンス

    return () => {
      console.log("🧹 タイマーをクリア");
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    keyword,
    amount,
    // paymentMethodは除外（変更時に再取得しない）
    aiAvailable,
    getMultipleSuggestions,
    clearSuggestion,
  ]);

  // 画像認識結果を適用
  const handleApplyRecognition = (result: ImageRecognitionResult) => {
    const { transaction } = result;

    // 金額
    if (transaction.amount !== null) {
      form.setValue("amount", transaction.amount, { shouldValidate: true });
    }

    // 日付
    if (transaction.date) {
      form.setValue("date", transaction.date, { shouldValidate: true });
    }

    // 店舗名・項目名
    if (transaction.merchantName) {
      setKeyword(transaction.merchantName);
      form.setValue("description", transaction.merchantName, {
        shouldValidate: true,
      });
    }

    // カテゴリー（推測があれば）
    if (transaction.suggestedCategory) {
      form.setValue("categoryMain", transaction.suggestedCategory.main, {
        shouldValidate: true,
      });
      form.setValue("categorySub", transaction.suggestedCategory.sub, {
        shouldValidate: true,
      });
    }

    // 決済方法（サービスから推測）
    const mappedPaymentMethod = getPaymentMethodFromService(
      transaction.paymentService
    );
    if (mappedPaymentMethod !== "other") {
      form.setValue("paymentMethod", mappedPaymentMethod, {
        shouldValidate: true,
      });
    }

    // 画像アップロードエリアを閉じる
    setShowImageUpload(false);
    if (onImageInputToggle) {
      onImageInputToggle(false);
    }
  };

  const handleSuggestionSelect = (suggestion: (typeof suggestions)[0]) => {
    console.log("🎯 サジェスト選択:", suggestion);

    // フォームに値を設定
    form.setValue("isIncome", suggestion.isIncome, { shouldValidate: true });
    form.setValue("categoryMain", suggestion.category.main, {
      shouldValidate: true,
    });
    form.setValue("categorySub", suggestion.category.sub, {
      shouldValidate: true,
    });
    form.setValue("description", suggestion.description, {
      shouldValidate: true,
    });

    console.log("✅ フォーム値設定完了:", {
      isIncome: form.getValues("isIncome"),
      categoryMain: form.getValues("categoryMain"),
      categorySub: form.getValues("categorySub"),
      description: form.getValues("description"),
    });

    // 立替情報の適用
    if (
      suggestion.hasAdvance &&
      suggestion.advanceType &&
      suggestion.advanceAmount
    ) {
      form.setValue("hasAdvance", true);
      const totalAmount = amount || 0;
      const advanceAmount = Math.round(totalAmount * suggestion.advanceAmount);
      const personalAmount = totalAmount - advanceAmount;

      form.setValue("advance", {
        type: suggestion.advanceType,
        totalAmount: totalAmount,
        advanceAmount: advanceAmount,
        personalAmount: personalAmount,
        memo: "",
      });
    } else {
      form.setValue("hasAdvance", false);
      form.setValue("advance", undefined);
    }

    setIsAISuggestionApplied(true);
  };

  const handleSubmit = async (data: TransactionFormValues) => {
    console.log("🔵 handleSubmit 開始:", data);
    console.log("🔵 isTransfer の値:", data.isTransfer, typeof data.isTransfer);
    setLoading(true);
    try {
      // ユーザーがAIサジェスチョンを修正した場合、学習データとして保存
      if (
        user &&
        isAISuggestionApplied &&
        suggestions.length > 0 &&
        suggestions[0]
      ) {
        const originalSuggestion = suggestions[0];
        if (
          originalSuggestion.category.main !== data.categoryMain ||
          originalSuggestion.category.sub !== data.categorySub ||
          originalSuggestion.description !== data.description
        ) {
          await saveUserCorrection(
            user.id,
            keyword,
            {
              category: originalSuggestion.category,
              description: originalSuggestion.description,
            },
            {
              category: {
                main: data.categoryMain,
                sub: data.categorySub,
              },
              description: data.description,
            },
            {
              amount: data.amount,
              paymentMethod: data.paymentMethod as PaymentMethodValue,
              timeOfDay: getTimeOfDay(),
              dayOfWeek: getDayOfWeek(),
            }
          );
        }
      }

      // ユーザーが入力したキーワードを保存
      const submitData: TransactionFormValues = {
        ...data,
        isTransfer: data.isTransfer ?? false,
        userKeyword: keyword.trim() || undefined,
      };

      await onSubmit(submitData);
      form.reset();
      setKeyword("");
      clearSuggestion();
      setIsAISuggestionApplied(false);
      clearResults();
      setShowImageUpload(false);
      if (onImageInputToggle) {
        onImageInputToggle(false);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("フォーム送信エラー:", error);
    } finally {
      setLoading(false);
    }
  };

  // 振替選択時の自動設定（カテゴリ固定、立替クリア、説明初期値）
  useEffect(() => {
    if (isTransfer) {
      form.setValue("categoryMain", "振替", { shouldValidate: false });
      form.setValue("categorySub", "口座間振替", { shouldValidate: false });
      form.setValue("hasAdvance", false, { shouldValidate: false });
      form.setValue("advance", undefined, { shouldValidate: false });
      // 振替元は上部の決済方法（paymentMethod）を自動反映
      const pm = form.getValues("paymentMethod") as PaymentMethodValue | "";
      if (pm) {
        form.setValue("transfer.from", pm as PaymentMethodValue, {
          shouldValidate: true,
        });
      }
      if (!form.getValues("description")) {
        form.setValue("description", "口座間振替", { shouldValidate: false });
      }
    }
  }, [isTransfer, form]);

  // 振替中はpaymentMethodの変更をtransfer.fromへ同期
  useEffect(() => {
    if (isTransfer) {
      const pm = paymentMethod as PaymentMethodValue | "";
      form.setValue("transfer.from", (pm || "") as PaymentMethodValue, {
        shouldValidate: true,
      });
    }
  }, [paymentMethod, isTransfer, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:max-w-2xl">
        <VisuallyHidden>
          <DialogTitle>新規取引を追加</DialogTitle>
          <DialogDescription>収支情報を入力してください</DialogDescription>
        </VisuallyHidden>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit, (errors) => {
              console.error("❌ フォームバリデーションエラー:", errors);
              const formValues = form.getValues();
              console.error("📋 現在のフォーム値:", formValues);
              console.error(
                "📋 isTransfer の値:",
                formValues.isTransfer,
                typeof formValues.isTransfer
              );
            })}
            className="space-y-3 md:space-y-6"
          >
            {/* 画像アップロードエリア */}
            {showImageUpload && (
              <div className="space-y-2 p-3 md:p-6 border rounded-lg bg-muted/30">
                <h3 className="text-sm font-medium">
                  決済アプリのスクリーンショットから自動入力
                </h3>
                <ImageUploadZone
                  onUpload={(files) => recognizeImages(files)}
                  maxFiles={3}
                  multiple={true}
                  isRecognizing={isRecognizing}
                />

                {recognitionError && (
                  <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                    {recognitionError}
                  </div>
                )}

                {/* 認識結果の表示 */}
                {recognitionResults.length > 0 && (
                  <div className="space-y-3">
                    {recognitionResults.map((result, index) => (
                      <RecognitionResultCard
                        key={index}
                        result={result}
                        onApply={handleApplyRecognition}
                        onIgnore={() => removeResult(index)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 上部: 金額とキーワード入力欄 + 立替タイプ選択 */}
            <TransactionAmountInput
              control={form.control}
              keyword={keyword}
              onKeywordChange={setKeyword}
              setValue={form.setValue}
              getValues={form.getValues}
              watch={form.watch}
              amount={amount}
            />

            {/* AIサジェスチョン表示 */}
            {aiLoading && (
              <div className="text-center py-2 text-sm text-gray-400">
                AIが提案を考えています...
              </div>
            )}

            {/* AIエラー通知（非ブロッキング） */}
            {!aiLoading && aiError && keyword.trim().length >= 2 && (
              <div className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5 text-center">
                {quotaExceeded ? aiError : "AI提案を取得できませんでした。手動で入力してください。"}
              </div>
            )}

            {/* 常に入力フォームを表示（AIロード中は除く） */}
            {!aiLoading && !isTransfer && (
              <SuggestionCarousel
                suggestions={suggestions}
                onSelect={handleSuggestionSelect}
                form={form}
                amount={amount}
              />
            )}

            {/* 振替フィールド（振替選択時のみ表示） */}
            {isTransfer && (
              <div className="space-y-3 md:space-y-4 p-3 md:p-4 border rounded-lg bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs md:text-sm text-gray-600">
                      振替元（自動）
                    </Label>
                    <select
                      className="w-full mt-1 bg-white/60 backdrop-blur-sm border-0 rounded-lg md:rounded-xl px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all cursor-not-allowed"
                      value={paymentMethod || ""}
                      disabled
                    >
                      <option value="">選択してください</option>
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs md:text-sm text-gray-600">
                      振替先
                    </Label>
                    <select
                      className="w-full mt-1 bg-white/60 backdrop-blur-sm border-0 rounded-lg md:rounded-xl px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
                      value={form.watch("transfer.to") || ""}
                      onChange={(e) =>
                        form.setValue(
                          "transfer.to",
                          e.target.value as PaymentMethodValue,
                          { shouldValidate: true }
                        )
                      }
                    >
                      <option value="">選択してください</option>
                      {PAYMENT_METHODS.map((m) => (
                        <option
                          key={m.value}
                          value={m.value}
                          disabled={m.value === (paymentMethod || "")}
                        >
                          {m.label}
                          {m.value === (paymentMethod || "")
                            ? "（振替元）"
                            : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs md:text-sm text-gray-600">
                    説明
                  </Label>
                  <Input
                    className="mt-1"
                    value={form.watch("description") || ""}
                    onChange={(e) =>
                      form.setValue("description", e.target.value, {
                        shouldValidate: true,
                      })
                    }
                    placeholder="口座間振替"
                  />
                </div>
              </div>
            )}

            {/* 送信ボタン */}
            <div className="flex gap-2 md:gap-4 pt-1">
              <Button
                type="button"
                variant="outline"
                className="flex-1 bg-white text-gray-900 hover:text-gray-900 h-10 md:h-10 text-sm"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                className="flex-1 h-10 md:h-10 text-sm"
                disabled={loading}
                onClick={() => {
                  console.log("🟢 送信ボタンクリック");
                  const formValues = form.getValues();
                  console.log("📋 フォーム値:", formValues);
                  const errors = form.formState.errors;
                  console.log("⚠️ フォームエラー:", errors);

                  // isTransferが未設定の場合はfalseを設定
                  const currentIsTransfer = form.getValues("isTransfer");
                  if (
                    currentIsTransfer === undefined ||
                    currentIsTransfer === null
                  ) {
                    console.log(
                      "⚠️ isTransferが未設定のため、送信前にfalseを設定します"
                    );
                    form.setValue("isTransfer", false, {
                      shouldValidate: true,
                    });
                  }
                }}
              >
                {loading ? "保存中..." : mode === "create" ? "追加" : "更新"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
