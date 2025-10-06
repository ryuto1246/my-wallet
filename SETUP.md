# セットアップガイド

このドキュメントでは、Smart Wallet アプリのセットアップ手順を説明します。

## 📋 必要なもの

- Node.js 18 以上
- npm
- Google アカウント（Firebase 用）
- Git

## 🚀 クイックスタート

既に Firebase プロジェクト（wallet-2029e）が設定されています！

### 1. 環境変数の設定

プロジェクトルートに `.env.local` ファイルを作成：

**方法 1: VSCode で作成**

1. 左サイドバーで右クリック → 「新しいファイル」
2. ファイル名: `.env.local`
3. 以下をコピー&ペースト：

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyA9ksGNBDbEdkQoorkaG-hHVWS2bEJLEwo
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=wallet-2029e.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=wallet-2029e
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=wallet-2029e.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=981798285165
NEXT_PUBLIC_FIREBASE_APP_ID=1:981798285165:web:b91692a1c392df616cb464

# Gemini API Configuration (後で設定)
GEMINI_API_KEY=

# Google Calendar API Configuration (Phase 6で必要)
GOOGLE_CALENDAR_CLIENT_ID=
GOOGLE_CALENDAR_CLIENT_SECRET=
GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:3000/api/auth/callback/google

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Smart Wallet

# Environment
NODE_ENV=development
```

**方法 2: ターミナルで作成**

```bash
cat > .env.local << 'EOF'
# 上記の内容をここに貼り付け
EOF
```

### 2. 開発サーバーの起動

```bash
# 既存のサーバーを停止している場合
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

### 3. アプリをテスト

1. 「無料で始める」をクリック
2. メールアドレスとパスワードでアカウント作成
3. ダッシュボードにリダイレクトされることを確認

## 🔥 Firebase の詳細設定

### 現在の状態

- ✅ プロジェクト作成済み（wallet-2029e）
- ✅ Firebase CLI 設定済み
- ✅ Firestore セキュリティルール デプロイ済み
- ⚠️ Storage 設定が必要（下記参照）

### Firebase Console での確認事項

[Firebase Console](https://console.firebase.google.com/project/wallet-2029e/overview) で以下を確認：

#### 1. Authentication（認証）

**URL**: https://console.firebase.google.com/project/wallet-2029e/authentication

必須設定:

- [ ] **メール/パスワード認証を有効化**

  1. 「Sign-in method」タブを開く
  2. 「メール/パスワード」をクリック
  3. 「有効にする」トグルを ON
  4. 「保存」をクリック

- [ ] **Google 認証を有効化**
  1. 「Google」をクリック
  2. 「有効にする」トグルを ON
  3. サポートメールを選択
  4. 「保存」をクリック

#### 2. Firestore Database

**URL**: https://console.firebase.google.com/project/wallet-2029e/firestore

確認事項:

- [ ] データベースが作成されている
- [ ] セキュリティルールが適用されている（「ルール」タブで確認）

**データベースがない場合:**

```bash
# Firebase Consoleで作成後、ルールをデプロイ
firebase deploy --only firestore:rules
```

#### 3. Storage

**URL**: https://console.firebase.google.com/project/wallet-2029e/storage

**重要**: Storage は手動で設定が必要です。

1. **Storage を有効化**

   - 「始める」をクリック
   - 「本番環境モード」を選択
   - ロケーション確認（asia-northeast1）
   - 「完了」をクリック

2. **セキュリティルールを設定**
   - 「ルール」タブを開く
   - 以下をコピー&ペースト:

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    function isAuthenticated() {
      return request.auth != null;
    }

    function isValidSize() {
      return request.resource.size < 10 * 1024 * 1024;
    }

    function isImage() {
      return request.resource.contentType.matches('image/.*');
    }

    match /transactions/{userId}/{transactionId}/{fileName} {
      allow read: if isAuthenticated() && request.auth.uid == userId;
      allow write: if isAuthenticated()
                   && request.auth.uid == userId
                   && isValidSize()
                   && isImage();
      allow delete: if isAuthenticated() && request.auth.uid == userId;
    }

    match /users/{userId}/profile/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated()
                   && request.auth.uid == userId
                   && isValidSize()
                   && isImage();
      allow delete: if isAuthenticated() && request.auth.uid == userId;
    }

    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

- 「公開」をクリック

## 📦 依存関係のインストール（初回のみ）

```bash
# パッケージのインストール
npm install

# Playwrightブラウザのインストール（E2Eテスト用）
npx playwright install
```

## 🧪 テストの実行

### ユニットテスト

```bash
# テストを実行
npm test

# UIモードでテスト
npm run test:ui

# カバレッジレポート
npm run test:coverage
```

### E2E テスト

```bash
# E2Eテストを実行
npm run test:e2e

# UIモードでE2Eテスト
npm run test:e2e:ui
```

### 型チェック

```bash
npm run type-check
```

## 🔧 Firebase CLI コマンド

```bash
# プロジェクト一覧
firebase projects:list

# 現在のプロジェクト確認
firebase use

# Firestoreルールをデプロイ
firebase deploy --only firestore:rules

# Firestoreインデックスをデプロイ
firebase deploy --only firestore:indexes

# すべてをデプロイ
firebase deploy
```

## 🐛 トラブルシューティング

### エラー: "Firebase: Error (auth/unauthorized-domain)"

**原因**: localhost が承認済みドメインに含まれていない

**解決策**:

1. [Authentication 設定](https://console.firebase.google.com/project/wallet-2029e/authentication/settings)を開く
2. 「承認済みドメイン」タブ
3. `localhost` が含まれているか確認（通常は自動で追加されます）

### エラー: "Missing or insufficient permissions"

**原因**: Firestore のセキュリティルールが適用されていない

**解決策**:

```bash
firebase deploy --only firestore:rules
```

### 認証が動作しない

**確認事項**:

1. `.env.local` ファイルが存在するか
2. Firebase Console で認証方法が有効化されているか
3. 開発サーバーを再起動したか

**デバッグ**:

```bash
# 環境変数を確認
cat .env.local

# 開発サーバーを再起動
# Ctrl+C で停止してから
npm run dev
```

### データが保存されない

1. ブラウザのコンソール（F12）を開く
2. エラーメッセージを確認
3. Firebase Console の Firestore で「ルール」タブを確認

### ビルドエラー

```bash
# キャッシュをクリアして再インストール
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

## 🎯 次のステップ

### 1. アプリの動作確認

- [ ] アカウントを作成
- [ ] ログイン/ログアウト
- [ ] Firebase Console でユーザーが作成されたか確認

### 2. Gemini API キーの取得（AI 機能用）

1. [Google AI Studio](https://makersuite.google.com/app/apikey) にアクセス
2. 「Create API Key」をクリック
3. `.env.local` の `GEMINI_API_KEY` に設定
4. 開発サーバーを再起動

### 3. 開発を開始

- Phase 1: 基本的な収支入力フォームの実装
- Phase 2: 立替処理機能
- Phase 3 以降: AI 機能、カレンダー連携など

詳細は [README.md](./README.md) と [PROGRESS.md](./PROGRESS.md) を参照してください。

## 📚 関連リンク

- [Firebase Console](https://console.firebase.google.com/project/wallet-2029e)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [プロジェクト README](./README.md)
- [進捗状況](./PROGRESS.md)

## ⚠️ 重要な注意事項

- `.env.local` ファイルは**絶対に Git にコミットしない**でください
- API キーなどの機密情報が含まれています
- このファイルは `.gitignore` に含まれています
- 本番環境では環境変数を適切に設定してください
