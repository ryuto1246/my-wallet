/**
 * Claude AI関連のユーティリティ関数
 */

/**
 * ファイルをBase64に変換
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
 * JSON形式のレスポンスを抽出
 * マークダウン形式（```json ... ```）またはプレーンなJSONに対応
 */
export function extractJsonFromResponse(responseText: string): string | null {
  const markdownMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
  if (markdownMatch) return markdownMatch[1];

  const objectMatch = responseText.match(/\{[\s\S]*\}/);
  if (objectMatch) return objectMatch[0];

  const arrayMatch = responseText.match(/\[[\s\S]*?\]/);
  if (arrayMatch) return arrayMatch[0];

  return null;
}
