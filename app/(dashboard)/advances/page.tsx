/**
 * 債権管理ページ（立替管理）
 * フラットリスト + チェックボックス一括操作
 */

"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { useDashboardTransactions, useAuth } from "@/hooks";
import { DashboardTemplate } from "@/components/templates";
import { PageHeader } from "@/components/organisms";
import { GlassCard } from "@/components/atoms";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  X,
  MessageSquare,
  Users,
  Copy,
  Check,
} from "lucide-react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AdvanceStatus = "pending" | "recovered" | "abandoned";

interface AdvanceItem {
  id: string;
  date: Date;
  description: string;
  amount: number;
  advanceAmount: number;
  status: AdvanceStatus;
  counterpartName: string;
  memo?: string;
}

const DEFAULT_COUNTERPARTS = ["父", "琴里", "養田", "Nectere"];

function generateLineText(items: AdvanceItem[], counterpartName: string): string {
  const total = items.reduce((s, t) => s + t.advanceAmount, 0);
  const lines = items
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((item) => {
      const date = format(item.date, "M/d", { locale: ja });
      const memo = item.memo ? `（${item.memo}）` : "";
      return `${date}　${item.description}　¥${item.advanceAmount.toLocaleString("ja-JP")}${memo}`;
    });

  return [
    `【立替請求】${counterpartName}へ`,
    "",
    ...lines,
    "",
    `合計　¥${total.toLocaleString("ja-JP")}`,
  ].join("\n");
}

const STATUS_LABELS: Record<AdvanceStatus, string> = {
  pending: "未回収",
  recovered: "回収済み",
  abandoned: "放棄",
};

const STATUS_COLORS: Record<AdvanceStatus, string> = {
  pending: "text-orange-600 bg-orange-50 border-orange-200",
  recovered: "text-emerald-600 bg-emerald-50 border-emerald-200",
  abandoned: "text-gray-400 bg-gray-50 border-gray-200",
};

