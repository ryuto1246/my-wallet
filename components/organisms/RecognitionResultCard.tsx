/**
 * 画像認識結果表示カード
 * 認識された取引情報を表示し、確認・修正できるようにする
 */

"use client";

import { useState } from "react";
import {
  Check,
  X,
  AlertTriangle,
  Edit2,
  Image as ImageIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImagePreview } from "@/components/molecules/ImagePreview";
import { formatCurrency, formatDate } from "@/lib/helpers/format";
import type { ImageRecognitionResult } from "@/types/image-recognition";

interface RecognitionResultCardProps {
  /** 認識結果 */
  result: ImageRecognitionResult;
  /** 適用ボタンのハンドラ */
  onApply: (result: ImageRecognitionResult) => void;
  /** 無視ボタンのハンドラ */
  onIgnore: (result: ImageRecognitionResult) => void;
  /** 編集ボタンのハンドラ */
  onEdit?: (result: ImageRecognitionResult) => void;
}

export function RecognitionResultCard({
  result,
  onApply,
  onIgnore,
  onEdit,
}: RecognitionResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { transaction, duplicateInfo, status, error } = result;

  // 信頼度に応じたバッジの色
  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) {
      return (
        <Badge variant="default">
          信頼度: 高 ({Math.round(confidence * 100)}%)
        </Badge>
      );
    } else if (confidence >= 0.5) {
      return (
        <Badge variant="secondary">
          信頼度: 中 ({Math.round(confidence * 100)}%)
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline">
          信頼度: 低 ({Math.round(confidence * 100)}%)
        </Badge>
      );
    }
  };

  // エラー状態
  if (status === "error") {
    return (
      <Card className="p-6 border-destructive">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-destructive/10 p-2">
            <X className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-destructive mb-2">認識エラー</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onIgnore(result)}>
            閉じる
          </Button>
        </div>
      </Card>
    );
  }

  // 重複検出
  if (duplicateInfo?.isDuplicate) {
    return (
      <Card className="p-6 border-yellow-500">
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-yellow-500/10 p-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-700 dark:text-yellow-400 mb-2">
                重複の可能性があります
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {duplicateInfo.reason}
                <br />
                類似度: {Math.round(duplicateInfo.similarityScore * 100)}%
              </p>

              {/* 認識された情報の概要 */}
              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                {transaction.date && (
                  <div>
                    <span className="text-muted-foreground">日付: </span>
                    <span className="font-medium">
                      {formatDate(transaction.date)}
                    </span>
                  </div>
                )}
                {transaction.amount !== null && (
                  <div>
                    <span className="text-muted-foreground">金額: </span>
                    <span className="font-medium">
                      {formatCurrency(transaction.amount)}
                    </span>
                  </div>
                )}
                {transaction.merchantName && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">店舗: </span>
                    <span className="font-medium">
                      {transaction.merchantName}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onIgnore(result)}
            >
              <X className="mr-2 h-4 w-4" />
              スキップ
            </Button>
            <Button variant="default" size="sm" onClick={() => onApply(result)}>
              <Check className="mr-2 h-4 w-4" />
              追加する
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // 通常の認識結果
  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* ヘッダー */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <ImageIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">画像認識結果</h3>
              <div className="flex items-center gap-2 mt-1">
                {getConfidenceBadge(transaction.confidence)}
                {transaction.paymentService !== "unknown" && (
                  <Badge variant="outline">
                    {getServiceLabel(transaction.paymentService)}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "折りたたむ" : "展開"}
          </Button>
        </div>

        {/* 認識内容 */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t">
            {/* 画像プレビュー */}
            <div className="w-48">
              <ImagePreview imageUrl={result.previewUrl} clickable={false} />
            </div>

            {/* 認識された情報 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  日付
                </label>
                <p className="text-base">
                  {transaction.date ? formatDate(transaction.date) : "不明"}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  金額
                </label>
                <p className="text-base font-semibold">
                  {transaction.amount !== null
                    ? formatCurrency(transaction.amount)
                    : "不明"}
                </p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground">
                  店舗名・項目名
                </label>
                <p className="text-base">
                  {transaction.merchantName || "不明"}
                </p>
              </div>

              {transaction.suggestedCategory && (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    推測カテゴリー
                  </label>
                  <div className="flex gap-2">
                    <Badge variant="secondary">
                      {transaction.suggestedCategory.main}
                    </Badge>
                    <Badge variant="outline">
                      {transaction.suggestedCategory.sub}
                    </Badge>
                  </div>
                </div>
              )}

              {transaction.metadata?.location && (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    場所
                  </label>
                  <p className="text-sm text-muted-foreground">
                    {transaction.metadata.location}
                  </p>
                </div>
              )}
            </div>

            {/* アクションボタン */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onIgnore(result)}
              >
                <X className="mr-2 h-4 w-4" />
                無視
              </Button>
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onEdit(result)}
                >
                  <Edit2 className="mr-2 h-4 w-4" />
                  編集
                </Button>
              )}
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                onClick={() => onApply(result)}
              >
                <Check className="mr-2 h-4 w-4" />
                適用
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * 決済サービスのラベルを取得
 */
function getServiceLabel(service: string): string {
  const labels: Record<string, string> = {
    olive: "三井住友OLIVE",
    smbc_bank: "三井住友銀行",
    sony: "ソニー銀行",
    dpayment: "d払い",
    dcard: "dカード",
    paypay: "PayPay",
    cash: "現金",
    unknown: "不明",
  };
  return labels[service] || service;
}

