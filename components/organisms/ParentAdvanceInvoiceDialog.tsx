/**
 * 親立替請求書プレビューダイアログ
 */

"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2 } from "lucide-react";
import {
  filterParentAdvanceTransactions,
  generateParentAdvanceInvoicePDF,
} from "@/lib/helpers";
import { getAllTransactions } from "@/lib/firebase/transactions";
import { Transaction } from "@/types/transaction";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface ParentAdvanceInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export function ParentAdvanceInvoiceDialog({
  open,
  onOpenChange,
  userId,
}: ParentAdvanceInvoiceDialogProps) {
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth()
  );
  const [transactions, setTransactions] = useState<
    Array<{
      date: Date;
      description: string;
      amount: number;
      advanceAmount: number;
      memo?: string;
    }>
  >([]);

  const monthNames = [
    "1月",
    "2月",
    "3月",
    "4月",
    "5月",
    "6月",
    "7月",
    "8月",
    "9月",
    "10月",
    "11月",
    "12月",
  ];
  const monthName = monthNames[selectedMonth];

  // 年と月の選択肢を生成
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear - 1 + i);
  const months = Array.from({ length: 12 }, (_, i) => i);

  // ダイアログが開いたときに取引を取得
  useEffect(() => {
    if (open && userId) {
      loadTransactions();
    }
  }, [open, selectedYear, selectedMonth, userId]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      // 指定月の開始日と終了日を計算
      const startDate = new Date(selectedYear, selectedMonth, 1);
      const endDate = new Date(
        selectedYear,
        selectedMonth + 1,
        0,
        23,
        59,
        59,
        999
      );

      // 指定月の全取引を取得
      const monthlyTransactions = await getAllTransactions(userId, {
        startDate,
        endDate,
      });

      // 親立替取引を抽出
      const parentAdvanceTransactions = filterParentAdvanceTransactions(
        monthlyTransactions,
        selectedYear,
        selectedMonth
      );

      setTransactions(parentAdvanceTransactions);
    } catch (error) {
      console.error("取引取得エラー:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (transactions.length === 0) return;
    try {
      await generateParentAdvanceInvoicePDF(
        transactions,
        selectedYear,
        selectedMonth
      );
    } catch (error) {
      console.error("PDF生成エラー:", error);
      alert("PDFの生成に失敗しました。");
    }
  };

  const totalAmount = transactions.reduce(
    (sum, tx) => sum + tx.advanceAmount,
    0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            親立替請求書
          </DialogTitle>
          <DialogDescription className="text-base">
            親立替分の内訳と合計金額を確認できます
          </DialogDescription>
        </DialogHeader>

        {/* 年月選択 */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              年
            </label>
            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => {
                setSelectedYear(parseInt(value));
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}年
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              月
            </label>
            <Select
              value={selectedMonth.toString()}
              onValueChange={(value) => {
                setSelectedMonth(parseInt(value));
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month} value={month.toString()}>
                    {monthNames[month]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          {/* 感謝メッセージ */}
          <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 rounded-xl p-4 border-2 border-orange-200/50">
            <p className="text-sm text-gray-700">
              いつもお世話になっております。
            </p>
            <p className="text-sm text-gray-700 mt-1">
              今月分の親立替費用のご請求です。
            </p>
            <p className="text-sm text-gray-700 mt-1">
              ご確認のほど、よろしくお願いいたします。
            </p>
          </div>

          {/* プレビューテーブル */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
              <span className="ml-2 text-gray-600">読み込み中...</span>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {selectedYear}年{selectedMonth + 1}月の親立替取引がありません。
            </div>
          ) : (
            <>
              <div className="rounded-xl border-2 border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-3">
                  <h3 className="text-lg font-bold">
                    {selectedYear}年{monthName} 親立替請求書
                  </h3>
                </div>
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-orange-400 to-red-400 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        No.
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        日付
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        内容
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">
                        金額
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        備考
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((tx, index) => (
                      <tr
                        key={index}
                        className="hover:bg-orange-50/50 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm text-gray-700 text-center">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {format(tx.date, "M/d", { locale: ja })}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                          {tx.description}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-semibold text-right">
                          ¥{tx.advanceAmount.toLocaleString("ja-JP")}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {tx.memo || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gradient-to-r from-orange-100 to-red-100">
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-4 text-right text-sm font-bold text-gray-900"
                      >
                        合計金額
                      </td>
                      <td className="px-4 py-4 text-right text-lg font-bold text-orange-700">
                        ¥{totalAmount.toLocaleString("ja-JP")}
                      </td>
                      <td className="px-4 py-4"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* 感謝メッセージ（下部） */}
              <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 rounded-xl p-4 border-2 border-orange-200/50">
                <p className="text-sm text-gray-700">
                  いつもご支援いただき、誠にありがとうございます。
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  今後とも変わらぬご理解とご協力をいただけますよう、
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  お願い申し上げます。
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            閉じる
          </Button>
          {transactions.length > 0 && (
            <Button
              onClick={handleGeneratePDF}
              className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
            >
              <Download className="mr-2 h-4 w-4" />
              PDFをダウンロード
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

