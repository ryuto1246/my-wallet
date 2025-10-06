# プロジェクトアーキテクチャ

このドキュメントでは、Smart Wallet プロジェクトの全体的なアーキテクチャと設計方針を説明します。

## 🏗️ アーキテクチャ概要

本プロジェクトは以下の設計原則に基づいて構築されています：

1. **Atomic Design** - コンポーネント設計
2. **関心の分離** - ビジネスロジックと UI の分離
3. **型安全性** - TypeScript による厳格な型定義
4. **再利用性** - DRY 原則の徹底

## 📂 ディレクトリ構造

```
wallet/
├── app/                      # Next.js App Router
│   ├── (auth)/              # 認証グループ
│   │   ├── login/          # ログインページ
│   │   └── signup/         # サインアップページ
│   └── (dashboard)/        # ダッシュボードグループ
│       ├── dashboard/      # ダッシュボードページ
│       ├── transactions/   # 取引一覧ページ
│       └── layout.tsx      # ダッシュボードレイアウト
├── components/              # UIコンポーネント（Atomic Design）
│   ├── atoms/              # 最小単位のコンポーネント
│   ├── molecules/          # Atomsの組み合わせ
│   ├── organisms/          # より大きな機能単位
│   ├── templates/          # ページレイアウト
│   └── ui/                 # shadcn/uiコンポーネント
├── lib/                     # ビジネスロジック・ユーティリティ
│   ├── firebase/           # Firebase操作
│   ├── helpers/            # ヘルパー関数
│   ├── store/              # 状態管理
│   ├── validations/        # バリデーション
│   └── utils.ts            # 汎用ユーティリティ
├── hooks/                   # カスタムフック
├── types/                   # TypeScript型定義
└── constants/              # 定数定義
```

## 🎨 Atomic Design

コンポーネントは以下の階層で設計されています：

### Atoms（原子）

最小単位の再利用可能なコンポーネント

**例:**

- `FormField` - ラベル付き入力欄
- `ErrorMessage` - エラー表示
- `Logo` - アプリロゴ
- `Divider` - 区切り線

**特徴:**

- 単一の責務
- プロパティのみで動作
- 状態を持たない（または最小限）

### Molecules（分子）

Atoms を組み合わせた小さなコンポーネント群

**例:**

- `StatsCard` - 統計情報カード
- `TransactionListItem` - トランザクション項目
- `AuthFormButtons` - 認証ボタンセット

**特徴:**

- 複数の Atoms を組み合わせ
- 特定の機能を実現
- 再利用可能

### Organisms（有機体）

より大きな機能的コンポーネント

**例:**

- `AuthCard` - 認証フォームカード
- `MonthlyStatsCards` - 月次統計カード群
- `TransactionList` - トランザクション一覧
- `PageHeader` - ページヘッダー

**特徴:**

- Molecules/Atoms を組み合わせ
- 独立した機能ブロック
- ページ横断で再利用可能

### Templates（テンプレート）

ページレイアウトの枠組み

**例:**

- `AuthTemplate` - 認証ページレイアウト
- `DashboardTemplate` - ダッシュボードレイアウト

**特徴:**

- ページ構造を定義
- コンテンツは受け取る
- 一貫したレイアウト

### Pages（ページ）

実際のページコンポーネント

**責務:**

- データフェッチング
- ビジネスロジック呼び出し
- 状態管理
- Templates にコンテンツを渡す

## 📚 lib/ フォルダの役割

ビジネスロジックとユーティリティ関数を管理。UI から完全に独立しています。

### firebase/

Firebase 関連の全処理を集約

- 認証（auth.ts）
- Firestore 操作（transactions.ts, users.ts）
- 設定（config.ts）

### helpers/

純粋関数によるビジネスロジック

**transaction.ts** - トランザクション処理

- 統計計算
- フィルタリング
- データ変換

**format.ts** - フォーマット処理

- 金額・日付・数値のフォーマット

**date.ts** - 日付処理

- 期間計算
- 範囲取得

### store/

グローバル状態管理（Zustand）

- 認証状態
- トランザクション状態

### validations/

バリデーションスキーマ（Zod）

- フォーム検証
- データ検証

## 🔄 データフロー

```
User Action
    ↓
Page Component (データフェッチ・状態管理)
    ↓
lib/helpers (ビジネスロジック)
    ↓
lib/firebase (データ永続化)
    ↓
Database (Firestore)

↓ (データ取得)

hooks (カスタムフック)
    ↓
Page Component
    ↓
Organisms
    ↓
Molecules
    ↓
Atoms
    ↓
UI表示
```

## 🎯 設計原則

### 1. 関心の分離（Separation of Concerns）

- **Pages**: データフェッチとビジネスロジック呼び出し
- **Components**: UI 表示のみ
- **lib/**: ビジネスロジックとデータ処理
- **hooks/**: 再利用可能なロジック

### 2. 単一責任の原則（Single Responsibility Principle）

- 各コンポーネント・関数は 1 つの明確な責務
- 大きなコンポーネントは小さく分割

### 3. DRY 原則（Don't Repeat Yourself）

- 重複コードを lib/helpers/に集約
- 共通 UI を Atomic Design で再利用

### 4. 型安全性

- TypeScript 厳格モード
- 全ての関数・コンポーネントに型定義
- types/フォルダで型を一元管理

### 5. テスト容易性

- 純粋関数の使用
- 依存注入の活用
- モック可能な設計

## 📦 主要な技術スタック

- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript
- **UI**: React + Tailwind CSS
- **コンポーネント**: shadcn/ui
- **状態管理**: Zustand
- **バリデーション**: Zod
- **データベース**: Firebase Firestore
- **認証**: Firebase Authentication
- **日付処理**: date-fns

## 🚀 開発ガイドライン

### 新しい機能の追加手順

1. **型定義**: `types/` に必要な型を追加
2. **ビジネスロジック**: `lib/helpers/` にヘルパー関数を追加
3. **Atoms 作成**: 必要なら `components/atoms/` に追加
4. **Molecules 作成**: `components/molecules/` に追加
5. **Organisms 作成**: `components/organisms/` に追加
6. **Page 実装**: ロジックを呼び出し、コンポーネントを組み立て

### コンポーネント作成時のチェックリスト

- [ ] 適切な Atomic Design レベルに配置
- [ ] TypeScript の型定義を追加
- [ ] プロパティに適切なデフォルト値
- [ ] ビジネスロジックを lib/に分離
- [ ] 再利用可能な設計
- [ ] アクセシビリティの考慮

### lib/関数作成時のチェックリスト

- [ ] 純粋関数（副作用なし）
- [ ] 適切な型定義
- [ ] 単一責任
- [ ] ドキュメントコメント
- [ ] テスト可能な設計

## 🧪 テスト戦略

- **Unit Tests**: lib/helpers/の関数をテスト
- **Component Tests**: Atoms のテスト
- **Integration Tests**: Organisms/Pages のテスト
- **E2E Tests**: ユーザーフローのテスト

## 📈 パフォーマンス最適化

- **コード分割**: 動的インポートの活用
- **メモ化**: useMemo/useCallback の適切な使用
- **遅延ロード**: 大きなコンポーネントの遅延読み込み
- **キャッシング**: Firebase Firestore のキャッシュ活用

## 🔐 セキュリティ

- Firebase Security Rules によるデータ保護
- クライアント側での機密情報の保護
- 適切な認証・認可チェック

## 📖 参考リソース

- [Atomic Design](https://atomicdesign.bradfrost.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
