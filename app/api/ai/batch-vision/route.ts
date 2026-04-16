/**
 * 一括画像認識 APIルート（サーバーサイド）
 */

import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import {
  CATEGORY_LIST_PROMPT,
  PAYMENT_SERVICE_HINT_PROMPT,
  STORE_TO_PURPOSE_MAPPING,
  DESCRIPTION_TEMPLATE_BASIC_PROMPT,
  buildServiceHintPrompt,
} from '@/lib/claude/prompts';
import { getPaymentMethodFromService } from '@/lib/helpers/payment';
import type { OCROptions } from '@/types/image-recognition';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function getTodayDateString(): string {
  return new Date().toLocaleDateString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replace(/\//g, '-');
}

function extractJsonFromResponse(text: string): string | null {
  const md = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (md) return md[1];
  const arr = text.match(/\[[\s\S]*\]/);
  if (arr) return arr[0];
  return null;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const optionsStr = formData.get('options') as string | null;

    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const options: OCROptions = optionsStr ? JSON.parse(optionsStr) : {};

    const arrayBuffer = await imageFile.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = imageFile.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

    const serviceHint = buildServiceHintPrompt(options.serviceHint);
    const todayStr = getTodayDateString();

    const prompt = `
**今日の日付は ${todayStr} です。**

この画像は決済アプリの取引リスト（複数の取引が表示されている画面）のスクリーンショットです。
画像から**すべての取引**を抽出し、JSON配列形式で回答してください。${serviceHint}

**【ステップ1】画像から各取引の以下を抽出:**
1. paymentService: olive, smbc_bank, sony, dpayment, dcard, paypay, cash, unknown のいずれか
2. date: 取引日時（ISO 8601形式。読み取れない場合は ${todayStr}）
3. amount: 金額（数値のみ）
4. originalMerchantName: 画像に記載されている元の店舗名（そのまま抽出）
5. confidence: 認識の信頼度（0.0-1.0）

**【ステップ2】店舗名から用途を推測:**
${STORE_TO_PURPOSE_MAPPING}

**【ステップ3】振替の判定:**
- 「引き出し」「振替」「口座間移動」「〇〇カード支払い」等は振替として判定
- 振替の場合 suggestedCategory: { "main": "振替", "sub": "口座間振替" }
- transfer を設定: { from: paymentService, to: 振替先の決済サービス }

**【ステップ4】カテゴリーを選択（振替でない場合）:**
${CATEGORY_LIST_PROMPT}

${PAYMENT_SERVICE_HINT_PROMPT}
${DESCRIPTION_TEMPLATE_BASIC_PROMPT}

回答形式（JSON配列のみ、説明文不要）:
[
  {
    "paymentService": "olive",
    "date": "2025-10-08T14:30:00+09:00",
    "amount": 1500,
    "merchantName": "コンビニ（セブンイレブン）で買い物",
    "originalMerchantName": "セブンイレブン渋谷店",
    "confidence": 0.85,
    "suggestedCategory": { "main": "食費", "sub": "コンビニ" }
  }
]

- 取引が1件もない場合は空配列 [] を返してください
- JSONのみを返してください（説明文不要）`;

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mimeType, data: base64 },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
    });

    const textBlock = response.content.find(b => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') return NextResponse.json([]);

    const jsonText = extractJsonFromResponse(textBlock.text);
    if (!jsonText) return NextResponse.json([]);

    const parsedArray = JSON.parse(jsonText);
    if (!Array.isArray(parsedArray)) return NextResponse.json([]);

    const transactions = parsedArray.map((item: Record<string, unknown>) => ({
      paymentService: item.paymentService || 'unknown',
      date: item.date ? new Date(item.date as string) : null,
      amount: item.amount !== undefined ? item.amount : null,
      merchantName: item.merchantName || null,
      originalMerchantName: item.originalMerchantName || null,
      suggestedCategory: item.suggestedCategory,
      confidence: (item.confidence as number) || 0.5,
      rawData: {
        fullText: textBlock.text,
        rawResponse: JSON.stringify(item),
        confidence: (item.confidence as number) || 0.5,
      },
      metadata: item.metadata,
      transfer: item.transfer
        ? {
            from: getPaymentMethodFromService((item.transfer as { from: string; to: string }).from),
            to: getPaymentMethodFromService((item.transfer as { from: string; to: string }).to),
          }
        : undefined,
    }));

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Batch vision API error:', error);
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: 'RATE_LIMIT_EXCEEDED' }, { status: 429 });
    }
    return NextResponse.json({ error: '画像から取引情報を認識できませんでした' }, { status: 500 });
  }
}
