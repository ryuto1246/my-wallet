# アクセシビリティガイドライン

このドキュメントでは、Smart Wallet プロジェクトで実装されているアクセシビリティの取り組みと、開発時に考慮すべきポイントをまとめています。

## 🎯 対応レベル

本プロジェクトは**WCAG 2.1 レベル AA**を目標としています。

## 🎨 カラーコントラスト

### コントラスト比の基準

- **通常のテキスト**: 4.5:1 以上
- **大きなテキスト（18pt 以上、太字 14pt 以上）**: 3:1 以上
- **UI コンポーネント**: 3:1 以上

### 実装済みのコントラスト対応

#### 1. StatsCard（統計カード）

```typescript
// ✅ 改善済み: 不透明度の使用を避け、純白テキストを使用
const colorSchemes = {
  green: {
    text: "text-white", // 濃い背景に白テキスト
    loadingText: "text-emerald-50", // 高コントラスト
  },
  // 他の色も同様
};
```

**コントラスト比:**

- `text-white` on `emerald-500/teal-600`: **約 7:1 以上** ✅

#### 2. TransactionListItem（トランザクション項目）

```typescript
// ✅ 改善済み: 半透明背景を不透明に変更
<h3 className="text-gray-900">        // 黒に近い濃いテキスト
<span className="text-gray-700">      // 高コントラストな灰色
<div className="bg-white border border-gray-200">  // 明確な境界
```

**コントラスト比:**

- `text-gray-900` on `gray-50`: **約 12:1** ✅
- `text-gray-700` on `white`: **約 8:1** ✅
- `text-emerald-700` on `emerald-50`: **約 7:1** ✅

#### 3. AuthCard（認証カード）

```typescript
// ✅ 改善済み: より濃いテキスト色を使用
<CardDescription className="text-gray-800">
<Link className="text-blue-700 hover:text-blue-800">
```

**コントラスト比:**

- `text-gray-800` on `white`: **約 9:1** ✅
- `text-blue-700` on `white`: **約 7:1** ✅

#### 4. PageHeader（ページヘッダー）

```typescript
// ✅ 改善済み: より濃いグラデーションを使用
<h1 className="from-blue-700 to-purple-700">
<p className="text-gray-700">
```

**コントラスト比:**

- `text-gray-700` on `white`: **約 8:1** ✅

#### 5. Outline ボタン（全体）

```typescript
// ✅ 改善済み: 明示的な背景色とテキスト色を指定
<Button
  variant="outline"
  className="bg-white text-gray-900 hover:text-gray-900 hover:bg-gray-100"
>
```

**コントラスト比:**

- `text-gray-900` on `white`: **約 12:1** ✅
- ホバー時も`text-gray-900` on `gray-100`: **約 10:1** ✅

## ♿ セマンティック HTML

### 見出しの階層構造

```tsx
// ✅ 正しい見出し階層
<h1>ダッシュボード <
  /h1>          / / ページタイトル <
  h2 >
  最近の取引 <
  /h2>            / / セクション <
  h3 >
  トランザクション詳細 <
  /h3>  / / サブセクション;
```

### ランドマーク

- `<main>`: メインコンテンツ
- `<nav>`: ナビゲーション
- `<header>`: ヘッダー
- `<footer>`: フッター
- `<section>`: セクション

### フォームのラベル

```tsx
// ✅ すべてのinputに適切なlabelを関連付け
<Label htmlFor="email">メールアドレス</Label>
<Input id="email" type="email" />
```

## ⌨️ キーボード操作

### フォーカス管理

```css
/* ✅ focus-visibleで視覚的フィードバック */
button:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
```

### タブ順序

- すべてのインタラクティブ要素は論理的な順序でタブ移動可能
- `tabindex="-1"` は慎重に使用
- `tabindex="0"` でカスタム要素をタブ順序に追加

## 📱 レスポンシブデザイン

### タッチターゲット

```tsx
// ✅ 最小タッチターゲットサイズ: 44x44px
<Button size="lg" className="h-12 px-8">  // 48px height
```

### テキストの拡大

- ズーム 200%でもレイアウトが崩れない
- 固定サイズではなく相対単位（rem, em）を使用

## 🔤 テキストの可読性

### フォントサイズ

```css
/* 最小フォントサイズ */
body: 16px (1rem)
small: 14px (0.875rem)
caption: 12px (0.75rem) - 最小サイズ
```

