/**
 * トランザクションリストアイテム（Molecule）
 * 単一のトランザクション情報を表示
 * Liquid Glassスタイルを適用
 */

import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { getPaymentMethodLabel } from "@/constants/paymentMethods";

interface TransactionListItemProps {
  id: string;
  date: Date;
  description: string;
  amount: number;
  isIncome: boolean;
  categoryMain: string;
  categorySub: string;
  paymentMethod?: string;
  showBadge?: boolean;
  showPaymentMethod?: boolean;
  dateFormat?: string;
}

export function TransactionListItem({
  date,
  description,
  amount,
  isIncome,
  categoryMain,
  categorySub,
  paymentMethod,
  showBadge = false,
  showPaymentMethod = false,
  dateFormat = "M/d(E)",
}: TransactionListItemProps) {
  return (
    <div
      className="flex items-center justify-between p-4 md:p-4 rounded-2xl 
                    bg-white/95 backdrop-blur-xl 
                    border-2 border-white/60
                    hover:bg-white
                    hover:border-white/80
                    transition-all duration-300 hover:shadow-glass-lg hover:scale-[1.01] group"
    >
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1.5">
          <h3 className="font-bold text-base text-gray-900 group-hover:text-blue-700 transition-colors">
            {description}
          </h3>
          {showBadge && (
            <Badge
              variant={isIncome ? "default" : "secondary"}
              className="rounded-full px-2.5 py-0.5 text-xs backdrop-blur-sm font-semibold"
            >
              {isIncome ? "収入" : "支出"}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-700 flex-wrap font-medium">
          <span className="px-2.5 py-0.5 rounded-full bg-white/70 backdrop-blur-md border border-white/50">
            {format(date, dateFormat, { locale: ja })}
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-white/70 backdrop-blur-md border border-white/50">
            {categoryMain} / {categorySub}
          </span>
          {showPaymentMethod && paymentMethod && (
            <span className="px-2.5 py-0.5 rounded-full bg-white/70 backdrop-blur-md border border-white/50">
              {getPaymentMethodLabel(paymentMethod)}
            </span>
          )}
        </div>
      </div>
      <div className="text-right ml-4">
        <div
          className={`text-xl font-bold transition-all ${
            isIncome ? "text-emerald-700" : "text-gray-900"
          }`}
        >
          {isIncome ? "+" : "-"}¥{amount.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
