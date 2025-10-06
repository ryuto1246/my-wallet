/**
 * ランディングページ
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* ヘッダー */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Smart Wallet</h1>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="outline">ログイン</Button>
            </Link>
            <Link href="/signup">
              <Button>無料で始める</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1">
        {/* ヒーローセクション */}
        <section className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-5xl font-bold mb-6">AI搭載の次世代家計簿</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Googleカレンダー連携とAIサジェスチョンで、
            <br />
            あなたの家計管理を革新します
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                今すぐ始める
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="text-lg px-8">
                機能を見る
              </Button>
            </Link>
          </div>
        </section>

        {/* 機能セクション */}
        <section id="features" className="bg-gray-50 py-20">
          <div className="container mx-auto px-4">
            <h3 className="text-3xl font-bold text-center mb-12">主な機能</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="text-4xl mb-4">📅</div>
                <h4 className="text-xl font-bold mb-2">カレンダー連携</h4>
                <p className="text-gray-600">
                  Googleカレンダーと連携して、予定と支出を紐付けて可視化
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="text-4xl mb-4">🤖</div>
                <h4 className="text-xl font-bold mb-2">AIサジェスチョン</h4>
                <p className="text-gray-600">
                  Gemini AIが項目名やカテゴリーを賢く提案
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="text-4xl mb-4">💳</div>
                <h4 className="text-xl font-bold mb-2">画像認識入力</h4>
                <p className="text-gray-600">
                  カードアプリのスクショから自動入力
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="text-4xl mb-4">🔄</div>
                <h4 className="text-xl font-bold mb-2">柔軟な立替処理</h4>
                <p className="text-gray-600">
                  部分立替や複雑な立替シナリオに完全対応
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="text-4xl mb-4">📊</div>
                <h4 className="text-xl font-bold mb-2">詳細な分析</h4>
                <p className="text-gray-600">
                  カテゴリー別、予定別の支出レポート
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="text-4xl mb-4">🎓</div>
                <h4 className="text-xl font-bold mb-2">学習機能</h4>
                <p className="text-gray-600">
                  あなたの修正から学習して精度が向上
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTAセクション */}
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h3 className="text-3xl font-bold mb-6">今すぐ始めましょう</h3>
            <p className="text-xl text-gray-600 mb-8">
              無料でアカウントを作成して、スマートな家計管理を体験
            </p>
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                無料で始める
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* フッター */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2025 Smart Wallet. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
