/**
 * 日本語フォント（Noto Sans JP）のBase64データ
 * フォントファイルは非常に大きいため、必要な部分のみを埋め込む
 */

// Noto Sans JP Regular のBase64データ（簡易版）
// 実際の運用では、完全なフォントファイルのBase64データを使用してください
// このフォントデータは、CDNから取得するか、またはフォントファイルをBase64エンコードして使用します

// 注意: 実際の本番環境では、フォントファイルをCDNから動的に読み込むか、
// またはフォントファイルをBase64エンコードして埋め込む必要があります

// 一時的な解決策として、フォントを動的に読み込む関数を提供
export async function loadJapaneseFont(): Promise<string | null> {
  try {
    // Noto Sans JP のフォントファイルをCDNから取得
    const fontUrl = 'https://fonts.gstatic.com/s/notosansjp/v52/-F6jfjtqLzI2JPCgQBnw7HFyzSD-PgSgZXkP.woff2';
    
    const response = await fetch(fontUrl);
    if (!response.ok) {
      console.warn('フォントの読み込みに失敗しました。デフォルトフォントを使用します。');
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const base64String = btoa(String.fromCharCode(...uint8Array));
    
    return base64String;
  } catch (error) {
    console.error('フォントの読み込みエラー:', error);
    return null;
  }
}

