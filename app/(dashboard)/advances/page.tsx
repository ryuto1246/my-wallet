/**
 * 債権一覧ページ（立替管理）
 */

"use client";

import { useMemo, useState, useCallback } from "react";
import { useDashboardTransactions } from "@/hooks";
import { DashboardTemplate } from "@/components/templates";
import { PageHeader } from "@/components/organisms";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { CheckCircle2, XCircle, Clock, ChevronDown, ChevronRight } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/hooks";

type AdvanceStatus = "pending" | "recovered" | "abandoned";

interface AdvanceTransaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  advanceAmount: number;
  status: AdvanceStatus;
  counterpartName: string;
  memo?: string;
}

export default function AdvancesPage() {
  const { user } = useAuth();
  const { transactions, loading, refetch } = useDashboardTransactions();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const advanceTransactions: AdvanceTransaction[] = useMemo(() => {
    return transactions
      .filter(t => t.advance && t.advance.advanceAmount > 0 && !t.isIncome)
      .map(t => ({
        id: t.id || '',
        date: new Date(t.date),
        description: t.description,
        amount: t.amount,
        advanceAmount: t.advance!.advanceAmount,
        status: (t.advance as { status?: AdvanceStatus }).status || (t.advance!.isRecovered ? 'recovered' : 'pending'),
        counterpartName: t.advance!.type || '不明',
        memo: t.advance!.memo,
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [transactions]);

  // グループ化（相手名別）
  const grouped = useMemo(() => {
    const map = new Map<string, AdvanceTransaction[]>();
    advanceTransactions.forEach(t => {
      if (!map.has(t.counterpartName)) map.set(t.counterpartName, []);
      map.get(t.counterpartName)!.push(t);
    });
    return Array.from(map.entries()).map(([name, txs]) => ({
      counterpartName: name,
      transactions: txs,
      pendingTotal: txs.filter(t => t.status === 'pending').reduce((s, t) => s + t.advanceAmount, 0),
      recoveredTotal: txs.filter(t => t.status === 'recovered').reduce((s, t) => s + t.advanceAmount, 0),
    })).sort((a, b) => b.pendingTotal - a.pendingTotal);
  }, [advanceTransactions]);

  const totalPending = grouped.reduce((s, g) => s + g.pendingTotal, 0);

  const updateStatus = useCallback(async (txId: string, newStatus: AdvanceStatus) => {
    if (!txId || !user) return;
    setUpdatingId(txId);
    try {
      await updateDoc(doc(db, 'transactions', txId), {
        'advance.status': newStatus,
        'advance.isRecovered': newStatus === 'recovered',
      });
      await refetch();
    } catch (e) {
      console.error('Status update error:', e);
    } finally {
      setUpdatingId(null);
    }
  }, [user, refetch]);

  const toggleGroup = (name: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const statusIcon = (status: AdvanceStatus) => {
    if (status === 'recovered') return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    if (status === 'abandoned') return <XCircle className="h-4 w-4 text-gray-400" />;
    return <Clock className="h-4 w-4 text-orange-500" />;
  };

  return (
    <DashboardTemplate>
      <PageHeader title="債権管理（立替）" userName={undefined} />

      {/* サマリー */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-orange-100 p-4">
          <p className="text-sm text-gray-600 mb-1">未回収残高</p>
          <p className="text-2xl font-bold text-orange-600">¥{totalPending.toLocaleString('ja-JP')}</p>
        </div>
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-emerald-100 p-4">
          <p className="text-sm text-gray-600 mb-1">債権グループ数</p>
          <p className="text-2xl font-bold text-emerald-600">{grouped.length}件</p>
        </div>
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-blue-100 p-4">
          <p className="text-sm text-gray-600 mb-1">立替件数</p>
          <p className="text-2xl font-bold text-blue-600">{advanceTransactions.length}件</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">読み込み中...</div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-12 text-gray-400">立替取引がありません</div>
      ) : (
        <div className="space-y-3">
          {grouped.map(group => {
            const isExpanded = expandedGroups.has(group.counterpartName);
            return (
              <div key={group.counterpartName} className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => toggleGroup(group.counterpartName)}
                  className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
                    <span className="font-semibold text-gray-800">{group.counterpartName}</span>
                    <span className="text-xs text-gray-500">{group.transactions.length}件</span>
                  </div>
                  <div className="text-right">
                    {group.pendingTotal > 0 && (
                      <p className="text-sm font-bold text-orange-600">
                        未回収 ¥{group.pendingTotal.toLocaleString('ja-JP')}
                      </p>
                    )}
                    {group.recoveredTotal > 0 && (
                      <p className="text-xs text-emerald-600">
                        回収済 ¥{group.recoveredTotal.toLocaleString('ja-JP')}
                      </p>
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {group.transactions.map(tx => (
                      <div key={tx.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{tx.description}</p>
                          <p className="text-xs text-gray-500">
                            {format(tx.date, 'M月d日', { locale: ja })}
                            {tx.memo && ` · ${tx.memo}`}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-gray-700 flex-shrink-0">
                          ¥{tx.advanceAmount.toLocaleString('ja-JP')}
                        </p>
                        <div className="flex gap-1 flex-shrink-0">
                          {(['pending', 'recovered', 'abandoned'] as AdvanceStatus[]).map(s => (
                            <button
                              key={s}
                              onClick={() => updateStatus(tx.id, s)}
                              disabled={updatingId === tx.id || tx.status === s}
                              className={`p-1.5 rounded-lg transition-all ${
                                tx.status === s
                                  ? 'bg-gray-100'
                                  : 'hover:bg-gray-100 opacity-40 hover:opacity-80'
                              } disabled:cursor-not-allowed`}
                              title={s === 'pending' ? '保留中' : s === 'recovered' ? '回収済み' : '放棄'}
                            >
                              {s === 'recovered' ? (
                                <CheckCircle2 className={`h-4 w-4 ${tx.status === s ? 'text-emerald-500' : 'text-gray-400'}`} />
                              ) : s === 'abandoned' ? (
                                <XCircle className={`h-4 w-4 ${tx.status === s ? 'text-red-400' : 'text-gray-400'}`} />
                              ) : (
                                <Clock className={`h-4 w-4 ${tx.status === s ? 'text-orange-500' : 'text-gray-400'}`} />
                              )}
                            </button>
                          ))}
                        </div>
                        {statusIcon(tx.status)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardTemplate>
  );
}
