# Lib フォルダ構造

プロジェクトのビジネスロジック、ユーティリティ、設定を管理するフォルダです。

## 📁 ディレクトリ構造

```
lib/
├── firebase/          # Firebase関連の設定と処理
│   ├── auth.ts       # 認証関連のヘルパー
│   ├── config.ts     # Firebase初期化設定
│   ├── index.ts      # エクスポート
│   ├── transactions.ts # トランザクションFirestore操作
│   └── users.ts      # ユーザーFirestore操作
├── helpers/          # ヘルパー関数
│   ├── transaction.ts # トランザクション計算・変換
│   ├── format.ts     # フォーマット処理
│   ├── date.ts       # 日付処理
│   └── index.ts      # エクスポート
├── store/            # 状態管理（Zustand）
│   ├── authStore.ts  # 認証状態
│   ├── transactionStore.ts # トランザクション状態
│   └── index.ts      # エクスポート
├── validations/      # バリデーションスキーマ
│   ├── transaction.ts # トランザクション検証
│   └── index.ts      # エクスポート
└── utils.ts          # 汎用ユーティリティ

```

## 📦 各モジュールの責務

### firebase/

Firebase 関連の全ての処理を管理。認証、Firestore 操作、設定などが含まれます。

**主要な関数:**

- `signUp()`, `signIn()`, `signOut()` - 認証
- `createTransaction()`, `getTransactions()` - トランザクション操作
- `createUserDocument()`, `getUserDocument()` - ユーザー操作

### helpers/

ビジネスロジックとデータ処理のヘルパー関数。

#### transaction.ts

トランザクション関連の計算と変換処理

- `calculateMonthlyStats()` - 月次統計計算
- `getRecentTransactions()` - 最近のトランザクション取得
- `filterTransactionsByDateRange()` - 期間でフィルタリング
- `filterTransactionsByCategory()` - カテゴリでフィルタリング
- `transformFormDataToTransaction()` - フォームデータ変換
- `calculateCategoryTotals()` - カテゴリ別集計
- `calculateDailyTotals()` - 日別集計

#### format.ts

表示用のフォーマット処理

- `formatCurrency()` - 金額フォーマット
- `formatDate()` - 日付フォーマット
- `getRelativeDateLabel()` - 相対的な日付表現
- `formatPercentage()` - パーセンテージフォーマット
- `formatNumberCompact()` - 数値の省略表記

#### date.ts

日付範囲の計算処理

- `getCurrentMonthRange()` - 今月の範囲
- `getLastMonthRange()` - 先月の範囲
- `getCurrentWeekRange()` - 今週の範囲
- `getTodayRange()` - 今日の範囲
- `getCurrentYearRange()` - 今年の範囲
- `getCustomRange()` - カスタム範囲

### store/

Zustand を使用したグローバル状態管理。

**状態:**

- `authStore` - 認証ユーザー情報
- `transactionStore` - トランザクション一覧とローディング状態

### validations/

Zod を使用したバリデーションスキーマ定義。

**スキーマ:**

- `transactionFormSchema` - トランザクションフォームの検証ルール

### utils.ts

汎用的なユーティリティ関数。

**関数:**

- `cn()` - Tailwind CSS クラスのマージ（clsx + twMerge）

## 🎯 使用例

### トランザクション統計の計算

```typescript
import { calculateMonthlyStats } from "@/lib/helpers";

const stats = calculateMonthlyStats(transactions);
console.log(stats); // { income: 100000, expense: 80000, balance: 20000 }
```

### 日付フォーマット

```typescript
import { formatDate, formatCurrency } from "@/lib/helpers";

const dateStr = formatDate(new Date(), "yyyy年M月d日");
const amount = formatCurrency(10000); // ¥10,000
```

### 期間フィルタリング

```typescript
import {
  getCurrentMonthRange,
  filterTransactionsByDateRange,
} from "@/lib/helpers";

const { start, end } = getCurrentMonthRange();
const monthlyTransactions = filterTransactionsByDateRange(
  transactions,
  start,
  end
);
```

### フォームデータ変換

```typescript
import { transformFormDataToTransaction } from "@/lib/helpers";

const handleSubmit = async (formData: TransactionFormValues) => {
  const transactionData = transformFormDataToTransaction(formData);
  await createTransaction(transactionData);
};
```

## 📝 設計原則

1. **単一責任の原則**: 各関数は 1 つの明確な責務を持つ
2. **再利用性**: コンポーネントやページから独立した純粋関数
3. **テスト容易性**: 副作用を最小限に抑え、テストしやすい設計
4. **型安全性**: TypeScript の型システムを活用
5. **ドメイン分離**: firebase/、helpers/、store/などドメインごとに分離

## 🔄 今後の拡張

- `helpers/analytics.ts` - 分析用ヘルパー
- `helpers/export.ts` - データエクスポート処理
- `firebase/storage.ts` - Firebase Storage 操作
- `validations/user.ts` - ユーザー検証スキーマ
