/**
 * 残高調整ダイアログ（Organism）
 * 決済手段の実際の残高を入力して差異を記録
 */

import { useState } from "react";
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
import { ErrorMessage } from "@/components/atoms";

interface BalanceAdjustmentFormData {
  actualBalance: number;
  memo: string;
}

interface BalanceAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentMethod: PaymentMethodValue | null;
  expectedBalance: number;
  onSubmit: (actualBalance: number, memo: string) => Promise<void>;
}

export function BalanceAdjustmentDialog({
  open,
  onOpenChange,
  paymentMethod,
  expectedBalance,
  onSubmit,
}: BalanceAdjustmentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<BalanceAdjustmentFormData>({
    defaultValues: {
      actualBalance: expectedBalance,
      memo: "",
    },
  });

  const actualBalance = watch("actualBalance");
  const difference = actualBalance ? actualBalance - expectedBalance : 0;

  const handleFormSubmit = async (data: BalanceAdjustmentFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(data.actualBalance, data.memo);
      reset();
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
    reset();
    setError(null);
    onOpenChange(false);
  };

  if (!paymentMethod) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>残高確認(修正)</DialogTitle>
          <DialogDescription>
            {getPaymentMethodLabel(paymentMethod)}の実際の残高を入力してください
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
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
