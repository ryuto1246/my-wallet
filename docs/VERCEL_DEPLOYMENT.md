# Vercel デプロイマニュアル

このドキュメントでは、GitHub 連携した Vercel プロジェクトに必要な環境変数の設定方法を説明します。

## 目次

1. [事前準備](#事前準備)
2. [環境変数の設定](#環境変数の設定)
3. [デプロイ設定](#デプロイ設定)
4. [トラブルシューティング](#トラブルシューティング)

---

## 事前準備

### 必要なアカウント・プロジェクト

1. **Firebase プロジェクト**

   - Firebase Console: https://console.firebase.google.com/
   - Authentication、Firestore、Storage を有効化

2. **Gemini API キー**

   - Google AI Studio: https://aistudio.google.com/app/apikey

3. **Vercel プロジェクト**
   - GitHub リポジトリと連携済み

---

## 環境変数の設定

### 1. Firebase 設定値の取得

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. プロジェクトを選択
3. 左上の歯車アイコン → 「プロジェクトの設定」をクリック
4. 「全般」タブの下部にある「マイアプリ」セクションを確認
5. Web アプリがない場合は「アプリを追加」→「ウェブ」を選択してアプリを作成
6. 「SDK の設定と構成」で「構成」を選択し、以下の値をコピー:

```javascript
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
2. 「Create API key」をクリック
3. Google Cloud プロジェクトを選択（または Firebase プロジェクトと同じものを選択）
4. 生成された API キーをコピー → `NEXT_PUBLIC_GEMINI_API_KEY`

### 3. Vercel に環境変数を設定

#### 方法 A: Vercel Dashboard から設定（推奨）

1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. 対象のプロジェクトを選択
3. 「Settings」タブをクリック
4. 左サイドバーから「Environment Variables」を選択
5. 以下の環境変数を 1 つずつ追加:

| 変数名                                     | 値                             | 環境                             |
| ------------------------------------------ | ------------------------------ | -------------------------------- |
| `NEXT_PUBLIC_FIREBASE_API_KEY`             | Firebase の`apiKey`            | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | Firebase の`authDomain`        | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | Firebase の`projectId`         | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      | Firebase の`storageBucket`     | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase の`messagingSenderId` | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_APP_ID`              | Firebase の`appId`             | Production, Preview, Development |
| `NEXT_PUBLIC_GEMINI_API_KEY`               | Gemini API キー                | Production, Preview, Development |

**各変数の追加手順:**

1. 「Add New」をクリック
2. 「Key」に変数名を入力（例: `NEXT_PUBLIC_FIREBASE_API_KEY`）
3. 「Value」に対応する値を貼り付け
4. 環境を選択（通常は「Production」「Preview」「Development」すべてにチェック）
5. 「Save」をクリック

#### 方法 B: Vercel CLI から設定

```bash
# Vercel CLIをインストール（未インストールの場合）
npm i -g vercel

# プロジェクトディレクトリでログイン
vercel login

# 環境変数を設定
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID
vercel env add NEXT_PUBLIC_GEMINI_API_KEY
```

各コマンド実行後、値の入力と環境（Production/Preview/Development）の選択を求められます。

---

## デプロイ設定

### 1. ビルド設定の確認

Vercel プロジェクトの「Settings」→「General」で以下を確認:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build` または `next build --turbopack`
- **Output Directory**: `.next`（デフォルト）
- **Install Command**: `npm install`（デフォルト）
- **Node.js Version**: 20.x 以上を推奨

### 2. 初回デプロイ

環境変数を設定後、以下のいずれかの方法でデプロイ:

#### GitHub からの自動デプロイ

- `main`または`master`ブランチにプッシュすると自動的にデプロイされます
- プルリクエストを作成すると、Preview 環境が自動的に作成されます

#### 手動デプロイ

```bash
# プロジェクトディレクトリで実行
vercel --prod
```

### 3. デプロイの確認

1. Vercel Dashboard の「Deployments」タブでデプロイ状況を確認
2. ビルドログでエラーがないか確認
3. デプロイ完了後、URL にアクセスしてアプリが正しく動作するか確認

---

## トラブルシューティング

### ビルドエラーが発生する

**症状**: ビルド時に環境変数が見つからないエラー

```
Error: Firebase configuration is missing
```

**解決策**:

1. Vercel Dashboard で環境変数が正しく設定されているか確認
2. 環境変数名のスペルミスがないか確認（`NEXT_PUBLIC_`プレフィックスが必要）
3. 環境変数設定後、再デプロイを実行

### Firebase の初期化エラー

**症状**: デプロイ後に Firebase に接続できない

```
Firebase: Error (auth/invalid-api-key)
```

**解決策**:

1. Firebase Console で正しい API キーをコピーしているか確認
2. Vercel の環境変数に正しく設定されているか確認
3. Firebase プロジェクトの「Authentication」が有効化されているか確認

### Gemini API が動作しない

**症状**: AI 機能が使えない

**解決策**:

1. Google AI Studio で API キーが有効化されているか確認
2. API キーに使用制限がかかっていないか確認
3. Gemini API（Generative Language API）が有効化されているか確認
   - [Google Cloud Console](https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com)

### 環境変数が反映されない

**解決策**:

1. 環境変数の変更後は**必ず再デプロイ**が必要
2. Vercel Dashboard の「Deployments」→「Redeploy」をクリック
3. または`main`ブランチに空コミットをプッシュ:
   ```bash
   git commit --allow-empty -m "Trigger redeploy"
   git push origin main
   ```

### CORS エラーが発生する

**症状**: ブラウザコンソールに CORS エラーが表示される

**解決策**:

1. Firebase Console の「Authentication」→「Settings」→「承認済みドメイン」を確認
2. Vercel のデプロイ URL を追加:
   - `your-app.vercel.app`
   - カスタムドメインを使用している場合はそれも追加

---

## ローカル開発環境の設定

Vercel にデプロイする前に、ローカルで動作確認することを推奨します。

1. プロジェクトルートに`.env.local`ファイルを作成:

```bash
cp .env.example .env.local
```

2. `.env.local`に実際の値を設定

3. ローカルサーバーを起動:

```bash
npm run dev
```

4. http://localhost:3000 で動作確認

**注意**: `.env.local`は Git にコミットしないでください（`.gitignore`に含まれています）

---

## セキュリティのベストプラクティス

1. **API キーの管理**

   - Firestore Rules で適切なアクセス制御を設定
   - Firebase Storage Rules で適切なアクセス制御を設定
   - Gemini API キーの使用量を定期的に確認

2. **環境変数の保護**

   - 本番環境の環境変数は限られたチームメンバーのみがアクセスできるように設定
   - API キーが漏洩した場合は即座に無効化し、新しいキーを生成

3. **ドメインの制限**
   - Firebase Console で承認済みドメインのみに制限
   - 不要なドメインは削除

---

## 参考リンク

- [Vercel 環境変数ドキュメント](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js 環境変数ガイド](https://nextjs.org/docs/basic-features/environment-variables)
- [Firebase ウェブアプリ設定](https://firebase.google.com/docs/web/setup)
- [Gemini API ドキュメント](https://ai.google.dev/docs)

---

## チェックリスト

デプロイ前に以下を確認してください:

- [ ] Firebase プロジェクトが作成済み
- [ ] Firebase Authentication が有効化済み
- [ ] Firebase Firestore が有効化済み
- [ ] Firebase Storage が有効化済み
- [ ] Gemini API キーが取得済み
- [ ] Vercel プロジェクトに全ての環境変数が設定済み
- [ ] ローカル環境で動作確認済み
- [ ] `.env.local`が`.gitignore`に含まれている
- [ ] Firebase Rules が適切に設定されている
- [ ] 承認済みドメインに Vercel URL が追加済み

すべてのチェックが完了したら、安心してデプロイできます！🚀
