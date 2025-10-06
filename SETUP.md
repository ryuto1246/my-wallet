# セットアップガイド

このドキュメントでは、Smart Wallet アプリのセットアップ手順を説明します。

## 必要な準備

### 1. Firebase プロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名を入力（例：smart-wallet）
4. Google Analytics は任意で有効化
5. プロジェクトを作成

### 2. Firebase 認証の設定

1. Firebase プロジェクトで「Authentication」を選択
2. 「始める」をクリック
3. 「Sign-in method」タブで以下を有効化：
   - メール/パスワード
   - Google

### 3. Firestore データベースの設定

1. Firebase プロジェクトで「Firestore Database」を選択
2. 「データベースの作成」をクリック
3. 「本番環境モード」で開始（後でルールをデプロイします）
4. ロケーションを選択（asia-northeast1 推奨）

### 4. Firebase Storage の設定

1. Firebase プロジェクトで「Storage」を選択
2. 「始める」をクリック
3. 「本番環境モード」で開始

### 5. Firebase 設定情報の取得

1. Firebase プロジェクト設定（⚙️ アイコン）→「プロジェクトの設定」
2. 「全般」タブの「マイアプリ」セクションで「ウェブアプリ」を追加
3. アプリのニックネームを入力（例：Smart Wallet Web）
4. Firebase Hosting は今はスキップ
5. 表示される設定情報をコピー

### 6. Gemini API キーの取得

1. [Google AI Studio](https://makersuite.google.com/app/apikey)にアクセス
2. 「Create API Key」をクリック
3. API キーをコピー

### 7. 環境変数の設定

プロジェクトルートに`.env.local`ファイルを作成：

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here

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

**重要**: `.env.local`ファイルは`.gitignore`に含まれているため、Git にコミットされません。

## インストールと起動

### 依存関係のインストール

```bash
npm install
```

### Firebase ルールのデプロイ

```bash
# Firebase CLIのインストール（未インストールの場合）
npm install -g firebase-tools

# Firebaseにログイン
firebase login

# Firebaseプロジェクトの初期化
firebase use --add
# プロジェクトを選択してエイリアスを設定（例：default）

# セキュリティルールのデプロイ
firebase deploy --only firestore:rules,storage:rules

# インデックスのデプロイ
firebase deploy --only firestore:indexes
```

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

## テストの実行

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
# Playwrightブラウザのインストール（初回のみ）
npx playwright install

# E2Eテストを実行
npm run test:e2e

# UIモードでE2Eテスト
npm run test:e2e:ui
```

## トラブルシューティング

### Firebase の初期化エラー

- `.env.local`ファイルが正しく設定されているか確認
- Firebase プロジェクトの設定情報が正しいか確認
- 開発サーバーを再起動

### 認証エラー

- Firebase Console で認証方法が有効になっているか確認
- ブラウザのコンソールでエラーメッセージを確認

### ビルドエラー

```bash
# キャッシュをクリア
rm -rf .next node_modules
npm install
npm run build
```

## 次のステップ

1. アカウントを作成してログイン
2. 基本的な収支を入力してテスト
3. Firestore Console でデータが保存されているか確認

詳細は[README.md](./README.md)を参照してください。
