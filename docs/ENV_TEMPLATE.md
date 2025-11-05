# 環境変数テンプレート

このドキュメントでは、プロジェクトで使用する環境変数の一覧と取得方法を説明します。

## 📋 必要な環境変数

### Firebase Configuration（必須）

これらの値は、[Firebase Console](https://console.firebase.google.com/) のプロジェクト設定から取得できます。

```bash
# Firebase API Key
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key

# Firebase Auth Domain
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com

# Firebase Project ID
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id

# Firebase Storage Bucket
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com

# Firebase Messaging Sender ID
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=000000000000

# Firebase App ID
NEXT_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:xxxxxxxxxxxxxx
```

### Gemini AI Configuration（必須）

AI 機能を使用するために必要です。[Google AI Studio](https://aistudio.google.com/app/apikey) から取得できます。

```bash
# Gemini API Key
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key
```

### Application Configuration（オプション）

開発環境では自動設定されますが、本番環境では明示的に設定することを推奨します。

```bash
# Application URL (本番環境のURLに変更)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Application Name
NEXT_PUBLIC_APP_NAME=Smart Wallet

# Environment
NODE_ENV=production
```

## 🔍 環境変数の取得方法

### 1. Firebase 設定値の取得

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. プロジェクトを選択
3. 左上の ⚙️（歯車）アイコン → 「プロジェクトの設定」
4. 「全般」タブをスクロールダウン
5. 「マイアプリ」セクションで、Web アプリを選択（ない場合は追加）
6. 「SDK の設定と構成」で「構成」を選択
7. 表示されるコードから各値をコピー

```javascript
// Firebase Consoleに表示される設定
const firebaseConfig = {
  apiKey: "...", // → NEXT_PUBLIC_FIREBASE_API_KEY
  authDomain: "...", // → NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  projectId: "...", // → NEXT_PUBLIC_FIREBASE_PROJECT_ID
  storageBucket: "...", // → NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "...", // → NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  appId: "...", // → NEXT_PUBLIC_FIREBASE_APP_ID
};
```

### 2. Gemini API キーの取得

1. [Google AI Studio](https://aistudio.google.com/app/apikey) にアクセス
2. Google アカウントでログイン
3. 「Create API key」または「Get API key」をクリック
4. プロジェクトを選択（Firebase と同じ Google プロジェクトを推奨）
5. 生成された API キーをコピー
6. `NEXT_PUBLIC_GEMINI_API_KEY` に設定

## 📝 環境別の設定方法

### ローカル開発環境

プロジェクトルートに `.env.local` ファイルを作成：

```bash
# .env.local
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=000000000000
NEXT_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:xxxxxx
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

**注意**: `.env.local` は `.gitignore` に含まれており、Git にコミットされません。

### Vercel 本番環境

詳細は [Vercel デプロイマニュアル](./VERCEL_DEPLOYMENT.md) を参照してください。

簡単な手順：

1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. プロジェクトを選択
3. Settings → Environment Variables
4. 上記の環境変数を 1 つずつ追加
5. 環境を選択（Production, Preview, Development）
6. Save

### GitHub Actions / CI/CD

GitHub Actions で使用する場合：

1. GitHub リポジトリの Settings → Secrets and variables → Actions
2. 「New repository secret」をクリック
3. 環境変数を 1 つずつ追加

## ⚠️ セキュリティの注意事項

### 公開されるキー（NEXT*PUBLIC*\*）

`NEXT_PUBLIC_` プレフィックスがついた環境変数は、クライアント側（ブラウザ）で使用されるため、ビルド後のコードに含まれます。

**注意点**:

- これらのキーはブラウザの DevTools で確認可能です
- Firebase/Gemini のセキュリティは、環境変数の秘匿ではなく、**アクセスルール**で保護します

### Firebase セキュリティ

Firebase の設定値は公開されても問題ありません。セキュリティは以下で確保します：

1. **Firestore Rules**: データベースへのアクセス制御
2. **Storage Rules**: ファイルストレージへのアクセス制御
3. **Authentication**: ユーザー認証
4. **承認済みドメイン**: アプリを実行できるドメインを制限

### Gemini API セキュリティ

Gemini API キーも公開されますが、以下で保護します：

1. **使用量制限**: Google Cloud Console で 1 日の使用量上限を設定
2. **リファラー制限**: 特定のドメインからのみ API を呼び出し可能に設定
3. **監視**: API 使用状況を定期的に確認

### 絶対に公開してはいけないキー

以下のようなサーバー側のみで使用するキーは、`NEXT_PUBLIC_` プレフィックスを**つけないでください**：

- Firebase Admin SDK の秘密鍵
- データベースの管理者パスワード
- サードパーティ API の秘密鍵（OAuth secret など）

## 🔄 環境変数の更新

### ローカル環境

1. `.env.local` ファイルを編集
2. 開発サーバーを再起動（`Ctrl+C` → `npm run dev`）

### Vercel 環境

1. Vercel Dashboard で環境変数を更新
2. **必ず再デプロイを実行**（環境変数の変更は再デプロイまで反映されません）
   - Deployments → 最新のデプロイメント → 「Redeploy」
   - または、Git に新しいコミットをプッシュ

## ✅ 環境変数のチェックリスト

デプロイ前に以下を確認してください：

### Firebase 関連

- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY` を設定
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` を設定
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID` を設定
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` を設定
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` を設定
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID` を設定
- [ ] Firebase Authentication が有効化されている
- [ ] Firestore が作成されている
- [ ] Firebase Storage が有効化されている
- [ ] セキュリティルールがデプロイされている

### Gemini AI 関連

- [ ] `NEXT_PUBLIC_GEMINI_API_KEY` を設定
- [ ] Gemini API が有効化されている
- [ ] 使用量制限を設定している

### アプリケーション関連

- [ ] `NEXT_PUBLIC_APP_URL` を本番 URL に設定
- [ ] `NODE_ENV` が `production` に設定されている（本番環境）
- [ ] Firebase の承認済みドメインに本番 URL を追加

## 📚 関連ドキュメント

- [Vercel デプロイマニュアル](./VERCEL_DEPLOYMENT.md)
- [セットアップガイド](../SETUP.md)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
