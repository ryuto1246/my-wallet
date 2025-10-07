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
      className="flex items-center justify-between p-6 md:p-7 rounded-3xl 
                    bg-white/95 backdrop-blur-xl 
                    border-2 border-white/60
                    hover:bg-white
                    hover:border-white/80
                    transition-all duration-300 hover:shadow-glass-lg hover:scale-[1.01] group"
    >
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-3">
          <h3 className="font-bold text-xl text-gray-900 group-hover:text-blue-700 transition-colors">
            {description}
          </h3>
          {showBadge && (
            <Badge
              variant={isIncome ? "default" : "secondary"}
              className="rounded-full px-4 py-1 backdrop-blur-sm font-semibold"
            >
              {isIncome ? "収入" : "支出"}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-800 flex-wrap font-medium">
          <span className="px-4 py-1.5 rounded-full bg-white/70 backdrop-blur-md border-2 border-white/50">
            {format(date, dateFormat, { locale: ja })}
          </span>
          <span className="px-4 py-1.5 rounded-full bg-white/70 backdrop-blur-md border-2 border-white/50">
            {categoryMain} / {categorySub}
          </span>
          {showPaymentMethod && paymentMethod && (
            <span className="px-4 py-1.5 rounded-full bg-white/70 backdrop-blur-md border-2 border-white/50">
              {getPaymentMethodLabel(paymentMethod)}
            </span>
          )}
        </div>
      </div>
      <div className="text-right ml-6">
        <div
          className={`text-3xl font-bold px-6 py-3 rounded-2xl backdrop-blur-md transition-all shadow-lg ${
            isIncome
              ? "text-emerald-800 bg-emerald-100/80 border-2 border-emerald-300/70"
              : "text-gray-900 bg-gray-200/80 border-2 border-gray-300/70"
          }`}
        >
          {isIncome ? "+" : "-"}¥{amount.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
