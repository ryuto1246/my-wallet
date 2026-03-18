/**
 * 振替フィールド（Molecule）
 * 振替元・振替先のセレクタを共通化
 * TransferFormDialog と TransactionFormNew で共有
 */

"use client";

import { ArrowRightLeft } from "lucide-react";
import { Label } from "@/components/ui/label";
import { ErrorMessage } from "@/components/atoms";
import { PAYMENT_METHODS } from "@/constants/paymentMethods";

interface TransferFieldsProps {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  fromDisabled?: boolean;
  showSwap?: boolean;
  fromLabel?: string;
  fromError?: string;
  toError?: string;
  compact?: boolean; // TransactionFormNew用のコンパクト表示
}

export function TransferFields({
  from,
  to,
  onFromChange,
  onToChange,
  fromDisabled = false,
  showSwap = true,
  fromLabel,
  fromError,
  toError,
  compact = false,
}: TransferFieldsProps) {
  const handleSwap = () => {
    const temp = from;
    onFromChange(to);
    onToChange(temp);
  };

  if (compact) {
    // TransactionFormNew用のコンパクトレイアウト
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs md:text-sm text-gray-600">
            {fromLabel ?? (fromDisabled ? "振替元（自動）" : "振替元")}
          </Label>
          <select
            className="w-full mt-1 bg-white/60 backdrop-blur-sm border-0 rounded-lg md:rounded-xl px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all cursor-not-allowed"
            value={from}
            disabled={fromDisabled}
            onChange={(e) => onFromChange(e.target.value)}
          >
            <option value="">選択してください</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          {fromError && <ErrorMessage message={fromError} />}
        </div>
        <div>
          <Label className="text-xs md:text-sm text-gray-600">振替先</Label>
          <select
            className="w-full mt-1 bg-white/60 backdrop-blur-sm border-0 rounded-lg md:rounded-xl px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
            value={to}
            onChange={(e) => onToChange(e.target.value)}
          >
            <option value="">選択してください</option>
            {PAYMENT_METHODS.map((m) => (
              <option
                key={m.value}
                value={m.value}
                disabled={m.value === from}
              >
                {m.label}
                {m.value === from ? "（振替元）" : ""}
              </option>
            ))}
          </select>
          {toError && <ErrorMessage message={toError} />}
        </div>
      </div>
    );
  }

  // TransferFormDialog用のフルレイアウト
  return (
    <div className="relative">
      <div className="flex flex-row items-start gap-3">
        {/* 振替元 */}
        <div className="flex-1 space-y-2 p-5 rounded-xl bg-white/80 backdrop-blur-sm border-2 border-gray-200 hover:border-indigo-300 transition-colors">
          <Label
            htmlFor="transfer-from"
            className="text-sm font-semibold text-gray-700 flex items-center gap-2"
          >
            <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
            {fromLabel ?? "振替元"} *
          </Label>
          <select
            id="transfer-from"
            className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white font-medium text-gray-900 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            value={from}
            disabled={fromDisabled}
            onChange={(e) => onFromChange(e.target.value)}
          >
            <option value="">選択してください</option>
            {PAYMENT_METHODS.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
          {fromError && <ErrorMessage message={fromError} />}
        </div>

        {/* 入れ替えボタン */}
        {showSwap && (
          <div className="flex items-center pt-8">
            <button
              type="button"
              onClick={handleSwap}
              className="p-3 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg hover:from-indigo-600 hover:to-purple-600 transition-all hover:scale-110 active:scale-95 cursor-pointer"
              title="振替元と振替先を入れ替える"
            >
              <ArrowRightLeft className="w-6 h-6 text-white" />
            </button>
          </div>
        )}

        {/* 振替先 */}
        <div className="flex-1 space-y-2 p-5 rounded-xl bg-white/80 backdrop-blur-sm border-2 border-gray-200 hover:border-indigo-300 transition-colors">
          <Label
            htmlFor="transfer-to"
            className="text-sm font-semibold text-gray-700 flex items-center gap-2"
          >
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            振替先 *
          </Label>
          <select
            id="transfer-to"
            className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white font-medium text-gray-900 transition-colors"
            value={to}
            onChange={(e) => onToChange(e.target.value)}
          >
            <option value="">選択してください</option>
            {PAYMENT_METHODS.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
          {toError && <ErrorMessage message={toError} />}
        </div>
      </div>
    </div>
  );
}
