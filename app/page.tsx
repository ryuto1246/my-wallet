/**
 * ランディングページ
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* ヘッダー */}
      <header className="border-b border-gray-200/50 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Smart Wallet
          </h1>
          <div className="flex gap-3">
            <Link href="/login">
              <Button
                variant="ghost"
                className="rounded-full text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              >
                ログイン
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/30">
                無料で始める
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1">
        {/* ヒーローセクション */}
        <section className="container mx-auto px-4 py-24 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-block mb-6 px-6 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
              🚀 AI搭載の次世代家計簿
            </div>
            <h2 className="text-6xl font-bold mb-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
              スマートに、
              <br />
              簡単に家計管理
            </h2>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Googleカレンダー連携とAIサジェスチョンで、
              あなたの家計管理を革新します
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="text-lg px-10 py-7 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40"
                >
                  今すぐ始める →
                </Button>
              </Link>
              <Link href="#features">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-10 py-7 rounded-full border-2 border-gray-300 bg-white text-gray-900 hover:text-gray-900 hover:bg-gray-100 hover:border-gray-400 transition-all"
                >
                  機能を見る
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* 機能セクション */}
        <section id="features" className="bg-white/50 backdrop-blur-sm py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h3 className="text-4xl font-bold mb-4 text-gray-900">
                主な機能
              </h3>
              <p className="text-gray-700 text-lg font-medium">
                あなたの家計管理を次のレベルへ
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {[
                {
                  emoji: "📅",
                  title: "カレンダー連携",
                  desc: "Googleカレンダーと連携して、予定と支出を紐付けて可視化",
                  gradient: "from-blue-500 to-cyan-500",
                },
                {
                  emoji: "🤖",
                  title: "AIサジェスチョン",
                  desc: "Gemini AIが項目名やカテゴリーを賢く提案",
                  gradient: "from-purple-500 to-pink-500",
                },
                {
                  emoji: "💳",
                  title: "画像認識入力",
                  desc: "カードアプリのスクショから自動入力",
                  gradient: "from-green-500 to-emerald-500",
                },
                {
                  emoji: "🔄",
                  title: "柔軟な立替処理",
                  desc: "部分立替や複雑な立替シナリオに完全対応",
                  gradient: "from-orange-500 to-red-500",
                },
                {
                  emoji: "📊",
                  title: "詳細な分析",
                  desc: "カテゴリー別、予定別の支出レポート",
                  gradient: "from-indigo-500 to-blue-500",
                },
                {
                  emoji: "🎓",
                  title: "学習機能",
                  desc: "あなたの修正から学習して精度が向上",
                  gradient: "from-pink-500 to-rose-500",
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="group p-8 rounded-3xl bg-white shadow-soft hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div
                    className={`text-5xl mb-6 w-16 h-16 flex items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-lg`}
                  >
                    {feature.emoji}
                  </div>
                  <h4 className="text-xl font-bold mb-3 text-gray-900">
                    {feature.title}
                  </h4>
                  <p className="text-gray-700 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTAセクション */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center p-16 rounded-[3rem] bg-gradient-to-br from-blue-600 to-purple-600 shadow-soft-xl">
              <h3 className="text-4xl font-bold mb-6 text-white">
                今すぐ始めましょう
              </h3>
              <p className="text-xl text-blue-50 mb-10 font-medium">
                無料でアカウントを作成して、スマートな家計管理を体験
              </p>
              <Link href="/signup">
                <Button
                  size="lg"
                  className="text-lg px-12 py-7 rounded-full bg-white text-blue-700 hover:bg-gray-50 shadow-xl hover:shadow-2xl font-semibold"
                >
                  無料で始める →
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* フッター */}
      <footer className="border-t border-gray-200/50 py-8 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2025 Smart Wallet. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