export default function AdvancesPage() {
  const { user } = useAuth();
  const { transactions, loading, refetch } = useDashboardTransactions();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<AdvanceStatus | "all">("all");
  const [counterpartFilter, setCounterpartFilter] = useState<string>("all");
  const [counterparts, setCounterparts] = useState<string[]>(DEFAULT_COUNTERPARTS);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [newCounterpartName, setNewCounterpartName] = useState("");
  const [showLineDialog, setShowLineDialog] = useState(false);
  const [lineTexts, setLineTexts] = useState<{ counterpart: string; text: string }[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Firestoreからカウンターパート読み込み
  useEffect(() => {
    if (!user?.id) return;
    getDoc(doc(db, "users", user.id)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data.counterparts) && data.counterparts.length > 0) {
          setCounterparts(data.counterparts);
        }
      }
    });
  }, [user?.id]);

  const saveCounterparts = useCallback(
    async (updated: string[]) => {
      if (!user?.id) return;
      setCounterparts(updated);
      await updateDoc(doc(db, "users", user.id), { counterparts: updated });
    },
    [user?.id]
  );

  const addCounterpart = useCallback(async () => {
    const name = newCounterpartName.trim();
    if (!name || counterparts.includes(name)) return;
    await saveCounterparts([...counterparts, name]);
    setNewCounterpartName("");
  }, [newCounterpartName, counterparts, saveCounterparts]);

  const removeCounterpart = useCallback(async (name: string) => {
    await saveCounterparts(counterparts.filter((c) => c !== name));
  }, [counterparts, saveCounterparts]);

  // トランザクションからAdvanceItemを生成
  const allItems: AdvanceItem[] = useMemo(() => {
    return transactions
      .filter((t) => t.id && t.advance && t.advance.advanceAmount > 0 && !t.isIncome)
      .map((t) => ({
        id: t.id!,
        date: new Date(t.date),
        description: t.description,
        amount: t.amount,
        advanceAmount: t.advance!.advanceAmount,
        status:
          (t.advance!.status as AdvanceStatus | undefined) ||
          (t.advance!.isRecovered ? "recovered" : "pending"),
        counterpartName: t.advance!.type || "不明",
        memo: t.advance!.memo,
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [transactions]);

  // フィルタリング
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (counterpartFilter !== "all" && item.counterpartName !== counterpartFilter) return false;
      return true;
    });
  }, [allItems, statusFilter, counterpartFilter]);

  // サマリー
  const { pendingTotal, pendingCount } = useMemo(() => {
    const pending = allItems.filter((t) => t.status === "pending");
    return {
      pendingTotal: pending.reduce((s, t) => s + t.advanceAmount, 0),
      pendingCount: pending.length,
    };
  }, [allItems]);

  // 全選択切り替え
  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((t) => t.id)));
    }
  }, [selectedIds.size, filteredItems]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // ステータス一括更新
  const bulkUpdateStatus = useCallback(
    async (newStatus: AdvanceStatus) => {
      if (!user || selectedIds.size === 0) return;
      const ids = Array.from(selectedIds);
      setUpdatingIds(new Set(ids));
      try {
        await Promise.all(
          ids.map((id) =>
            updateDoc(doc(db, "transactions", id), {
              "advance.status": newStatus,
              "advance.isRecovered": newStatus === "recovered",
            })
          )
        );
        await refetch();
        setSelectedIds(new Set());
      } catch (e) {
        console.error("一括更新エラー:", e);
      } finally {
        setUpdatingIds(new Set());
      }
    },
    [user, selectedIds, refetch]
  );

  // 請求先一括設定
  const bulkSetCounterpart = useCallback(
    async (counterpartName: string) => {
      if (!user || selectedIds.size === 0) return;
      const ids = Array.from(selectedIds);
      setUpdatingIds(new Set(ids));
      try {
        await Promise.all(
          ids.map((id) =>
            updateDoc(doc(db, "transactions", id), {
              "advance.type": counterpartName,
            })
          )
        );
        await refetch();
        setSelectedIds(new Set());
      } catch (e) {
        console.error("請求先更新エラー:", e);
      } finally {
        setUpdatingIds(new Set());
      }
    },
    [user, selectedIds, refetch]
  );

  // LINE請求テキスト生成
  const generateSelectedLineTexts = useCallback(() => {
    const selectedItems = filteredItems.filter((t) => selectedIds.has(t.id));
    const grouped = new Map<string, AdvanceItem[]>();
    selectedItems.forEach((item) => {
      if (!grouped.has(item.counterpartName)) grouped.set(item.counterpartName, []);
      grouped.get(item.counterpartName)!.push(item);
    });
    const texts = Array.from(grouped.entries()).map(([counterpart, items]) => ({
      counterpart,
      text: generateLineText(items, counterpart),
    }));
    setLineTexts(texts);
    setShowLineDialog(true);
  }, [filteredItems, selectedIds]);

  const copyText = useCallback(async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }, []);

  // 単一ステータス更新
  const updateStatus = useCallback(
    async (id: string, newStatus: AdvanceStatus) => {
      if (!user) return;
      setUpdatingIds((prev) => new Set([...prev, id]));
      try {
        await updateDoc(doc(db, "transactions", id), {
          "advance.status": newStatus,
          "advance.isRecovered": newStatus === "recovered",
        });
        await refetch();
      } catch (e) {
        console.error("ステータス更新エラー:", e);
      } finally {
        setUpdatingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [user, refetch]
  );

  const allSelected =
    filteredItems.length > 0 && selectedIds.size === filteredItems.length;
  const someSelected = selectedIds.size > 0;

  return (
    <DashboardTemplate>
      <PageHeader
        title="債権管理（立替）"
        userName={undefined}
      />

      <div className="max-w-4xl mx-auto">
      {/* サマリー */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <GlassCard
          variant="soft"
          intensity="medium"
          className="p-4 border border-orange-100"
        >
          <p className="text-xs text-gray-500 mb-1">未回収残高</p>
          <p className="text-xl font-bold text-orange-600">
            ¥{pendingTotal.toLocaleString("ja-JP")}
          </p>
        </GlassCard>
        <GlassCard
          variant="soft"
          intensity="medium"
          className="p-4 border border-orange-100"
        >
          <p className="text-xs text-gray-500 mb-1">未回収件数</p>
          <p className="text-xl font-bold text-orange-500">{pendingCount}件</p>
        </GlassCard>
        <GlassCard
          variant="soft"
          intensity="medium"
          className="p-4 border border-blue-100"
        >
          <p className="text-xs text-gray-500 mb-1">立替総件数</p>
          <p className="text-xl font-bold text-blue-600">{allItems.length}件</p>
        </GlassCard>
        <GlassCard
          variant="soft"
          intensity="medium"
          className="p-4 border border-gray-100"
        >
          <p className="text-xs text-gray-500 mb-1">請求先</p>
          <p className="text-xl font-bold text-gray-700">{counterparts.length}件</p>
        </GlassCard>
      </div>

      {/* フィルターバー */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {/* ステータスフィルター */}
        <div className="flex items-center gap-1 bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200 p-1">
          {(["all", "pending", "recovered", "abandoned"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                statusFilter === s
                  ? "bg-blue-500 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {s === "all" ? "全て" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {/* 請求先フィルター */}
        <div className="flex items-center gap-1 bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200 p-1 flex-wrap">
          <button
            onClick={() => setCounterpartFilter("all")}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
              counterpartFilter === "all"
                ? "bg-blue-500 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            全員
          </button>
          {counterparts.map((cp) => (
            <button
              key={cp}
              onClick={() => setCounterpartFilter(cp)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                counterpartFilter === cp
                  ? "bg-blue-500 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {cp}
            </button>
          ))}
        </div>

        {/* 請求先管理ボタン */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowManageDialog(true)}
          className="rounded-xl text-gray-500 hover:text-gray-700 hover:bg-white/60 ml-auto"
        >
          <Users className="h-4 w-4 mr-1" />
          請求先管理
        </Button>
      </div>

      {/* 一括操作バー */}
      {someSelected && (
        <div className="sticky top-2 z-10 mb-3">
          <div className="bg-blue-600 text-white rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3 shadow-lg">
            <span className="text-sm font-semibold">{selectedIds.size}件選択中</span>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant="ghost"
                onClick={generateSelectedLineTexts}
                className="rounded-xl bg-white/20 hover:bg-white/30 text-white h-8 text-xs font-medium"
              >
                <MessageSquare className="h-3.5 w-3.5 mr-1" />
                LINE請求テキスト
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => bulkUpdateStatus("recovered")}
                className="rounded-xl bg-white/20 hover:bg-white/30 text-white h-8 text-xs font-medium"
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                回収済み
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => bulkUpdateStatus("abandoned")}
                className="rounded-xl bg-white/20 hover:bg-white/30 text-white h-8 text-xs font-medium"
              >
                <XCircle className="h-3.5 w-3.5 mr-1" />
                諦める
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-xl bg-white/20 hover:bg-white/30 text-white h-8 text-xs font-medium"
                  >
                    <Users className="h-3.5 w-3.5 mr-1" />
                    請求先を設定
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {counterparts.map((cp) => (
                    <DropdownMenuItem
                      key={cp}
                      onClick={() => bulkSetCounterpart(cp)}
                    >
                      {cp}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => bulkUpdateStatus("pending")}
                className="rounded-xl bg-white/20 hover:bg-white/30 text-white h-8 text-xs font-medium"
              >
                <Clock className="h-3.5 w-3.5 mr-1" />
                未回収に戻す
              </Button>
            </div>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="ml-auto text-white/70 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* リスト */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">読み込み中...</div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          {allItems.length === 0 ? "立替取引がありません" : "該当する取引がありません"}
        </div>
      ) : (
        <div className="space-y-2">
          {/* 全選択ヘッダー */}
          <div className="flex items-center gap-3 px-2 py-1">
            <Checkbox
              checked={allSelected}
              onCheckedChange={toggleSelectAll}
              className="flex-shrink-0"
            />
            <span className="text-xs text-gray-500">
              {filteredItems.length}件 / 全{allItems.length}件
            </span>
          </div>

          {filteredItems.map((item) => (
            <AdvanceListItem
              key={item.id}
              item={item}
              selected={selectedIds.has(item.id)}
              updating={updatingIds.has(item.id)}
              onSelect={() => toggleSelect(item.id)}
              onUpdateStatus={(status) => updateStatus(item.id, status)}
            />
          ))}
        </div>
      )}

      </div>{/* max-w-4xl */}

      {/* 請求先管理ダイアログ */}
      <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>請求先管理</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              {counterparts.map((cp) => (
                <div
                  key={cp}
                  className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2"
                >
                  <span className="text-sm font-medium text-gray-700">{cp}</span>
                  <button
                    onClick={() => removeCounterpart(cp)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newCounterpartName}
                onChange={(e) => setNewCounterpartName(e.target.value)}
                placeholder="新しい請求先名"
                className="rounded-xl"
                onKeyDown={(e) => e.key === "Enter" && addCounterpart()}
              />
              <Button
                onClick={addCounterpart}
                disabled={!newCounterpartName.trim()}
                className="rounded-xl shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowManageDialog(false)}
              className="rounded-xl"
            >
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* LINE請求テキストダイアログ */}
      <Dialog open={showLineDialog} onOpenChange={setShowLineDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>LINE請求テキスト</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {lineTexts.map((lt, i) => (
              <div key={lt.counterpart}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">
                    {lt.counterpart}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyText(lt.text, i)}
                    className="rounded-xl h-7 text-xs"
                  >
                    {copiedIndex === i ? (
                      <>
                        <Check className="h-3 w-3 mr-1 text-emerald-500" />
                        コピー済み
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        コピー
                      </>
                    )}
                  </Button>
                </div>
                <pre className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-800 whitespace-pre-wrap break-words font-sans leading-relaxed">
                  {lt.text}
                </pre>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLineDialog(false)}
              className="rounded-xl"
            >
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardTemplate>
  );
}

// 債権アイテムコンポーネント
function AdvanceListItem({
  item,
  selected,
  updating,
  onSelect,
  onUpdateStatus,
}: {
  item: AdvanceItem;
  selected: boolean;
  updating: boolean;
  onSelect: () => void;
  onUpdateStatus: (status: AdvanceStatus) => void;
}) {
  return (
    <div
      className={`relative flex items-center gap-3 p-3 rounded-2xl border-2 transition-all
        ${selected
          ? "bg-blue-50/90 border-blue-200 shadow-sm"
          : item.status === "pending"
          ? "bg-white/95 backdrop-blur-xl border-white/60 hover:bg-white hover:border-white/80 hover:shadow-glass-lg"
          : "bg-white/40 backdrop-blur-sm border-white/30 hover:bg-white/60"
        }
        ${updating ? "opacity-40" : item.status !== "pending" ? "opacity-50 hover:opacity-75" : ""}
      `}
    >
      {/* チェックボックス */}
      <Checkbox
        checked={selected}
        onCheckedChange={onSelect}
        className="flex-shrink-0"
      />

      {/* メイン情報 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-sm text-gray-900 truncate">
            {item.description}
          </h3>
          <Badge
            variant="outline"
            className="rounded-full px-2 py-0 text-xs font-medium text-blue-600 border-blue-200 bg-blue-50 flex-shrink-0"
          >
            {item.counterpartName}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
          <span>{format(item.date, "M月d日(E)", { locale: ja })}</span>
          {item.memo && (
            <>
              <span>·</span>
              <span className="truncate">{item.memo}</span>
            </>
          )}
        </div>
      </div>

      {/* 金額 */}
      <div className="text-right flex-shrink-0">
        <div className="text-base font-bold text-gray-900">
          ¥{item.advanceAmount.toLocaleString("ja-JP")}
        </div>
        {item.amount !== item.advanceAmount && (
          <div className="text-xs text-gray-400">
            支払 ¥{item.amount.toLocaleString("ja-JP")}
          </div>
        )}
      </div>

      {/* ステータスバッジ＋操作ボタン */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Badge
          variant="outline"
          className={`rounded-full px-2 py-0 text-xs font-semibold border ${STATUS_COLORS[item.status]}`}
        >
          {STATUS_LABELS[item.status]}
        </Badge>
        <div className="flex items-center">
          <button
            onClick={() => onUpdateStatus("pending")}
            disabled={updating || item.status === "pending"}
            className={`p-1 rounded-lg transition-all ${
              item.status === "pending"
                ? "text-orange-500"
                : "text-gray-300 hover:text-orange-400 hover:bg-orange-50"
            } disabled:cursor-not-allowed`}
            title="未回収"
          >
            <Clock className="h-4 w-4" />
          </button>
          <button
            onClick={() => onUpdateStatus("recovered")}
            disabled={updating || item.status === "recovered"}
            className={`p-1 rounded-lg transition-all ${
              item.status === "recovered"
                ? "text-emerald-500"
                : "text-gray-300 hover:text-emerald-500 hover:bg-emerald-50"
            } disabled:cursor-not-allowed`}
            title="回収済み"
          >
            <CheckCircle2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onUpdateStatus("abandoned")}
            disabled={updating || item.status === "abandoned"}
            className={`p-1 rounded-lg transition-all ${
              item.status === "abandoned"
                ? "text-red-400"
                : "text-gray-300 hover:text-red-400 hover:bg-red-50"
            } disabled:cursor-not-allowed`}
            title="諦める"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
