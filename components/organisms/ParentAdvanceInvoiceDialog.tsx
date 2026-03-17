/**
 * 親立替請求書ダイアログ（LINE貼り付けテキスト生成）
 */

"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Copy, Check, Loader2 } from "lucide-react";
import {
  filterParentAdvanceTransactions,
  generateParentAdvanceLineText,
} from "@/lib/helpers";
import { getAllTransactions } from "@/lib/firebase/transactions";
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
  const [copied, setCopied] = useState(false);
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
    "1月", "2月", "3月", "4月", "5月", "6月",
    "7月", "8月", "9月", "10月", "11月", "12月",
  ];
  const monthName = monthNames[selectedMonth];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear - 1 + i);
  const months = Array.from({ length: 12 }, (_, i) => i);

  useEffect(() => {
    if (open && userId) {
      loadTransactions();
    }
  }, [open, selectedYear, selectedMonth, userId]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const startDate = new Date(selectedYear, selectedMonth, 1);
      const endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);

      const monthlyTransactions = await getAllTransactions(userId, { startDate, endDate });
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

  const lineText = useMemo(
    () =>
      transactions.length > 0
        ? generateParentAdvanceLineText(transactions, selectedYear, selectedMonth)
        : "",
    [transactions, selectedYear, selectedMonth]
  );

  const totalAmount = transactions.reduce((sum, tx) => sum + tx.advanceAmount, 0);

  const handleCopyToLine = async () => {
    if (!lineText) return;
    try {
      await navigator.clipboard.writeText(lineText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("コピーエラー:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            親立替請求書
          </DialogTitle>
          <DialogDescription className="text-base">
            LINEに貼り付ける請求テキストを生成します
          </DialogDescription>
        </DialogHeader>

        {/* 年月選択 */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-2 block">年</label>
            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => setSelectedYear(parseInt(value))}
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
            <label className="text-sm font-medium text-gray-700 mb-2 block">月</label>
            <Select
              value={selectedMonth.toString()}
              onValueChange={(value) => setSelectedMonth(parseInt(value))}
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
              {/* 明細テーブル */}
              <div className="rounded-xl border-2 border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-3">
                  <h3 className="text-lg font-bold">
                    {selectedYear}年{monthName} 親立替請求書
                  </h3>
                </div>
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-orange-400 to-red-400 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">No.</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">日付</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">内容</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">金額</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">備考</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((tx, index) => (
                      <tr key={index} className="hover:bg-orange-50/50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-700 text-center">{index + 1}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {format(tx.date, "M/d", { locale: ja })}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">{tx.description}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-semibold text-right">
                          ¥{tx.advanceAmount.toLocaleString("ja-JP")}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{tx.memo || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gradient-to-r from-orange-100 to-red-100">
                    <tr>
                      <td colSpan={3} className="px-4 py-4 text-right text-sm font-bold text-gray-900">
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

              {/* LINEテキストプレビュー */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">LINEに貼り付けるテキスト</p>
                <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-wrap break-words font-sans leading-relaxed">
                  {lineText}
                </pre>
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
              onClick={handleCopyToLine}
              className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  コピーしました！
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  LINEにコピー
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
