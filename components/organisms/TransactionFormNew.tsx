/**
 * 新しいトランザクション入力フォーム（AI自動サジェスチョン対応）
 */

"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar as CalendarIcon, CreditCard } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
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
import { PAYMENT_METHODS } from "@/constants/paymentMethods";
import type { PaymentMethodValue } from "@/types/transaction";
import { useAISuggestion, useImageRecognition } from "@/hooks";
import { SuggestionCarousel } from "@/components/molecules";
import { saveUserCorrection } from "@/lib/firebase/ai-learning";
import { useAuth } from "@/hooks";
import { ImageUploadZone, RecognitionResultCard } from "@/components/organisms";
import type { ImageRecognitionResult } from "@/types/image-recognition";

interface TransactionFormNewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TransactionFormValues) => Promise<void>;
  defaultValues?: Partial<TransactionFormValues>;
  mode?: "create" | "edit";
  enableImageInput?: boolean;
  onImageInputToggle?: (enabled: boolean) => void;
}

const getTimeOfDay = (): string => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
};

const getDayOfWeek = (): string => {
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return days[new Date().getDay()];
};

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
        paymentMethod,
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
    const paymentMethodMap: Record<string, string> = {
      olive: "三井住友 OLIVE",
      sony: "ソニー銀行",
      dpayment: "d払い",
      dcard: "dカード",
      paypay: "PayPay",
      cash: "現金",
    };

    const mappedPaymentMethod = paymentMethodMap[transaction.paymentService];
    if (mappedPaymentMethod) {
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <VisuallyHidden>
          <DialogTitle>新規取引を追加</DialogTitle>
          <DialogDescription>収支情報を入力してください</DialogDescription>
        </VisuallyHidden>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* 画像アップロードエリア */}
            {showImageUpload && (
              <div className="space-y-4 p-6 border rounded-lg bg-muted/30">
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

            {/* 上部: 金額とキーワード入力欄 - 象徴的デザイン */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8">
              {/* 装飾的な背景要素 */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200 rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
              <div
                className="absolute bottom-0 left-0 w-48 h-48 bg-blue-200 rounded-full filter blur-3xl opacity-20 animate-pulse"
                style={{ animationDelay: "1s" }}
              ></div>

              <div className="relative space-y-8">
                {/* 日付と決済手段 - 上部にコンパクトに */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="h-5 w-5 text-gray-500" />
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <input
                              type="date"
                              className="bg-white/60 backdrop-blur-sm border-0 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
                              value={
                                field.value
                                  ? format(field.value, "yyyy-MM-dd")
                                  : ""
                              }
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? new Date(e.target.value)
                                    : new Date()
                                )
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-gray-500" />
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <select
                              className="bg-white/60 backdrop-blur-sm border-0 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all cursor-pointer"
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                            >
                              <option value="">選択してください</option>
                              {PAYMENT_METHODS.map((method) => (
                                <option key={method.value} value={method.value}>
                                  {method.label}
                                </option>
                              ))}
                            </select>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* 金額入力 - 中央・大きく */}
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-3">
                            <span className="text-4xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 self-center">
                              ¥
                            </span>
                            <input
                              type="text"
                              placeholder="0"
                              className="font-bold text-center border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none rounded-none px-2 placeholder:text-gray-300 text-gray-800 hover:text-indigo-600 focus:text-purple-600 transition-colors"
                              style={{
                                fontSize: "4.5rem",
                                lineHeight: "1.1",
                                width: "auto",
                                minWidth: "120px",
                                maxWidth: "400px",
                              }}
                              value={
                                field.value
                                  ? field.value.toLocaleString("ja-JP")
                                  : ""
                              }
                              onChange={(e) => {
                                const value = e.target.value.replace(/,/g, "");
                                const numValue =
                                  value === "" ? 0 : Number(value);
                                if (!isNaN(numValue)) {
                                  field.onChange(numValue);
                                }
                              }}
                            />
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* キーワード入力 - 下部 */}
                <div className="text-center">
                  <input
                    type="text"
                    placeholder="何に使いましたか？"
                    className="text-center border-0 bg-transparent focus:outline-none rounded-none px-6 font-medium placeholder:text-gray-400 text-gray-800 hover:text-indigo-600 focus:text-purple-600 transition-colors w-full"
                    style={{ fontSize: "1.5rem", lineHeight: "1.3" }}
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                </div>

                {/* 支払いタイプ選択 */}
                <div className="flex justify-center">
                  <div className="inline-flex gap-2 bg-white/60 backdrop-blur-sm rounded-xl p-2">
                    <button
                      type="button"
                      onClick={() => {
                        form.setValue("hasAdvance", false);
                        form.setValue("advance", undefined);
                      }}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        !form.watch("advance")?.type
                          ? "bg-gray-800 text-white shadow-md"
                          : "bg-transparent text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">💰</span>
                        <span>自分</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        form.setValue("hasAdvance", true);
                        const currentAdvance = form.getValues("advance");
                        const totalAmount = amount || 0;
                        if (!currentAdvance) {
                          form.setValue("advance", {
                            type: "parent",
                            totalAmount: totalAmount,
                            advanceAmount: totalAmount, // デフォルトで全額
                            personalAmount: 0,
                            memo: "",
                          });
                        } else {
                          form.setValue("advance.type", "parent");
                          // 立替金額が未設定の場合は全額に設定
                          if (!currentAdvance.advanceAmount) {
                            form.setValue("advance.advanceAmount", totalAmount);
                            form.setValue("advance.personalAmount", 0);
                          }
                        }
                      }}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        form.watch("advance")?.type === "parent"
                          ? "bg-green-500 text-white shadow-md"
                          : "bg-transparent text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">👨‍👩‍👧</span>
                        <span>親</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        form.setValue("hasAdvance", true);
                        const currentAdvance = form.getValues("advance");
                        const totalAmount = amount || 0;
                        if (!currentAdvance) {
                          form.setValue("advance", {
                            type: "friend",
                            totalAmount: totalAmount,
                            advanceAmount: totalAmount, // デフォルトで全額
                            personalAmount: 0,
                            memo: "",
                          });
                        } else {
                          form.setValue("advance.type", "friend");
                          // 立替金額が未設定の場合は全額に設定
                          if (!currentAdvance.advanceAmount) {
                            form.setValue("advance.advanceAmount", totalAmount);
                            form.setValue("advance.personalAmount", 0);
                          }
                        }
                      }}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        form.watch("advance")?.type === "friend"
                          ? "bg-blue-500 text-white shadow-md"
                          : "bg-transparent text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">👥</span>
                        <span>友達</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* AIサジェスチョン表示 */}
            {aiLoading && (
              <div className="text-center py-4 text-gray-500">
                AIが提案を考えています...
              </div>
            )}

            {quotaExceeded && (
              <div className="text-center py-4">
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
              <div className="text-center py-4">
                <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
                  {aiError}
                </div>
              </div>
            )}

            {/* 送信ボタン */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 bg-white text-gray-900 hover:text-gray-900"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                キャンセル
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "保存中..." : mode === "create" ? "追加" : "更新"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
