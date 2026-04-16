/**
 * 画像認識 APIルート（サーバーサイド）
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
  const obj = text.match(/\{[\s\S]*\}/);
  if (obj) return obj[0];
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

    // Convert file to base64
    const arrayBuffer = await imageFile.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = imageFile.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

    const serviceHint = buildServiceHintPrompt(options.serviceHint);
    const todayStr = getTodayDateString();

    const prompt = `
**今日の日付は ${todayStr} です。**

この画像は決済アプリのスクリーンショットです。取引情報を抽出してJSON形式で回答してください。${serviceHint}

**【ステップ1】画像から以下を抽出:**
1. paymentService: 決済サービスの種類（olive, smbc_bank, sony, dpayment, dcard, paypay, cash, unknown のいずれか）
2. date: 取引日時（ISO 8601形式。画像から読み取れない場合は ${todayStr} を使用）
3. amount: 金額（数値のみ）
4. merchantName: 店舗名・サービス名（用途を推測して具体的に記述）
5. confidence: 認識の信頼度（0.0-1.0）

**【ステップ2】店舗名から用途を推測:**
${STORE_TO_PURPOSE_MAPPING}

**【ステップ3】カテゴリーを選択:**
${CATEGORY_LIST_PROMPT}

${PAYMENT_SERVICE_HINT_PROMPT}
${DESCRIPTION_TEMPLATE_BASIC_PROMPT}

回答形式（JSONのみ、説明文不要）:
{
  "paymentService": "olive",
  "date": "2025-10-08T14:30:00+09:00",
  "amount": 1500,
  "merchantName": "コンビニ（セブンイレブン）で買い物",
  "confidence": 0.85,
  "suggestedCategory": { "main": "食費", "sub": "コンビニ" }
}`;

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
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
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    const jsonText = extractJsonFromResponse(textBlock.text);
    if (!jsonText) throw new Error('No JSON in response');

    const parsed = JSON.parse(jsonText);
    if (parsed.date) parsed.date = new Date(parsed.date);

    return NextResponse.json({
      paymentService: parsed.paymentService || 'unknown',
      date: parsed.date || null,
      amount: parsed.amount || null,
      merchantName: parsed.merchantName || null,
      suggestedCategory: parsed.suggestedCategory,
      confidence: parsed.confidence || 0.5,
      rawData: {
        fullText: textBlock.text,
        rawResponse: JSON.stringify(response),
        confidence: parsed.confidence || 0.5,
      },
      metadata: parsed.metadata,
    });
  } catch (error) {
    console.error('Vision API error:', error);
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: 'RATE_LIMIT_EXCEEDED' }, { status: 429 });
    }
    return NextResponse.json({ error: '画像から取引情報を認識できませんでした' }, { status: 500 });
  }
}
