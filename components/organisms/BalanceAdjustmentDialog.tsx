/**
 * 残高調整ダイアログ（Organism）
 * 決済手段の実際の残高を入力して差異を記録
 */

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PaymentMethodValue } from "@/types/transaction";
import { getPaymentMethodLabel } from "@/constants";
import { formatCurrency } from "@/lib/helpers/format";
import { format } from "date-fns";
import { ErrorMessage } from "@/components/atoms";

interface BalanceAdjustmentFormData {
  date: Date;
  actualBalance: number;
  memo: string;
}

interface BalanceAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentMethod: PaymentMethodValue | null;
  expectedBalance: number;
  onSubmit: (date: Date, actualBalance: number, memo: string) => Promise<void>;
  onDateChange?: (date: Date) => void;
  defaultValues?: {
    date: Date;
    actualBalance: number;
    memo?: string;
  };
}

export function BalanceAdjustmentDialog({
  open,
  onOpenChange,
  paymentMethod,
  expectedBalance,
  onSubmit,
  onDateChange,
  defaultValues,
}: BalanceAdjustmentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BalanceAdjustmentFormData>({
    defaultValues: defaultValues || {
      date: new Date(),
      actualBalance: expectedBalance,
      memo: "",
    },
  });

  // ダイアログが開いたときまたはdefaultValuesが変更されたときにフォームをリセット
  const prevOpenRef = useRef<boolean>(false);
  const prevDefaultValuesKeyRef = useRef<string>('');
  
  useEffect(() => {
    const defaultValuesKey = defaultValues ? JSON.stringify(defaultValues) : '';
    const isOpening = open && !prevOpenRef.current;
    const isDefaultValuesChanged = open && defaultValues && prevOpenRef.current && defaultValuesKey !== prevDefaultValuesKeyRef.current;
    
    // ダイアログが開かれた時（false → true）のみリセット
    if (isOpening) {
      if (defaultValues) {
        // 編集モード：defaultValuesでリセット
        reset({
          date: defaultValues.date,
          actualBalance: defaultValues.actualBalance,
          memo: defaultValues.memo || "",
        });
        onDateChange?.(defaultValues.date);
      } else {
        // 新規作成モード：空の値でリセット
        const today = new Date();
        reset({
          date: today,
          actualBalance: expectedBalance,
          memo: "",
        });
        onDateChange?.(today);
      }
    }
    
    // defaultValuesが変更された場合（編集モードで別のアイテムを編集する場合など）
    if (isDefaultValuesChanged) {
      reset({
        date: defaultValues.date,
        actualBalance: defaultValues.actualBalance,
        memo: defaultValues.memo || "",
      });
      onDateChange?.(defaultValues.date);
    }
    
    // 状態を更新
    prevOpenRef.current = open;
    if (open && defaultValues) {
      prevDefaultValuesKeyRef.current = defaultValuesKey;
    }
  }, [open, defaultValues, expectedBalance, reset, onDateChange]);

  // ダイアログが開いたときに日付を初期化（新規作成モードの場合のみ）
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && !defaultValues) {
      const today = new Date();
      setValue("date", today);
      onDateChange?.(today);
    }
    onOpenChange(newOpen);
  };

  const actualBalance = watch("actualBalance");
  const difference = actualBalance ? actualBalance - expectedBalance : 0;

  // 日付変更時に親コンポーネントに通知
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    if (!dateValue) return; // 空の場合は何もしない

    const newDate = new Date(dateValue);
    if (isNaN(newDate.getTime())) return; // 無効な日付の場合は何もしない

    setValue("date", newDate);
    onDateChange?.(newDate);
  };

  const handleFormSubmit = async (data: BalanceAdjustmentFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(data.date, data.actualBalance, data.memo);
      reset({
        date: new Date(),
        actualBalance: expectedBalance,
        memo: "",
      });
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "残高調整の保存に失敗しました"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    const today = new Date();
    reset({
      date: today,
      actualBalance: expectedBalance,
      memo: "",
    });
    setError(null);
    onDateChange?.(today);
    onOpenChange(false);
  };

  if (!paymentMethod) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="md:max-w-md">
        <DialogHeader>
          <DialogTitle>残高確認(修正)</DialogTitle>
          <DialogDescription>
            {getPaymentMethodLabel(paymentMethod)}の実際の残高を入力してください
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* 確認日 */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-bold text-black">
              確認日 *
            </Label>
            <Input
              id="date"
              type="date"
              value={watch("date") ? format(watch("date"), "yyyy-MM-dd") : ""}
              onChange={handleDateChange}
              className="font-medium"
            />
          </div>

          {/* 残高比較 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* システム計算上の残高 */}
            <div className="space-y-2">
              <Label className="text-sm font-bold text-black">
                システム計算上の残高
              </Label>
              <Input
                type="text"
                value={formatCurrency(expectedBalance)}
                readOnly
                tabIndex={-1}
                className="bg-gray-50 text-black font-bold !text-lg focus:outline-none focus:ring-0"
              />
            </div>

            {/* 実際の残高 */}
            <div className="space-y-2">
              <Label
                htmlFor="actualBalance"
                className="text-sm font-bold text-black"
              >
                実際の残高 *
              </Label>
              <Input
                id="actualBalance"
                type="number"
                step="0.01"
                placeholder="実際の残高を入力"
                className="font-bold !text-lg"
                {...register("actualBalance", {
                  required: "実際の残高を入力してください",
                  valueAsNumber: true,
                })}
              />
              {errors.actualBalance && (
                <ErrorMessage message={errors.actualBalance.message || ""} />
              )}
            </div>
          </div>

          {/* 差額表示 */}
          {actualBalance !== undefined && difference !== 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`text-lg font-black ${
                    difference > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {difference > 0 ? "+" : ""}
                  {formatCurrency(Math.abs(difference || 0))}
                </span>
                <span className="text-sm text-black">
                  {difference > 0
                    ? "実際の残高の方が多くなっています"
                    : "実際の残高の方が少なくなっています"}
                </span>
              </div>
            </div>
          )}

          {/* メモ */}
          <div className="space-y-2">
            <Label htmlFor="memo">メモ（任意）</Label>
            <Textarea
              id="memo"
              placeholder="差異の理由などを記入"
              rows={3}
              {...register("memo")}
            />
          </div>

          {error && <ErrorMessage message={error} />}

          {/* ボタン */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? "保存中..." : "保存"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
