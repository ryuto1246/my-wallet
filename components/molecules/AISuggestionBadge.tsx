/**
 * AIサジェスチョン表示バッジ
 */

"use client";

import { Sparkles, AlertCircle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getConfidenceLevel } from "@/lib/gemini";

interface AISuggestionBadgeProps {
  confidence: number;
  suggestion: string;
  onApply: () => void;
  onDismiss: () => void;
  isApplied?: boolean;
}

export function AISuggestionBadge({
  confidence,
  suggestion,
  onApply,
  onDismiss,
  isApplied = false,
}: AISuggestionBadgeProps) {
  const level = getConfidenceLevel(confidence);

  const getConfidenceColor = () => {
    switch (level) {
      case "high":
        return "bg-green-50 border-green-200 text-green-700";
      case "medium":
        return "bg-yellow-50 border-yellow-200 text-yellow-700";
      case "low":
        return "bg-orange-50 border-orange-200 text-orange-700";
    }
  };

  const getConfidenceIcon = () => {
    switch (level) {
      case "high":
        return <CheckCircle className="h-4 w-4" />;
      case "medium":
      case "low":
        return <AlertCircle className="h-4 w-4" />;
    }
  };

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
    <div
      className={`rounded-lg border p-3 transition-all ${
        isApplied ? "bg-blue-50 border-blue-200" : getConfidenceColor()
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <Sparkles
            className={`h-5 w-5 ${
              isApplied ? "text-blue-600" : "text-purple-600"
            }`}
          />
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">AIサジェスチョン</span>
            <Badge
              variant="outline"
              className={`text-xs ${
                isApplied ? "bg-blue-100 text-blue-700" : ""
              }`}
            >
              <span className="flex items-center gap-1">
                {getConfidenceIcon()}
                {getConfidenceText()} ({Math.round(confidence * 100)}%)
              </span>
            </Badge>
          </div>

          <p className="text-sm font-medium">{suggestion}</p>

          {!isApplied && (
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={onApply}
                className="h-8 text-xs"
              >
                適用
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={onDismiss}
                className="h-8 text-xs"
              >
                無視
              </Button>
            </div>
          )}

          {isApplied && (
            <p className="text-xs text-blue-600">
              ✓ サジェスチョンを適用しました
            </p>
          )}
        </div>
      </div>
    </div>
  );
}









