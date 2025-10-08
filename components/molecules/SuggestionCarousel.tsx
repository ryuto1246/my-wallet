/**
 * AIサジェスチョン編集可能カード
 */

"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getConfidenceLevel } from "@/lib/gemini";
import { CATEGORIES, getSubCategories } from "@/constants/categories";
import type { AISuggestion } from "@/lib/gemini";
import type { UseFormReturn } from "react-hook-form";
import type { TransactionFormValues } from "@/lib/validations/transaction";

interface SuggestionCarouselProps {
  suggestions: AISuggestion[];
  onSelect: (suggestion: AISuggestion) => void;
  form: UseFormReturn<TransactionFormValues>;
  amount: number;
}

export function SuggestionCarousel({
  suggestions,
  onSelect,
  form,
  amount,
}: SuggestionCarouselProps) {
  const isIncome = form.watch("isIncome");
  const categoryMain = form.watch("categoryMain");
  const categorySub = form.watch("categorySub");
  const description = form.watch("description");
  const memo = form.watch("memo");
  const advanceAmount = form.watch("advance.advanceAmount");
  const personalAmount = form.watch("advance.personalAmount");
  const advanceType = form.watch("advance.type");

  // 編集モードの状態管理
  const [editingField, setEditingField] = useState<string | null>(null);

  // 最初のサジェストを自動適用
  useEffect(() => {
    if (suggestions.length > 0 && suggestions[0]) {
      const suggestion = suggestions[0];
      console.log("🤖 AIサジェスト適用:", {
        isIncome: suggestion.isIncome,
        mainCategory: suggestion.category.main,
        subCategory: suggestion.category.sub,
        description: suggestion.description,
      });
      onSelect(suggestion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestions.length]);

  if (suggestions.length === 0) {
    return null;
  }

  // 最初のサジェストのみ使用
  const currentSuggestion = suggestions[0];
  const level = getConfidenceLevel(currentSuggestion.confidence);

  const getConfidenceText = () => {
    switch (level) {
      case "high":
        return "高確信度";
      case "medium":
        return "中確信度";
      case "low":
        return "低確信度";
    }
  };

  return (
    <div className="relative">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <span className="text-base font-bold text-gray-800">
            AIサジェスチョン
          </span>
          <Badge
            variant="outline"
            className="text-xs font-medium border-purple-300 text-purple-700"
          >
            {getConfidenceText()}{" "}
            {Math.round(currentSuggestion.confidence * 100)}%
          </Badge>
        </div>
      </div>

      {/* メインカード */}
      <div className="rounded-2xl bg-gradient-to-br from-white to-purple-50/30 p-1 shadow-lg">
        <div className="rounded-xl bg-white/80 backdrop-blur-sm p-6">
          <div className="space-y-4">
            {/* 項目名とメモ */}
            <div
              className="rounded-xl border-2 border-transparent bg-white/60 hover:bg-white/80 hover:border-purple-200 transition-all cursor-pointer p-4"
              onClick={() => setEditingField("description")}
            >
              {editingField === "description" ? (
                <div onClick={(e) => e.stopPropagation()}>
                  <Input
                    placeholder="例: スーパーで食材購入"
                    className="bg-white border-purple-300 text-xl font-bold mb-3"
                    value={description}
                    onChange={(e) =>
                      form.setValue("description", e.target.value)
                    }
                    autoFocus
                    onBlur={() => setEditingField(null)}
                  />
                  <Textarea
                    placeholder="メモを追加..."
                    className="resize-none bg-white border-purple-300 text-sm"
                    rows={2}
                    value={memo}
                    onChange={(e) => form.setValue("memo", e.target.value)}
                  />
                </div>
              ) : (
                <div>
                  <div className="text-xl font-bold text-gray-900 mb-2">
                    {description || (
                      <span className="text-gray-400 text-lg">
                        項目名を入力してください
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {memo || (
                      <span className="text-gray-400">メモを追加...</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* カテゴリー情報 - 3列レイアウト（収入/支出 + メイン + サブ） */}
            <div className="grid grid-cols-3 gap-2">
              {/* 収入/支出 */}
              <div
                className="group relative rounded-lg border border-transparent bg-white/60 hover:bg-white/80 hover:border-purple-200 transition-all cursor-pointer"
                onClick={() => {
                  const newIsIncome = !isIncome;
                  form.setValue("isIncome", newIsIncome);
                  form.setValue("categoryMain", "");
                  form.setValue("categorySub", "");
                }}
              >
                <div className="p-2.5">
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                      種類
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{isIncome ? "💰" : "💸"}</span>
                    <span
                      className={`text-sm font-bold ${
                        isIncome ? "text-green-600" : "text-blue-600"
                      }`}
                    >
                      {isIncome ? "収入" : "支出"}
                    </span>
                  </div>
                </div>
              </div>

              {/* メインカテゴリー */}
              <div className="group relative rounded-lg border border-transparent bg-white/60 hover:bg-white/80 hover:border-purple-200 transition-all">
                <div className="p-2.5">
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                      メイン
                    </span>
                  </div>
                  <Select
                    key={`main-${isIncome}-${categoryMain}`}
                    onValueChange={(value) => {
                      console.log("📝 メインカテゴリー変更:", value);
                      form.setValue("categoryMain", value);
                      form.setValue("categorySub", "");
                    }}
                    value={categoryMain || undefined}
                  >
                    <SelectTrigger className="border-0 bg-transparent p-0 h-auto hover:bg-transparent focus:ring-0 focus:ring-offset-0">
                      <SelectValue
                        placeholder={
                          <span className="text-gray-400 text-sm">選択</span>
                        }
                        className="text-sm font-bold text-gray-900"
                      >
                        <span className="text-sm font-bold text-gray-900">
                          {categoryMain}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.filter(
                        (cat) => cat.isIncome === isIncome
                      ).map((category) => (
                        <SelectItem key={category.main} value={category.main}>
                          {category.main}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* サブカテゴリー */}
              <div
                className={`group relative rounded-lg border border-transparent transition-all ${
                  categoryMain
                    ? "bg-white/60 hover:bg-white/80 hover:border-purple-200 cursor-pointer"
                    : "bg-gray-100/60 cursor-not-allowed"
                }`}
              >
                <div className="p-2.5">
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                      サブ
                    </span>
                  </div>
                  <Select
                    key={`sub-${categoryMain}-${categorySub}`}
                    onValueChange={(value) => {
                      console.log("📝 サブカテゴリー変更:", value);
                      form.setValue("categorySub", value);
                    }}
                    value={categorySub || undefined}
                    disabled={!categoryMain}
                  >
                    <SelectTrigger className="border-0 bg-transparent p-0 h-auto hover:bg-transparent focus:ring-0 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-100">
                      <SelectValue
                        placeholder={
                          <span className="text-gray-400 text-sm">
                            {categoryMain ? "選択" : "先にメイン"}
                          </span>
                        }
                        className="text-sm font-bold text-gray-900"
                      >
                        <span className="text-sm font-bold text-gray-900">
                          {categorySub}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {getSubCategories(categoryMain).map((sub) => (
                        <SelectItem key={sub} value={sub}>
                          {sub}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 立替設定 */}
            {!isIncome && advanceType && advanceType !== null && (
              <div className="rounded-xl border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-white p-3">
                {/* 立替金額入力 */}
                <div className="mb-3">
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                    立替金額（
                    {advanceType === "parent" ? "親が負担" : "友達の分"}）
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 text-sm font-bold">
                        ¥
                      </span>
                      <input
                        type="number"
                        placeholder="0"
                        className="w-full bg-white border border-blue-300 rounded-lg pl-8 pr-3 py-2 text-lg font-bold text-blue-600 placeholder:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                        value={advanceAmount || ""}
                        onChange={(e) => {
                          const value = Number(e.target.value) || 0;
                          const total = amount || 0;
                          const personal = Math.max(0, total - value);

                          // advance オブジェクトを更新
                          if (!form.getValues("advance")) {
                            form.setValue("advance", {
                              type: advanceType as "friend" | "parent",
                              totalAmount: total,
                              advanceAmount: value,
                              personalAmount: personal,
                              memo: "",
                            });
                          } else {
                            form.setValue("advance.advanceAmount", value);
                            form.setValue("advance.personalAmount", personal);
                            form.setValue("advance.totalAmount", total);
                          }
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const total = amount || 0;
                        if (!form.getValues("advance")) {
                          form.setValue("advance", {
                            type: advanceType as "friend" | "parent",
                            totalAmount: total,
                            advanceAmount: total,
                            personalAmount: 0,
                            memo: "",
                          });
                        } else {
                          form.setValue("advance.advanceAmount", total);
                          form.setValue("advance.personalAmount", 0);
                          form.setValue("advance.totalAmount", total);
                        }
                      }}
                      className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap"
                    >
                      全額
                    </button>
                  </div>
                </div>

                {/* 内訳表示 - 計算式風 */}
                <div className="bg-white rounded-lg p-2.5 text-xs">
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <div className="flex items-baseline gap-1">
                      <span className="text-gray-500">総額</span>
                      <span className="font-bold text-gray-900">
                        ¥{amount.toLocaleString()}
                      </span>
                    </div>

                    <span className="text-gray-400">=</span>

                    <div className="flex items-baseline gap-1">
                      <span className="text-blue-500">立替</span>
                      <span className="font-bold text-blue-600">
                        ¥{(advanceAmount || 0).toLocaleString()}
                      </span>
                    </div>

                    <span className="text-gray-400">+</span>

                    <div className="flex items-baseline gap-1">
                      <span className="text-gray-500">自己</span>
                      <span className="font-bold text-gray-900">
                        ¥{(personalAmount || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 計算確認 */}
                {amount > 0 &&
                  (advanceAmount || 0) + (personalAmount || 0) !== amount && (
                    <div className="mt-2 text-xs text-amber-600 bg-amber-50 rounded-lg p-2 text-center">
                      ⚠️ 合計が支払総額と一致していません
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ヒント */}
      <div className="mt-3 text-center">
        <p className="text-xs text-gray-500">
          💡 各項目をタップして編集できます
        </p>
      </div>
    </div>
  );
}
