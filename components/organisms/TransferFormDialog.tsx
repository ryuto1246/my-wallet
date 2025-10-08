/**
 * 振替フォームダイアログ（Organism）
 * 決済手段間の振替を記録
 */

"use client";

import { useState, useEffect } from "react";
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
import { Calendar as CalendarIcon, ArrowRightLeft, Wallet } from "lucide-react";
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
  defaultValues?: Partial<TransferFormData>;
  mode?: "create" | "edit";
}

export function TransferFormDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  mode = "create",
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
    defaultValues: defaultValues || {
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
  const amount = watch("amount");

  // デフォルト値が変更されたらフォームをリセット
  useEffect(() => {
    if (open && defaultValues) {
      reset(defaultValues);
    } else if (open && !defaultValues) {
      reset({
        date: new Date(),
        amount: 0,
        from: "",
        to: "",
        description: "口座間振替",
        memo: "",
      });
    }
  }, [open, defaultValues, reset]);

  // 振替元と振替先を入れ替える
  const handleSwapMethods = () => {
    const temp = fromMethod;
    setValue("from", toMethod || "");
    setValue("to", temp || "");
  };

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
      <DialogContent className="md:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {mode === "edit" ? "振替を編集" : "振替を記録"}
          </DialogTitle>
          <DialogDescription className="text-base">
            決済手段間のお金の移動を{mode === "edit" ? "編集" : "記録"}します
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* 金額入力エリア - 大きく目立つように */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8">
            {/* 装飾的な背景要素 */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200 rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
            <div
              className="absolute bottom-0 left-0 w-48 h-48 bg-blue-200 rounded-full filter blur-3xl opacity-20 animate-pulse"
              style={{ animationDelay: "1s" }}
            ></div>

            <div className="relative">
              <div className="absolute top-0 right-0">
                <Wallet className="h-6 w-6 text-indigo-300" />
              </div>
              <Label className="text-sm font-semibold text-gray-700 mb-4 block">
                振替金額 *
              </Label>
              <div className="flex items-center justify-center gap-3">
                <span className="text-4xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
                  ¥
                </span>
                <input
                  type="text"
                  placeholder="0"
                  value={amount ? amount.toLocaleString("ja-JP") : ""}
                  className="font-bold text-center border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none rounded-none px-2 placeholder:text-gray-300 text-gray-800 hover:text-indigo-600 focus:text-purple-600 transition-colors"
                  style={{
                    fontSize: "4.5rem",
                    lineHeight: "1.1",
                    width: "auto",
                    minWidth: "120px",
                    maxWidth: "400px",
                  }}
                  onChange={(e) => {
                    const value = e.target.value.replace(/,/g, "");
                    const numValue = value === "" ? 0 : Number(value);
                    if (!isNaN(numValue)) {
                      setValue("amount", numValue);
                    }
                  }}
                />
              </div>
              {errors.amount && (
                <div className="mt-4 text-center">
                  <ErrorMessage message={errors.amount.message || ""} />
                </div>
              )}
            </div>
          </div>

          {/* 振替元と振替先 - 横並び */}
          <div className="relative">
            <div className="flex flex-row items-start gap-3">
              {/* 振替元 */}
              <div className="flex-1 space-y-2 p-5 rounded-xl bg-white/80 backdrop-blur-sm border-2 border-gray-200 hover:border-indigo-300 transition-colors">
                <Label
                  htmlFor="from"
                  className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                >
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500"></span>
                  振替元 *
                </Label>
                <select
                  id="from"
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white font-medium text-gray-900 transition-colors"
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

              {/* 矢印（入れ替えボタン） */}
              <div className="flex items-center pt-8">
                <button
                  type="button"
                  onClick={handleSwapMethods}
                  className="p-3 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg hover:from-indigo-600 hover:to-purple-600 transition-all hover:scale-110 active:scale-95 cursor-pointer"
                  title="振替元と振替先を入れ替える"
                >
                  <ArrowRightLeft className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* 振替先 */}
              <div className="flex-1 space-y-2 p-5 rounded-xl bg-white/80 backdrop-blur-sm border-2 border-gray-200 hover:border-indigo-300 transition-colors">
                <Label
                  htmlFor="to"
                  className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                >
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                  振替先 *
                </Label>
                <select
                  id="to"
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white font-medium text-gray-900 transition-colors"
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
                {errors.to && (
                  <ErrorMessage message={errors.to.message || ""} />
                )}
              </div>
            </div>
          </div>

          {/* 日付と説明 */}
          <div className="grid grid-cols-2 gap-4">
            {/* 日付 */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">
                日付 *
              </Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                <Input
                  type="date"
                  value={date ? format(date, "yyyy-MM-dd") : ""}
                  onChange={(e) => {
                    const newDate = e.target.value
                      ? new Date(e.target.value)
                      : new Date();
                    setValue("date", newDate);
                  }}
                  className="pl-10 p-3 border-2 rounded-lg"
                />
              </div>
              {errors.date && (
                <ErrorMessage message={errors.date.message || ""} />
              )}
            </div>

            {/* 説明 */}
            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-sm font-semibold text-gray-700"
              >
                説明 *
              </Label>
              <Input
                id="description"
                placeholder="例: 口座間振替"
                {...register("description")}
                className="p-3 border-2 rounded-lg"
              />
              {errors.description && (
                <ErrorMessage message={errors.description.message || ""} />
              )}
            </div>
          </div>

          {/* メモ */}
          <div className="space-y-2">
            <Label
              htmlFor="memo"
              className="text-sm font-semibold text-gray-700"
            >
              メモ（任意）
            </Label>
            <Textarea
              id="memo"
              placeholder="詳細な説明を入力"
              rows={3}
              {...register("memo")}
              className="p-3 border-2 rounded-lg resize-none"
            />
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-red-50 border-2 border-red-200">
              <ErrorMessage message={error} />
            </div>
          )}

          {/* ボタン */}
          <div className="flex gap-4 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 h-12 text-base font-semibold rounded-xl bg-white hover:bg-gray-50"
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              className="flex-1 h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? mode === "edit"
                  ? "更新中..."
                  : "保存中..."
                : mode === "edit"
                ? "更新"
                : "保存"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
