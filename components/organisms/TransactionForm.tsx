/**
 * トランザクション入力フォーム
 */

"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar as CalendarIcon, Info, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

import {
  transactionFormSchema,
  TransactionFormValues,
} from "@/lib/validations/transaction";
import { CATEGORIES, getSubCategories } from "@/constants/categories";
import { PAYMENT_METHODS } from "@/constants/paymentMethods";
import { cn } from "@/lib/utils";
import { useAISuggestion } from "@/hooks";
import { AISuggestionBadge } from "@/components/molecules";
import { saveUserCorrection } from "@/lib/firebase/ai-learning";
import { useAuth } from "@/hooks";

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TransactionFormValues) => Promise<void>;
  defaultValues?: Partial<TransactionFormValues>;
  mode?: "create" | "edit";
}

/**
 * 現在の時間帯を取得
 */
const getTimeOfDay = (): string => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
};

/**
 * 現在の曜日を取得
 */
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

export function TransactionForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  mode = "create",
}: TransactionFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>("");
  const [aiInputText, setAiInputText] = useState("");
  const [aiSuggestionApplied, setAiSuggestionApplied] = useState(false);
  const [originalAiSuggestion, setOriginalAiSuggestion] = useState<{
    category: { main: string; sub: string };
    description: string;
  } | null>(null);

  const {
    suggestion: aiSuggestion,
    isLoading: aiLoading,
    getSuggestion,
    clearSuggestion,
    isAvailable: aiAvailable,
  } = useAISuggestion();

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

  const isIncome = form.watch("isIncome");
  const categoryMain = form.watch("categoryMain");
  const hasAdvance = form.watch("hasAdvance");
  const amount = form.watch("amount");
  const advanceAmount = form.watch("advance.advanceAmount");
  const personalAmount = form.watch("advance.personalAmount");
  const description = form.watch("description");
  const paymentMethod = form.watch("paymentMethod");

  // メインカテゴリーが変更されたらサブカテゴリーをリセット
  useEffect(() => {
    if (categoryMain !== selectedMainCategory) {
      form.setValue("categorySub", "");
      setSelectedMainCategory(categoryMain);
    }
  }, [categoryMain, selectedMainCategory, form]);

  // 立替の自動計算：totalAmount = amount, advanceAmount + personalAmount の調整
  useEffect(() => {
    if (hasAdvance && amount > 0) {
      const currentAdvanceAmount = advanceAmount || 0;
      const currentPersonalAmount = personalAmount || 0;

      // 両方とも0の場合、totalAmountをamountに設定
      if (currentAdvanceAmount === 0 && currentPersonalAmount === 0) {
        form.setValue("advance.totalAmount", amount);
      } else {
        // 片方が変更された場合、もう片方を自動計算
        const total = currentAdvanceAmount + currentPersonalAmount;
        if (total !== amount) {
          form.setValue("advance.totalAmount", amount);
        }
      }
    }
  }, [amount, advanceAmount, personalAmount, hasAdvance, form]);

  // 立替フラグがOFFになったら立替情報をクリア
  useEffect(() => {
    if (!hasAdvance) {
      form.setValue("advance", undefined);
    } else if (hasAdvance && !form.getValues("advance")) {
      // 立替フラグがONになったら初期値を設定
      form.setValue("advance", {
        type: null,
        totalAmount: amount || 0,
        advanceAmount: 0,
        personalAmount: amount || 0,
        memo: "",
      });
    }
  }, [hasAdvance, form, amount]);

  const handleSubmit = async (data: TransactionFormValues) => {
    setLoading(true);
    try {
      // ユーザーがAIサジェスチョンを修正した場合、学習データとして保存
      if (
        user &&
        originalAiSuggestion &&
        aiSuggestionApplied &&
        (originalAiSuggestion.category.main !== data.categoryMain ||
          originalAiSuggestion.category.sub !== data.categorySub ||
          originalAiSuggestion.description !== data.description)
      ) {
        await saveUserCorrection(
          user.id,
          aiInputText,
          {
            category: originalAiSuggestion.category,
            description: originalAiSuggestion.description,
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
            paymentMethod: data.paymentMethod,
            timeOfDay: getTimeOfDay(),
            dayOfWeek: getDayOfWeek(),
          }
        );
      }

      await onSubmit(data);
      form.reset();
      clearSuggestion();
      setAiInputText("");
      setAiSuggestionApplied(false);
      setOriginalAiSuggestion(null);
      onOpenChange(false);
    } catch (error) {
      console.error("フォーム送信エラー:", error);
      alert("エラーが発生しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  // バリデーションエラーがある場合、最初のエラーフィールドにフォーカス
  const handleFormError = () => {
    const errors = form.formState.errors;
    const firstErrorField = Object.keys(errors)[0];

    if (firstErrorField) {
      // エラーがあることをユーザーに通知
      const errorMessages = Object.entries(errors)
        .map(([field, error]) => {
          const fieldName =
            field === "date"
              ? "日付"
              : field === "amount"
              ? "金額"
              : field === "categoryMain"
              ? "メインカテゴリー"
              : field === "categorySub"
              ? "サブカテゴリー"
              : field === "description"
              ? "項目名"
              : field === "paymentMethod"
              ? "決済方法"
              : field;
          return `${fieldName}: ${error.message}`;
        })
        .join("\n");

      alert(`入力内容にエラーがあります:\n\n${errorMessages}`);

      // 最初のエラーフィールドにフォーカス
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element instanceof HTMLElement) {
        element.focus();
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  // AIサジェスチョンを適用
  const applyAiSuggestion = () => {
    if (!aiSuggestion) return;

    form.setValue("categoryMain", aiSuggestion.category.main);
    form.setValue("categorySub", aiSuggestion.category.sub);
    form.setValue("description", aiSuggestion.description);
    setAiSuggestionApplied(true);
    setOriginalAiSuggestion({
      category: aiSuggestion.category,
      description: aiSuggestion.description,
    });
  };

  // AIサジェスチョンを取得
  const handleGetAiSuggestion = () => {
    if (!description.trim()) return;

    setAiInputText(description);
    getSuggestion(description, {
      amount,
      paymentMethod,
      isIncome,
    });
  };

  // 収入/支出に応じたカテゴリーをフィルタリング
  const availableCategories = CATEGORIES.filter(
    (cat) => cat.isIncome === isIncome
  );

  // 選択されたメインカテゴリーのサブカテゴリーを取得
  const subCategories = categoryMain ? getSubCategories(categoryMain) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "新規取引を追加" : "取引を編集"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "収支情報を入力してください"
              : "取引情報を編集してください"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit, handleFormError)}
            className="space-y-6"
          >
            {/* 収入/支出切り替え */}
            <FormField
              control={form.control}
              name="isIncome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>種類</FormLabel>
                  <FormControl>
                    <Tabs
                      value={field.value ? "income" : "expense"}
                      onValueChange={(value) => {
                        field.onChange(value === "income");
                        form.setValue("categoryMain", "");
                        form.setValue("categorySub", "");
                      }}
                    >
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="expense">支出</TabsTrigger>
                        <TabsTrigger value="income">収入</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* 日付 */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>日付</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-white text-gray-900 hover:text-gray-900",
                      !field.value && "text-muted-foreground"
                    )}
                    onClick={() => setShowCalendar(!showCalendar)}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? (
                      format(field.value, "PPP", { locale: ja })
                    ) : (
                      <span>日付を選択</span>
                    )}
                  </Button>
                  {showCalendar && (
                    <div className="absolute z-50 mt-2 rounded-md border bg-popover shadow-md">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date);
                          setShowCalendar(false);
                        }}
                        initialFocus
                      />
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 金額 */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>金額</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        ¥
                      </span>
                      <Input
                        type="number"
                        placeholder="1000"
                        className="pl-8"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        value={field.value || ""}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* メインカテゴリー */}
            <FormField
              control={form.control}
              name="categoryMain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>メインカテゴリー</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="カテゴリーを選択" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableCategories.map((category) => (
                        <SelectItem key={category.main} value={category.main}>
                          {category.main}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* サブカテゴリー */}
            <FormField
              control={form.control}
              name="categorySub"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>サブカテゴリー</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!categoryMain}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            categoryMain
                              ? "サブカテゴリーを選択"
                              : "まずメインカテゴリーを選択"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subCategories.map((sub) => (
                        <SelectItem key={sub} value={sub}>
                          {sub}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 項目名 */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>項目名</FormLabel>
                    {aiAvailable && field.value && !aiSuggestion && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleGetAiSuggestion}
                        disabled={aiLoading}
                        className="h-7 text-xs"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        {aiLoading ? "分析中..." : "AIサジェスチョン"}
                      </Button>
                    )}
                  </div>
                  <FormControl>
                    <Input
                      placeholder="例: スーパーで食材購入"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        // 入力が変わったらサジェスチョンをクリア
                        if (aiSuggestion) {
                          clearSuggestion();
                          setAiSuggestionApplied(false);
                        }
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    具体的な内容を入力してください
                  </FormDescription>
                  <FormMessage />

                  {/* AIサジェスチョン表示 */}
                  {aiSuggestion && (
                    <div className="mt-3">
                      <AISuggestionBadge
                        confidence={aiSuggestion.confidence}
                        suggestion={`${aiSuggestion.category.main} > ${aiSuggestion.category.sub} - ${aiSuggestion.description}`}
                        onApply={applyAiSuggestion}
                        onDismiss={clearSuggestion}
                        isApplied={aiSuggestionApplied}
                      />
                    </div>
                  )}
                </FormItem>
              )}
            />

            {/* 決済方法 */}
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>決済方法</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="決済方法を選択" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PAYMENT_METHODS.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* メモ（任意） */}
            <FormField
              control={form.control}
              name="memo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>メモ（任意）</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="追加のメモがあれば入力してください"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 立替設定 */}
            {!isIncome && (
              <div className="space-y-4 rounded-lg border border-blue-200 bg-blue-50/50 p-4">
                <FormField
                  control={form.control}
                  name="hasAdvance"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base font-semibold">
                          立替設定
                        </FormLabel>
                        <FormDescription>
                          他の人の分を立て替えた場合にオンにしてください
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {hasAdvance && (
                  <>
                    {/* 立替タイプ */}
                    <FormField
                      control={form.control}
                      name="advance.type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>立替タイプ</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="立替タイプを選択" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="friend">
                                友人立替（友人から回収）
                              </SelectItem>
                              <SelectItem value="parent">
                                親負担（親から回収）
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            友人立替：友人から回収 / 親負担：親から回収
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* 立替金額 */}
                    <FormField
                      control={form.control}
                      name="advance.advanceAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>立替金額</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                ¥
                              </span>
                              <Input
                                type="number"
                                placeholder="0"
                                className="pl-8"
                                {...field}
                                onChange={(e) => {
                                  const value = Number(e.target.value) || 0;
                                  field.onChange(value);
                                  // 自己負担額を自動計算
                                  const total = amount || 0;
                                  form.setValue(
                                    "advance.personalAmount",
                                    Math.max(0, total - value)
                                  );
                                }}
                                value={field.value || ""}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            他の人のために立て替えた金額
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* 自己負担額 */}
                    <FormField
                      control={form.control}
                      name="advance.personalAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>自己負担額</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                ¥
                              </span>
                              <Input
                                type="number"
                                placeholder="0"
                                className="pl-8"
                                {...field}
                                onChange={(e) => {
                                  const value = Number(e.target.value) || 0;
                                  field.onChange(value);
                                  // 立替金額を自動計算
                                  const total = amount || 0;
                                  form.setValue(
                                    "advance.advanceAmount",
                                    Math.max(0, total - value)
                                  );
                                }}
                                value={field.value || ""}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>自分の負担分の金額</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* 計算結果の表示 */}
                    {amount > 0 &&
                      (advanceAmount || 0) + (personalAmount || 0) > 0 && (
                        <div className="rounded-md bg-white p-3 text-sm">
                          <div className="flex items-center gap-2 text-blue-600 mb-2">
                            <Info className="h-4 w-4" />
                            <span className="font-medium">金額の内訳</span>
                          </div>
                          <div className="space-y-1 text-gray-600">
                            <div className="flex justify-between">
                              <span>支払総額：</span>
                              <span className="font-medium">
                                ¥{amount.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>立替金額：</span>
                              <span className="font-medium">
                                ¥{(advanceAmount || 0).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>自己負担：</span>
                              <span className="font-medium">
                                ¥{(personalAmount || 0).toLocaleString()}
                              </span>
                            </div>
                            {Math.abs(
                              amount -
                                ((advanceAmount || 0) + (personalAmount || 0))
                            ) > 0.01 && (
                              <div className="mt-2 text-red-500 text-xs">
                                ⚠️ 合計が一致しません
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                    {/* 立替メモ */}
                    <FormField
                      control={form.control}
                      name="advance.memo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>立替メモ（任意）</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="例: Aさん・Bさん分"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            誰の分を立て替えたかなど
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
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
