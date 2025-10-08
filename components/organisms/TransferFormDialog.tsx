/**
 * 振替フォームダイアログ（Organism）
 * 決済手段間の振替を記録
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Calendar as CalendarIcon, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { PAYMENT_METHODS } from "@/constants";
import { ErrorMessage } from "@/components/atoms";

const transferFormSchema = z
  .object({
    date: z.date({ message: "日付を選択してください" }),
    amount: z
      .number({ message: "金額を入力してください" })
      .positive("金額は正の数である必要があります"),
    from: z.string().min(1, "振替元を選択してください"),
    to: z.string().min(1, "振替先を選択してください"),
    description: z.string().min(1, "説明を入力してください"),
    memo: z.string().optional(),
  })
  .refine((data) => data.from !== data.to, {
    message: "振替元と振替先は異なる必要があります",
    path: ["to"],
  });

type TransferFormData = z.infer<typeof transferFormSchema>;

interface TransferFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TransferFormData) => Promise<void>;
}

export function TransferFormDialog({
  open,
  onOpenChange,
  onSubmit,
}: TransferFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TransferFormData>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      date: new Date(),
      amount: 0,
      from: "",
      to: "",
      description: "口座間振替",
      memo: "",
    },
  });

  const date = watch("date");
  const fromMethod = watch("from");
  const toMethod = watch("to");

  const handleFormSubmit = async (data: TransferFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(data);
      reset();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "振替の保存に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>振替を記録</DialogTitle>
          <DialogDescription>
            決済手段間のお金の移動を記録します
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* 日付 */}
          <div className="space-y-2">
            <Label>日付 *</Label>
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-slate-400" />
              <Input
                type="date"
                value={date ? format(date, "yyyy-MM-dd") : ""}
                onChange={(e) => {
                  const newDate = e.target.value
                    ? new Date(e.target.value)
                    : new Date();
                  setValue("date", newDate);
                }}
              />
            </div>
            {errors.date && (
              <ErrorMessage message={errors.date.message || ""} />
            )}
          </div>

          {/* 金額 */}
          <div className="space-y-2">
            <Label htmlFor="amount">金額 *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="振替金額を入力"
              {...register("amount", { valueAsNumber: true })}
            />
            {errors.amount && (
              <ErrorMessage message={errors.amount.message || ""} />
            )}
          </div>

          {/* 振替元と振替先 */}
          <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-end">
            <div className="space-y-2">
              <Label htmlFor="from">振替元 *</Label>
              <select
                id="from"
                className="w-full p-2 border border-slate-300 rounded-md"
                value={fromMethod || ""}
                onChange={(e) => setValue("from", e.target.value)}
              >
                <option value="">選択してください</option>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
              {errors.from && (
                <ErrorMessage message={errors.from.message || ""} />
              )}
            </div>

            <ArrowRight className="w-5 h-5 text-slate-400 mb-2" />

            <div className="space-y-2">
              <Label htmlFor="to">振替先 *</Label>
              <select
                id="to"
                className="w-full p-2 border border-slate-300 rounded-md"
                value={toMethod || ""}
                onChange={(e) => setValue("to", e.target.value)}
              >
                <option value="">選択してください</option>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
              {errors.to && <ErrorMessage message={errors.to.message || ""} />}
            </div>
          </div>

          {/* 説明 */}
          <div className="space-y-2">
            <Label htmlFor="description">説明 *</Label>
            <Input
              id="description"
              placeholder="例: 口座間振替"
              {...register("description")}
            />
            {errors.description && (
              <ErrorMessage message={errors.description.message || ""} />
            )}
          </div>

          {/* メモ */}
          <div className="space-y-2">
            <Label htmlFor="memo">メモ（任意）</Label>
            <Textarea
              id="memo"
              placeholder="詳細な説明を入力"
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
