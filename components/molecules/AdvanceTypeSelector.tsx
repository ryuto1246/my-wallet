/**
 * 立替タイプ選択コンポーネント
 * 支払いタイプ（自分・親・友達）を選択するボタングループ
 */

"use client";

import {
  UseFormSetValue,
  UseFormGetValues,
  UseFormWatch,
} from "react-hook-form";
import type { TransactionFormValues } from "@/lib/validations/transaction";

interface AdvanceTypeSelectorProps {
  setValue: UseFormSetValue<TransactionFormValues>;
  getValues: UseFormGetValues<TransactionFormValues>;
  watch: UseFormWatch<TransactionFormValues>;
  amount: number;
}

export function AdvanceTypeSelector({
  setValue,
  getValues,
  watch,
  amount,
}: AdvanceTypeSelectorProps) {
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
  );
}
