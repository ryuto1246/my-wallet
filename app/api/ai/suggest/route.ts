/**
 * AI サジェスチョン APIルート（サーバーサイド）
 */

import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { CATEGORIES } from '@/constants/categories';
import {
  STORE_TO_PURPOSE_MAPPING,
  DESCRIPTION_TEMPLATE_BASIC_PROMPT,
} from '@/lib/claude/prompts';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { inputText, context } = body;

    if (!inputText?.trim()) {
      return NextResponse.json([]);
    }

    const categoryList = CATEGORIES
      .map(cat => `- ${cat.isIncome ? '【収入】' : '【支出】'}${cat.main}: ${cat.subs.join(', ')}`)
      .join('\n');

    const contextInfo = context ? `
コンテキスト情報:
- 金額: ${context.amount ? `${context.amount}円` : '不明'}
- 決済方法: ${context.paymentMethod || '不明'}
- 時間帯: ${context.timeOfDay || '不明'}
- 曜日: ${context.dayOfWeek || '不明'}
` : '';

    const priorHintsSection = context?.priorHints
      ? `
【ユーザー履歴ヒント（JSON）】
- topCandidates（最大3件、weightは0-1）:
${JSON.stringify(
  (context.priorHints.topCandidates || []).slice(0, 3).map((c: { description?: string; category?: { main: string; sub: string }; weight?: number }) => ({
    desc: c.description?.slice(0, 30) || '',
    main: c.category?.main || '',
    sub: c.category?.sub || '',
    w: Math.max(0, Math.min(1, Number.isFinite(c.weight as number) ? (c.weight as number) : 0)),
  })),
  null,
  2
)}
- aidPrior:
${JSON.stringify(context.priorHints.aidPrior || { friend: 0, parent: 0, none: 1 }, null, 2)}
→ 可能なら上位候補を優先。ヒントと矛盾する場合はもっとも尤もらしい案を選択。
`
      : '';

    const prompt = `あなたは家計簿アプリのAIアシスタントです。ユーザーの入力から、適切なカテゴリーと具体的な項目名を1〜5パターン提案してください（最も可能性が高いものから順に、目安は3パターン）。

入力テキスト: "${inputText}"
${contextInfo}
${priorHintsSection}

**【ステップ1】店舗名・サービス名を特定**
${STORE_TO_PURPOSE_MAPPING}

**【ステップ2】カテゴリーを選択（以下から完全一致で選択）**
${categoryList}

**【ステップ3】項目名を生成**
${DESCRIPTION_TEMPLATE_BASIC_PROMPT}

以下のJSON形式で提案を配列で回答してください（JSON以外の文字は含めないでください）:
[
  {
    "isIncome": false,
    "mainCategory": "メインカテゴリー名",
    "subCategory": "サブカテゴリー名",
    "description": "わかりやすい項目名（20文字以内）",
    "confidence": 0.85,
    "hasAdvance": false,
    "advanceType": null,
    "advanceRatio": 0
  }
]

**厳守事項:**
1. isIncomeでそれが収入(true)か支出(false)かを判定
2. mainCategoryとsubCategoryは必ず上記のカテゴリーリストから完全一致で選択すること
3. 収入の場合はmainCategoryを「収入」にすること
4. descriptionは必ず店舗名マッピングとテンプレート原則に従って生成（「??」は使用禁止）
5. confidenceは0-1の数値（確実なら0.85以上）
6. 提案は確信度が高い順に並べる
7. hasAdvanceは立替がある場合にtrue
8. advanceTypeは立替相手の名前（自由記述）、立替がない場合はnull
9. advanceRatioは立替金額の割合（0-1）`;

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find(b => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') return NextResponse.json([]);

    const jsonMatch = textBlock.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return NextResponse.json([]);

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return NextResponse.json([]);

    const suggestions = parsed
      .filter((p: { mainCategory?: string; subCategory?: string; description?: string; isIncome?: boolean }) => p.mainCategory && p.subCategory && p.description && typeof p.isIncome === 'boolean')
      .map((p: { mainCategory: string; subCategory: string; description: string; isIncome: boolean; confidence?: number; hasAdvance?: boolean; advanceType?: string | null; advanceRatio?: number }) => {
        const categoryExists = CATEGORIES.find(
          cat => cat.main === p.mainCategory && cat.isIncome === p.isIncome
        );

        let mainCategory = p.mainCategory;
        let subCategory = p.subCategory;

        if (!categoryExists) {
          mainCategory = 'その他';
          subCategory = 'その他';
        } else {
          const subExists = categoryExists.subs.includes(p.subCategory);
          if (!subExists) {
            subCategory = categoryExists.subs.includes('その他')
              ? 'その他'
              : categoryExists.subs[0] || 'その他';
          }
        }

        return {
          category: { main: mainCategory, sub: subCategory },
          description: p.description,
          isIncome: p.isIncome,
          confidence: p.confidence || 0.5,
          hasAdvance: p.hasAdvance || false,
          advanceType: p.advanceType || null,
          advanceAmount: p.advanceRatio || 0,
        };
      })
      .slice(0, 5);

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('AI suggest error:', error);
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: 'RATE_LIMIT_EXCEEDED' }, { status: 429 });
    }
    return NextResponse.json({ error: 'AI suggestion failed' }, { status: 500 });
  }
}
