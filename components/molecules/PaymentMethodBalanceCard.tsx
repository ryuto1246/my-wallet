/**
 * 決済手段別残高カード（Molecule）
 * 各決済手段の収支と残高を表示
 */

import { CreditCard } from "lucide-react";
import { GlassCard } from "@/components/atoms";
import { getPaymentMethodLabel, getPaymentMethodColor } from "@/constants";
import { formatCurrency } from "@/lib/helpers/format";
import type { PaymentMethodValue } from "@/types/transaction";

export interface PaymentMethodBalance {
  paymentMethod: string;
  income: number;
  expense: number;
  balance: number;
  adjustedBalance?: number;
  lastAdjustmentDate?: Date;
}

interface PaymentMethodBalanceCardProps {
  data: PaymentMethodBalance;
  onClick?: () => void;
}

export function PaymentMethodBalanceCard({
  data,
  onClick,
}: PaymentMethodBalanceCardProps) {
  const label = getPaymentMethodLabel(data.paymentMethod as PaymentMethodValue);
  const color = getPaymentMethodColor(data.paymentMethod as PaymentMethodValue);
  const displayBalance = data.balance;
  const isPositive = displayBalance >= 0;
  const hasAdjustment = data.lastAdjustmentDate !== undefined;

  return (
    <GlassCard
      className={`p-3 cursor-pointer hover:shadow-md transition-shadow`}
      onClick={onClick}
    >
      <div className="space-y-2">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-sm font-bold text-black">{label}</span>
          </div>
          <CreditCard className="w-4 h-4 text-black" />
        </div>

        {/* 残高 */}
        <div className="space-y-0.5">
          <div className="text-xs font-bold text-black">
            {hasAdjustment ? "現在残高" : "収支"}
          </div>
          <div className="text-xl sm:text-2xl font-black text-black">
            {isPositive ? "+" : ""}
            {formatCurrency(displayBalance)}
          </div>
          {hasAdjustment && data.lastAdjustmentDate && (
            <div className="text-xs text-gray-600">
              (最終確認日:{" "}
              {new Date(data.lastAdjustmentDate).toLocaleDateString("ja-JP", {
                month: "short",
                day: "numeric",
              })}
              )
            </div>
          )}
        </div>

        {/* 詳細 */}
        <div className="flex justify-between text-xs">
          <div className="flex flex-col">
            <span className="text-black font-bold">
              {hasAdjustment ? "確認後収入" : "収入"}
            </span>
            <span className="text-black font-black">
              +{formatCurrency(data.income)}
            </span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-black font-bold">
              {hasAdjustment ? "確認後支出" : "支出"}
            </span>
            <span className="text-black font-black">
              -{formatCurrency(data.expense)}
            </span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
