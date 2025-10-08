/**
 * 新しいトランザクション入力フォーム（AI自動サジェスチョン対応）
 */

"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
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
      hasAdvance: false,
      memo: "",
      advance: undefined,
      ...defaultValues,
    },
  });

  // defaultValuesが変更されたら、フォームをリセット
  useEffect(() => {
    if (open) {
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
          hasAdvance: false,
          memo: "",
          advance: undefined,
        });
        setKeyword("");
        setInitialKeyword(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, JSON.stringify(defaultValues)]);

  const amount = form.watch("amount");
  const paymentMethod = form.watch("paymentMethod");

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
          advanceAmount: defaultValues.advance?.advanceAmount || undefined,
        }
      : null;

  // 金額とキーワードが変更されたら自動的にAIサジェスチョンを取得
  useEffect(() => {
    if (!aiAvailable || !keyword.trim() || keyword.length < 2) {
      clearSuggestion();
      return;
    }

    // 編集モードで初期キーワードから変更されていない場合はサジェスチョンを取得しない
    const isInitialKeyword =
      mode === "edit" && initialKeyword !== null && keyword === initialKeyword;
    if (isInitialKeyword) {
      return;
    }

    const timer = setTimeout(() => {
      getMultipleSuggestions(keyword, {
        amount,
        paymentMethod: paymentMethod as PaymentMethodValue | undefined,
        // isIncomeはAIに判定させるので送らない
      });
    }, 500); // デバウンス

    return () => clearTimeout(timer);
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
      const submitData = {
        ...data,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:max-w-2xl">
        <VisuallyHidden>
          <DialogTitle>新規取引を追加</DialogTitle>
          <DialogDescription>収支情報を入力してください</DialogDescription>
        </VisuallyHidden>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
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
              <div className="text-center py-2 md:py-4 text-gray-500">
                AIが提案を考えています...
              </div>
            )}

            {quotaExceeded && (
              <div className="text-center py-2 md:py-4">
                <div className="text-sm text-amber-600 bg-amber-50 rounded-lg p-3">
                  {aiError}
                </div>
              </div>
            )}

            {/* 編集モード時は現在の情報を表示、新規作成時またはユーザーがキーワードを入力した時はAIサジェスチョンを表示 */}
            {!aiLoading && !quotaExceeded && (
              <>
                {/* 編集モードでAIサジェスチョンがない場合：現在の情報を表示 */}
                {isEditMode &&
                  suggestions.length === 0 &&
                  currentInfoSuggestion && (
                    <SuggestionCarousel
                      suggestions={[currentInfoSuggestion]}
                      onSelect={handleSuggestionSelect}
                      form={form}
                      amount={amount}
                    />
                  )}

                {/* AIサジェスチョンがある場合：AIサジェスチョンを表示 */}
                {suggestions.length > 0 && (
                  <SuggestionCarousel
                    suggestions={suggestions}
                    onSelect={handleSuggestionSelect}
                    form={form}
                    amount={amount}
                  />
                )}
              </>
            )}

            {aiError && !quotaExceeded && (
              <div className="text-center py-2 md:py-4">
                <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
                  {aiError}
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
