/**
 * AIサジェスチョンカルーセル
 * 複数のサジェスチョンをカルーセル形式で表示
 */

"use client";

import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AISuggestion } from "@/lib/gemini/suggestion";
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
}: SuggestionCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  const currentSuggestion = suggestions[currentIndex];
  const hasMultiple = suggestions.length > 1;

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? suggestions.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === suggestions.length - 1 ? 0 : prev + 1));
  };

  const handleSelect = () => {
    onSelect(currentSuggestion);
  };

  // 現在フォームに設定されている値と一致しているか確認
  const isApplied =
    form.watch("categoryMain") === currentSuggestion.category.main &&
    form.watch("categorySub") === currentSuggestion.category.sub &&
    form.watch("description") === currentSuggestion.description;

  const getConfidenceColor = () => {
    if (currentSuggestion.confidence >= 0.8) {
      return "bg-green-50 border-green-200";
    }
    if (currentSuggestion.confidence >= 0.6) {
      return "bg-yellow-50 border-yellow-200";
    }
    return "bg-orange-50 border-orange-200";
  };

  const getConfidenceText = () => {
    if (currentSuggestion.confidence >= 0.8) return "高確信度";
    if (currentSuggestion.confidence >= 0.6) return "中確信度";
    return "低確信度";
  };

  return (
    <div
      className={`rounded-xl border-2 p-4 transition-all ${
        isApplied ? "bg-blue-50 border-blue-300" : getConfidenceColor()
      }`}
    >
      <div className="space-y-3">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles
              className={`h-5 w-5 ${
                isApplied ? "text-blue-600" : "text-purple-600"
              }`}
            />
            <span className="text-sm font-semibold">AIサジェスチョン</span>
            <Badge
              variant="outline"
              className={`text-xs ${
                isApplied ? "bg-blue-100 text-blue-700 border-blue-300" : ""
              }`}
            >
              {getConfidenceText()} (
              {Math.round(currentSuggestion.confidence * 100)}
              %)
            </Badge>
          </div>

          {hasMultiple && (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handlePrevious}
                className="h-7 w-7"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-gray-600 px-2">
                {currentIndex + 1} / {suggestions.length}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleNext}
                className="h-7 w-7"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* サジェスチョン内容 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant={currentSuggestion.isIncome ? "default" : "secondary"}
              className="font-semibold"
            >
              {currentSuggestion.isIncome ? "収入" : "支出"}
            </Badge>
            <Badge variant="outline" className="font-medium">
              {currentSuggestion.category.main}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {currentSuggestion.category.sub}
            </Badge>
            {currentSuggestion.hasAdvance && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                {currentSuggestion.advanceType === "parent" && "👨‍👩‍👧 親"}
                {currentSuggestion.advanceType === "friend" && "👥 友達"}
                {!currentSuggestion.advanceType && "立替あり"}
              </Badge>
            )}
          </div>

          <p className="text-base font-semibold text-gray-900">
            {currentSuggestion.description}
          </p>
        </div>

        {/* アクションボタン */}
        {!isApplied && (
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              size="sm"
              onClick={handleSelect}
              className="flex-1"
            >
              このサジェスチョンを適用
            </Button>
          </div>
        )}

        {isApplied && (
          <div className="flex items-center gap-2 text-sm text-blue-600 font-medium pt-2">
            <span>✓</span>
            <span>サジェスチョンを適用しました</span>
          </div>
        )}
      </div>
    </div>
  );
}
