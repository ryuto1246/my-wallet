/**
 * 決済手段別残高一覧（Organism）
 * 各決済手段の収支と残高をグリッド表示
 */

import {
  PaymentMethodBalanceCard,
  PaymentMethodBalance,
} from "@/components/molecules/PaymentMethodBalanceCard";

interface PaymentMethodBalancesProps {
  balances: PaymentMethodBalance[];
  onBalanceClick?: (paymentMethod: string) => void;
}

export function PaymentMethodBalances({
  balances,
  onBalanceClick,
}: PaymentMethodBalancesProps) {
  if (balances.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mb-6 sm:mb-8">
      <h3 className="text-lg font-black text-black">
        決済手段別残高（全期間累計）
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {balances.map((balance) => (
          <PaymentMethodBalanceCard
            key={balance.paymentMethod}
            data={balance}
            onClick={() => onBalanceClick?.(balance.paymentMethod)}
          />
        ))}
      </div>
    </div>
  );
}
