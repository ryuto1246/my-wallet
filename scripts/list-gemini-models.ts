/**
 * Gemini API で利用可能なモデル一覧を表示するスクリプト
 *
 * 使い方:
 * npx tsx scripts/list-gemini-models.ts
 *
 * .env.local の NEXT_PUBLIC_GEMINI_API_KEY を使用します。
 * generateContent をサポートするモデルだけを表示します。
 */

import * as path from 'path';
import { config } from 'dotenv';

config({ path: path.resolve(process.cwd(), '.env.local') });

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
if (!apiKey) {
  console.error('NEXT_PUBLIC_GEMINI_API_KEY が設定されていません。');
  process.exit(1);
}

async function listModels(apiVersion: 'v1' | 'v1beta') {
  const url = `https://generativelanguage.googleapis.com/${apiVersion}/models?key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`${apiVersion}: ${res.status} ${await res.text()}`);
    return [];
  }
  const data = (await res.json()) as { models?: { name: string; supportedGenerationMethods?: string[] }[] };
  return data.models ?? [];
}

async function main() {
  console.log('Gemini API 利用可能モデル（generateContent 対応のみ表示）\n');

  for (const ver of ['v1', 'v1beta'] as const) {
    const models = await listModels(ver);
    const forGenerate = models.filter(
      (m) =>
        m.supportedGenerationMethods?.includes('generateContent') ?? false
    );
    console.log(`--- ${ver} ---`);
    if (forGenerate.length === 0) {
      console.log('  (該当なし)\n');
      continue;
    }
    for (const m of forGenerate) {
      const name = m.name.replace('models/', '');
      console.log(`  ${name}`);
    }
    console.log('');
  }

  console.log('config で使う場合はモデル名のみ指定（例: gemini-1.5-flash）');
  console.log('環境変数: NEXT_PUBLIC_GEMINI_MODEL=モデル名');
}

main().catch(console.error);
