/**
 * トランザクションリストアイテム（Molecule）
 * 単一のトランザクション情報を表示
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
    <div className="flex items-center justify-between p-4 md:p-5 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all duration-200 hover:shadow-md">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="font-semibold text-lg text-gray-900">{description}</h3>
          {showBadge && (
            <Badge
              variant={isIncome ? "default" : "secondary"}
              className="rounded-full px-3"
            >
              {isIncome ? "収入" : "支出"}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-700 flex-wrap">
          <span className="px-3 py-1 rounded-full bg-white border border-gray-200">
            {format(date, dateFormat, { locale: ja })}
          </span>
          <span className="px-3 py-1 rounded-full bg-white border border-gray-200">
            {categoryMain} / {categorySub}
          </span>
          {showPaymentMethod && paymentMethod && (
            <span className="px-3 py-1 rounded-full bg-white border border-gray-200">
              {getPaymentMethodLabel(paymentMethod)}
            </span>
          )}
        </div>
      </div>
      <div className="text-right ml-4">
        <div
          className={`text-2xl font-bold px-4 py-2 rounded-xl ${
            isIncome
              ? "text-emerald-700 bg-emerald-50"
              : "text-gray-900 bg-gray-200"
          }`}
        >
          {isIncome ? "+" : "-"}¥{amount.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