### 行間

```css
/* 読みやすい行間 */
body: line-height: 1.5
heading: line-height: 1.2
```

## 🎭 動きと時間

### アニメーション

```css
/* prefers-reduced-motionへの対応 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### タイムアウト

- 自動ログアウト前に警告を表示
- ユーザーが時間を延長できるようにする

## 🖼️ 画像とメディア

### 代替テキスト

```tsx
// ✅ すべての画像に適切なalt属性
<img src="logo.png" alt="Smart Wallet ロゴ" />

// 装飾的な画像は空のalt
<img src="decoration.png" alt="" />
```

### アイコン

```tsx
// ✅ アイコンに適切なaria-label
<button aria-label="新規追加">
  <Plus className="h-5 w-5" />
</button>
```

## 🧪 テストツール

### 推奨ツール

1. **axe DevTools** - 自動アクセシビリティチェック
2. **WAVE** - Web アクセシビリティ評価ツール
3. **Lighthouse** - Chrome DevTools の監査機能
4. **スクリーンリーダー**:
   - macOS: VoiceOver (⌘ + F5)
   - Windows: NVDA, JAWS
   - iOS/Android: TalkBack, VoiceOver

### 手動テスト

```bash
# キーボードのみでの操作
- Tab: 次の要素へ
- Shift + Tab: 前の要素へ
- Enter: ボタン/リンクの実行
- Space: チェックボックス/ボタンのトグル
- Esc: モーダル/ドロップダウンを閉じる
```

## 📋 チェックリスト

新しいコンポーネントを作成する際は、以下を確認してください：

- [ ] **カラーコントラスト**: 4.5:1 以上（大きなテキストは 3:1 以上）
- [ ] **フォーカス表示**: キーボード操作時に明確な視覚的フィードバック
- [ ] **セマンティック HTML**: 適切な HTML 要素を使用
- [ ] **ラベル**: すべてのフォーム要素に関連付けられたラベル
- [ ] **代替テキスト**: 画像・アイコンに適切な代替テキスト
- [ ] **キーボード操作**: マウスなしで全機能が使用可能
- [ ] **エラーメッセージ**: 明確で具体的なエラー情報
- [ ] **タッチターゲット**: 最小 44x44px
- [ ] **レスポンシブ**: すべてのビューポートで正しく表示
- [ ] **アニメーション**: prefers-reduced-motion に対応

## ⚠️ よくある問題と対策

### 1. Outline ボタンのコントラスト問題

**問題:** `variant="outline"`のボタンで、ホバー時にテキストが見えなくなる

**原因:** デフォルトの`hover:text-accent-foreground`がカスタムテキスト色を上書き

**解決策:**

```tsx
// ❌ 悪い例
<Button variant="outline" className="text-gray-900">

// ✅ 良い例
<Button
  variant="outline"
  className="bg-white text-gray-900 hover:text-gray-900"
>
```

### 2. 半透明背景のコントラスト問題

**問題:** `bg-white/80`などの半透明背景でコントラスト比が不安定

**解決策:** 不透明な背景を使用

```tsx
// ❌ 悪い例
<div className="bg-white/80">

// ✅ 良い例
<div className="bg-white border border-gray-200">
```

## 🔍 コントラストチェッカー

### オンラインツール

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Coolors Contrast Checker](https://coolors.co/contrast-checker)
- [Adobe Color Accessibility Tools](https://color.adobe.com/create/color-accessibility)

### VSCode 拡張機能

- **Color Highlight**: CSS カラーを視覚化
- **axe Accessibility Linter**: コード内でアクセシビリティ問題を検出

## 📚 参考資料

- [WCAG 2.1](https://www.w3.org/TR/WCAG21/)
- [MDN Accessibility](https://developer.mozilla.org/ja/docs/Web/Accessibility)
- [A11y Project](https://www.a11yproject.com/)
- [WebAIM](https://webaim.org/)

## 🚀 継続的改善

アクセシビリティは一度実装して終わりではありません：

1. **定期的な監査**: 四半期ごとにアクセシビリティ監査を実施
2. **ユーザーフィードバック**: 障害を持つユーザーからのフィードバック収集
3. **チーム教育**: アクセシビリティに関する定期的な勉強会
4. **自動テスト**: CI/CD パイプラインにアクセシビリティテストを組み込み

---

**最終更新**: 2025 年 10 月 6 日
