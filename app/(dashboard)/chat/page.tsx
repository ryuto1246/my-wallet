/**
 * AI会話分析チャットページ
 */

"use client";

import { useDashboardTransactions } from "@/hooks";
import { DashboardTemplate } from "@/components/templates";
import { PageHeader } from "@/components/organisms";
import { ChatInterface } from "@/components/organisms/ChatInterface";
import { useState } from "react";

export default function ChatPage() {
  const { transactions } = useDashboardTransactions();
  const [monthsContext, setMonthsContext] = useState(3);

  return (
    <DashboardTemplate>
      <PageHeader title="AI会話分析" userName={undefined} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* サイドバー */}
        <div className="lg:col-span-1">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200 p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700">分析期間</p>
            {[1, 3, 6, 12].map((m) => (
              <button
                key={m}
                onClick={() => setMonthsContext(m)}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${
                  monthsContext === m
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                直近{m}ヶ月
              </button>
            ))}
          </div>
        </div>

        {/* チャット */}
        <div className="lg:col-span-3 bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200 overflow-hidden">
          <ChatInterface
            transactions={transactions as Parameters<typeof ChatInterface>[0]["transactions"]}
            monthsContext={monthsContext}
          />
        </div>
      </div>
    </DashboardTemplate>
  );
}
