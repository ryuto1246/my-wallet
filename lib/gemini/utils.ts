/**
 * Gemini API関連のユーティリティ関数
 */

/**
 * ファイルをBase64に変換
 * @param file ファイル
 * @returns Base64エンコードされた文字列
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Base64文字列から画像パート（Gemini API用）を生成
 * @param file ファイル
 * @returns Gemini API用の画像パート
 */
export async function createImagePart(file: File): Promise<{
  inlineData: {
    data: string;
    mimeType: string;
  };
}> {
  const imageBase64 = await fileToBase64(file);
  return {
    inlineData: {
      data: imageBase64.split(",")[1], // data:image/...の部分を除く
      mimeType: file.type,
    },
  };
}

/**
 * JSON形式のレスポンスを抽出
 * マークダウン形式（```json ... ```）またはプレーンなJSONに対応
 * @param responseText レスポンステキスト
 * @returns 抽出されたJSON文字列（見つからない場合はnull）
 */
export function extractJsonFromResponse(responseText: string): string | null {
  // マークダウン形式のJSONブロック
  const markdownMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
  if (markdownMatch) {
    return markdownMatch[1];
  }

  // プレーンなJSONオブジェクト
  const objectMatch = responseText.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    return objectMatch[0];
  }

  // プレーンなJSON配列
  const arrayMatch = responseText.match(/\[[\s\S]*?\]/);
  if (arrayMatch) {
    return arrayMatch[0];
  }

  return null;
}

