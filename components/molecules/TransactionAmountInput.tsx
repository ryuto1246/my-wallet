/**
 * トランザクション金額入力エリア
 * 金額・日付・決済方法・キーワード入力・立替タイプ選択をまとめた上部エリア
 */

"use client";

import { format } from "date-fns";
import { Calendar as CalendarIcon, CreditCard } from "lucide-react";
import {
  Control,
  UseFormSetValue,
  UseFormGetValues,
  UseFormWatch,
} from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { PAYMENT_METHODS } from "@/constants/paymentMethods";
import type { TransactionFormValues } from "@/lib/validations/transaction";

interface TransactionAmountInputProps {
  control: Control<TransactionFormValues>;
  keyword: string;
  onKeywordChange: (value: string) => void;
  setValue: UseFormSetValue<TransactionFormValues>;
  getValues: UseFormGetValues<TransactionFormValues>;
  watch: UseFormWatch<TransactionFormValues>;
  amount: number;
}

export function TransactionAmountInput({
  control,
  keyword,
  onKeywordChange,
  setValue,
  getValues,
  watch,
  amount,
}: TransactionAmountInputProps) {
  const advanceType = watch("advance")?.type;

  const handleSelfClick = () => {
    setValue("hasAdvance", false);
    setValue("advance", undefined);
  };

  const handleAdvanceClick = (type: "parent" | "friend") => {
    setValue("hasAdvance", true);
    const currentAdvance = getValues("advance");
    const totalAmount = amount || 0;

    if (!currentAdvance) {
      setValue("advance", {
        type,
        totalAmount: totalAmount,
        advanceAmount: totalAmount, // デフォルトで全額
        personalAmount: 0,
        memo: "",
      });
    } else {
      setValue("advance.type", type);
      // 立替金額が未設定の場合は全額に設定
      if (!currentAdvance.advanceAmount) {
        setValue("advance.advanceAmount", totalAmount);
        setValue("advance.personalAmount", 0);
      }
    }
  };

  return (
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
              control={control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <input
                      type="date"
                      className="bg-white/60 backdrop-blur-sm border-0 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
                      value={
                        field.value ? format(field.value, "yyyy-MM-dd") : ""
                      }
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? new Date(e.target.value) : new Date()
                        )
                      }
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-gray-500" />
              <FormField
                control={control}
                name="paymentMethod"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormControl>
                      <select
                        className={`bg-white/60 backdrop-blur-sm border-0 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                          fieldState.error
                            ? "text-red-600 focus:ring-red-400 ring-2 ring-red-300"
                            : "text-gray-700 focus:ring-purple-400"
                        }`}
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
                    <FormMessage className="text-xs text-red-600 font-medium mt-1" />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* 金額入力 - 中央・大きく */}
        <FormField
          control={control}
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
                        field.value ? field.value.toLocaleString("ja-JP") : ""
                      }
                      onChange={(e) => {
                        const value = e.target.value.replace(/,/g, "");
                        const numValue = value === "" ? 0 : Number(value);
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
            onChange={(e) => onKeywordChange(e.target.value)}
          />
        </div>

        {/* 支払いタイプ選択 */}
        <div className="flex justify-center">
          <div className="inline-flex gap-2 bg-white/60 backdrop-blur-sm rounded-xl p-2">
            <button
              type="button"
              onClick={handleSelfClick}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                !advanceType
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
              onClick={() => handleAdvanceClick("parent")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                advanceType === "parent"
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
              onClick={() => handleAdvanceClick("friend")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                advanceType === "friend"
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
  );
}
