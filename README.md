# 🏦 Smart Wallet - AI 搭載家計簿アプリ

Google カレンダー連携と AI サジェスチョンを活用した、次世代家計簿アプリケーション

## 📋 目次

- [概要](#概要)
- [主な機能](#主な機能)
- [技術スタック](#技術スタック)
- [プロジェクト構成](#プロジェクト構成)
- [セットアップ](#セットアップ)
- [開発ロードマップ](#開発ロードマップ)
- [データ構造](#データ構造)
- [テスト](#テスト)

## 概要

### 解決する課題

既存の家計簿アプリやスプレッドシートの問題点を解決：

**既存アプリの問題点**

- 銀行/カード連携の入力が煩雑
- 立替処理の柔軟性不足（部分立替ができない）
- 立替金がグラフに混在してわかりにくい
- 入力を忘れがち
- 自動入力の項目名が店名で不明瞭
- 誤差を許容しない厳格さ

**スプレッドシートの問題点**

- 入力に時間がかかる
- 項目名・カテゴリーのばらつき
- 同じ店でも用途が異なる（例：作業用カフェ vs 娯楽）
- 残高確認のタイミングのズレによる誤差

### このアプリの特徴

1. **Google カレンダー連携** - 予定と支出を紐付けて可視化
2. **AI 搭載サジェスチョン** - Gemini による賢い項目名・カテゴリー提案
3. **柔軟な立替処理** - 部分立替、友人立替、親負担など複雑なシナリオに対応
4. **画像認識入力** - カードアプリのスクショから自動入力
5. **学習機能** - ユーザーの修正を学習して AI が改善
6. **誤差許容** - 残高確認機能で現実的な家計管理

## 主な機能

### Phase 1: 基本機能（MVP）

- ✅ ユーザー認証（Firebase Authentication）
- ✅ 基本的な収支入力（日付、金額、カテゴリー、メモ、決済方法）
- ✅ カテゴリー別集計・グラフ表示
- ✅ 月次・年次レポート
- ✅ レスポンシブデザイン（スマホ・PC 対応）

### Phase 2: 立替処理

- ✅ 部分立替機能（例：10,000 円のうち 7,500 円は立替）
- ✅ 立替タイプの管理
  - **友人立替**: 友人から後で回収する金額
  - **親負担**: 親から後で回収する金額（親が負担してくれる）
- ✅ 立替金残高の追跡
- ✅ 立替除外/含むグラフ切り替え表示
- ✅ 立替金回収の記録（収入/立替金回収）

### Phase 3: AI サジェスチョン

- ✅ Gemini API による項目名・カテゴリーの自動提案
- ✅ 過去の履歴からパターン学習
- ✅ 確信度スコアの表示
- ✅ 低確信度項目の確認画面
- ✅ 同じ店舗でも文脈に応じた分類（「タリーズ」→「作業用」or「娯楽」）

### Phase 4: スクショ認識

- ✅ 画像アップロード機能
- ✅ Gemini Vision による画像解析
- ✅ **取引リストから一括認識**（1 枚の画像から複数の取引を認識）
- ✅ 対応決済サービス
  - 三井住友 OLIVE
  - ソニー銀行
  - d 払い
  - d カード
  - PayPay
  - 現金（手入力）
- ✅ 認識結果の確認・修正画面
- ✅ 複数取引の一括登録
- ✅ 重複検出機能（二重登録防止）
- ✅ **テンプレート準拠の項目名生成**（「??（オオゼキ）で食材購入」など）
- ✅ 情報不足時の「??」プレースホルダー対応

### Phase 5: 学習・自動修正

- 🔲 ユーザーの修正履歴を蓄積
- 🔲 店舗 × 時間帯 × 曜日のパターン学習
- 🔲 AI モデルのファインチューニング
- 🔲 個人の支出パターン分析
- 🔲 修正提案の精度向上

### Phase 6: Google カレンダー連携

- 🔲 Google Calendar API 統合
- 🔲 入力時に該当時間帯の予定を表示
- 🔲 予定と支出の紐付け
- 🔲 予定間の支出記録（「バイト A とバイト B の間で使った」）
- 🔲 予定別支出レポート
- 🔲 カレンダービュー（予定と支出を統合表示）

## 技術スタック

### フロントエンド

- **フレームワーク**: Next.js 14+ (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS + shadcn/ui
- **状態管理**: React Context API / Zustand
- **デザインパターン**: Atomic Design

### バックエンド

- **認証**: Firebase Authentication
- **データベース**: Cloud Firestore
- **ストレージ**: Firebase Storage（画像保存）
- **サーバーレス関数**: Firebase Cloud Functions

### AI/ML

- **LLM**: Google Gemini API
  - テキスト解析: Gemini Pro
  - 画像認識: Gemini Vision
- **機能**:
  - カテゴリー分類
  - 項目名生成
  - スクショ OCR
  - パターン学習

### 外部 API

- **Google Calendar API**: 予定連携
- **Firebase**: 認証・DB・ストレージ

### インフラ・デプロイ

- **ホスティング**: Vercel（検討中）/ Firebase Hosting
- **CI/CD**: GitHub Actions
- **モニタリング**: Firebase Analytics

### 開発ツール

- **パッケージマネージャー**: npm
- **テスト**: Vitest (ユニットテスト) + Playwright (E2E)
- **リンター**: ESLint + Prettier
- **型チェック**: TypeScript strict mode

## プロジェクト構成

```
wallet/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/              # 認証関連ルート
│   │   ├── (dashboard)/         # ダッシュボード
│   │   ├── api/                 # API Routes
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/              # Atomic Design構成
│   │   ├── atoms/              # 最小単位（Button, Input, Icon）
│   │   ├── molecules/          # 組み合わせ（SearchBox, DatePicker）
│   │   ├── organisms/          # 複合体（TransactionForm, CategoryChart）
│   │   ├── templates/          # レイアウト
│   │   └── pages/              # ページコンポーネント
│   │
│   ├── lib/                    # ライブラリ・ユーティリティ
│   │   ├── firebase/          # Firebase設定
│   │   ├── gemini/            # Gemini API
│   │   ├── google-calendar/   # Calendar API
│   │   └── utils/             # ヘルパー関数
│   │
│   ├── hooks/                  # カスタムフック
│   │   ├── useTransactions.ts
│   │   ├── useCategories.ts
│   │   ├── useAdvance.ts      # 立替関連
│   │   └── useAISuggestion.ts
│   │
│   ├── types/                  # TypeScript型定義
│   │   ├── transaction.ts
│   │   ├── category.ts
│   │   ├── advance.ts
│   │   └── calendar.ts
│   │
│   ├── constants/              # 定数
│   │   ├── categories.ts      # カテゴリー定義
│   │   └── paymentMethods.ts
│   │
│   └── styles/                 # グローバルスタイル
│
├── tests/                       # テストファイル
│   ├── unit/
│   └── e2e/
│
├── firebase/                    # Firebase設定
│   ├── firestore.rules
│   ├── storage.rules
│   └── functions/              # Cloud Functions
│
├── public/                      # 静的ファイル
│
├── .env.local.example          # 環境変数テンプレート
├── firebase.json
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```

## データ構造

### カテゴリー階層

```typescript
// 大カテゴリー/小カテゴリー形式
収入
  - アルバイト
  - お小遣い
  - 立替金回収
  - その他

食費
  - 自炊
  - 外食
  - 学食
  - 飲み会
  - 家族
  - おやつ・カフェ
  - その他

生活
  - 日用品
  - 衣料品
  - 美容
  - 犬
  - 通信
  - 医療
  - その他

仕事
  - Nectere
  - RADICA

交通費
  - 電車バス
  - 特急
  - 飛行機
  - 車
  - タクシー
  - その他

学業教養
  - 教科書
  - 文房具
  - 資格
  - ソフトウェア
  - 学費
  - 書籍
  - 音楽
  - その他

娯楽
  - 娯楽
  - 団体費
  - 交際
  - その他

その他
  - 手数料
  - 立替
  - 借金返済
  - その他
```

### Firestore スキーマ

```typescript
// users collection
users/{userId}/
  - displayName: string
  - email: string
  - createdAt: timestamp
  - settings: {
      defaultPaymentMethod: string
      calendarEnabled: boolean
    }

// transactions collection
transactions/{transactionId}/
  - userId: string
  - date: timestamp
  - amount: number
  - category: {
      main: string
      sub: string
    }
  - description: string
  - paymentMethod: string
  - isIncome: boolean
  - advance?: {
      type: 'friend' | 'parent' | null
      totalAmount: number
      advanceAmount: number
      personalAmount: number
      isRecovered: boolean
    }
  - calendar?: {
      eventId: string
      eventName: string
      eventType: 'during' | 'between'
    }
  - ai?: {
      suggested: boolean
      confidence: number
      originalSuggestion: string
      userModified: boolean
    }
  - imageUrl?: string
  - createdAt: timestamp
  - updatedAt: timestamp

// ai_learning collection (ユーザーの修正履歴)
ai_learning/{learningId}/
  - userId: string
  - originalText: string
  - aiSuggestion: {
      category: object
      description: string
    }
  - userCorrection: {
      category: object
      description: string
    }
  - context: {
      amount: number
      paymentMethod: string
      timeOfDay: string
      dayOfWeek: string
    }
  - timestamp: timestamp
```

## セットアップ

### 前提条件

- Node.js 18 以上
- npm
- Firebase プロジェクト
- Google Cloud Platform アカウント（Gemini API 用）

### 環境変数

`.env.local`を作成し、以下を設定：

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Gemini API
GEMINI_API_KEY=

# Google Calendar API
GOOGLE_CALENDAR_CLIENT_ID=
GOOGLE_CALENDAR_CLIENT_SECRET=

# その他
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### インストール

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# プロダクションサーバー起動
npm start

# テスト実行
npm test

# E2Eテスト
npm run test:e2e

# リンター
npm run lint

# 型チェック
npm run type-check
```

### Firebase 設定

```bash
# Firebase CLIのインストール
npm install -g firebase-tools

# Firebaseログイン
firebase login

# Firebaseプロジェクトの初期化
firebase init

# セキュリティルールのデプロイ
firebase deploy --only firestore:rules,storage:rules

# Cloud Functionsのデプロイ
firebase deploy --only functions
```

## 開発ロードマップ

### Sprint 1-2: 基盤構築（2-3 週間）

- [x] プロジェクトセットアップ
- [ ] 認証システム構築
- [ ] 基本的な UI/UX デザイン（Atomic Design）
- [ ] Firestore スキーマ設計・実装
- [ ] 基本的な収支入力フォーム
- [ ] トランザクション一覧表示

### Sprint 3-4: 集計・可視化（2 週間）

- [ ] カテゴリー別集計機能
- [ ] 月次・年次レポート
- [ ] グラフ・チャート実装（Chart.js / Recharts）
- [ ] フィルター・検索機能

### Sprint 5-6: 立替処理（2 週間）

- [ ] 立替データ構造実装
- [ ] 部分立替入力 UI
- [ ] 立替金残高トラッキング
- [ ] 立替除外グラフ表示
- [ ] 立替金回収フロー

### Sprint 7-9: AI 機能（3-4 週間）

- [ ] Gemini API 統合
- [ ] カテゴリー自動分類
- [ ] 項目名サジェスチョン
- [ ] 確信度スコアリング
- [ ] 低確信度項目の確認画面
- [ ] 学習データ蓄積システム

### Sprint 10-12: 画像認識（3 週間）

- [ ] 画像アップロード機能
- [ ] Gemini Vision 統合
- [ ] 各決済サービスの OCR ロジック
- [ ] 認識結果の確認・修正 UI
- [ ] バッチ処理機能

### Sprint 13-15: 学習・改善（2-3 週間）

- [ ] ユーザー修正履歴の分析
- [ ] パターンマッチング改善
- [ ] 個人化されたサジェスチョン
- [ ] AI モデルの精度評価

### Sprint 16-18: カレンダー連携（3 週間）

- [ ] Google Calendar API 統合
- [ ] OAuth 認証フロー
- [ ] 予定と支出の紐付け UI
- [ ] カレンダービュー実装
- [ ] 予定別レポート機能

### Sprint 19-20: 最終調整（2 週間）

- [ ] パフォーマンス最適化
- [ ] テストカバレッジ向上
- [ ] ドキュメント整備
- [ ] デプロイ・本番リリース

## テスト

### ユニットテスト（Vitest）

```bash
npm test
```

**テスト対象**

- ユーティリティ関数
- カスタムフック
- ビジネスロジック
- データ変換処理

### E2E テスト（Playwright）

```bash
npm run test:e2e
```

**テストシナリオ**

- ユーザー登録・ログイン
- トランザクション作成・編集・削除
- 立替処理フロー
- AI サジェスチョン動作
- カレンダー連携

### テスト戦略

- **単体テスト**: 関数・フックの正常系・異常系
- **統合テスト**: コンポーネント間の連携
- **E2E テスト**: 主要ユーザーフロー
- **CI/CD**: GitHub Actions で自動実行

初心者向けのテスト解説：

- **Vitest**: 高速なユニットテストツール。関数が期待通りに動くかチェック
- **Playwright**: ブラウザを自動操作してユーザー視点でテスト
- **カバレッジ**: コードの何%がテストされているかの指標（目標 80%以上）

## 📚 関連ドキュメント

- [SETUP.md](SETUP.md) - 詳細なセットアップガイド（Firebase 設定含む）
- [ARCHITECTURE.md](ARCHITECTURE.md) - アーキテクチャ設計書
- [PROGRESS.md](PROGRESS.md) - 開発進捗状況
- [ACCESSIBILITY.md](ACCESSIBILITY.md) - アクセシビリティガイド
- [docs/CATEGORIES.md](docs/CATEGORIES.md) - カテゴリー構造の詳細ガイド
- [docs/IMAGE_RECOGNITION.md](docs/IMAGE_RECOGNITION.md) - 画像認識機能ガイド ⭐️ NEW

## コントリビューション

このプロジェクトは個人用ですが、将来的にマルチユーザー対応を予定しています。

## ライセンス

MIT License

## 作者

Ryuto

---

**開発状況**: 🚧 開発中

**最終更新**: 2025 年 10 月 8 日

**最新の更新**:

- カテゴリー構造を大幅改善（14 カテゴリー、100+サブカテゴリー）
- 項目名テンプレートの導入（構造化された項目名）
- フォームバリデーションエラー表示の改善（赤枠線、自動フォーカス）
- AI 学習精度向上
