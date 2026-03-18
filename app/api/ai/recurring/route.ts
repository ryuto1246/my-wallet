/**
 * AI 固定費分析 APIルート
 * 定期支出候補をClaudeが名寄せ・グルーピング・固定費／変動費分類を一括で行う
 */

import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface CandidateExpense {
  description: string;
  category: { main: string; sub: string };
  amounts: number[];
  averageAmount: number;
  months: string[];
  variance: number;
}

interface AIGroup {
  descriptions: string[];   // 元の description（複数マッチ可）
  normalizedName: string;   // 表示用に正規化した名称
  category: string;         // "main/sub" 形式（最適なもの）
  isFixed: boolean;
  reason: string;           // 判定理由
  exclude?: boolean;        // 固定費・変動費のどちらでもない一時的支出の場合 true
}

export async function POST(request: Request) {
  try {
    const { candidates }: { candidates: CandidateExpense[] } = await request.json();

    if (!candidates?.length) return NextResponse.json([]);

    const prompt = `あなたは家計簿の支出分析AIです。以下の支出候補リストを分析し、次の3つのタスクを同時に行ってください。
※ amounts は「各月の合計金額」の配列、avg は「月平均金額」です。

## タスク1: グルーピング（重要）
「同じ消費行動・同じ目的」のものを積極的に1グループにまとめてください。
文字列の類似だけでなく、**行動・目的・場所の種類が同じ**ならまとめます。

グルーピングの基準:
- 表記ゆれ（大文字小文字・略称・ブランド名の差）: "Adobe 月額料金" と "ADOBE 月額料金" → 同一
- 同じ種類の場所: "Cmode飲み物購入" "コカ・コーラ飲料購入" "自販機での飲料購入" "ダイドードリンコ飲料購入" → すべて「自販機」として同一
- コンビニはチェーンが違っても同一グループ: "ファミマ 新宿店" "セブンイレブン 渋谷" "ローソン 池袋" → すべて「コンビニ」として同一
- 同じサービスカテゴリ: "電車（ICカード）" "Suicaチャージ" → 同一

normalizedName は日本語で簡潔に（例: "自販機", "ファミリーマート", "Adobe CC"）

## タスク2: 固定費 / 変動費の判定
**固定費**: 毎月ほぼ同額が自動で発生する契約・サービス料金
- 例: サブスク（Netflix・Spotify・Adobe等）、家賃・管理費、保険料、携帯料金、光熱費、ジム月会費等

**変動費**: 自分の行動によって変わる消費（毎月利用していても変動費）
- 例: コンビニ、自販機、スーパー、飲食店、交通費、ガソリン、美容院、衣料品等

## タスク3: 一時的・偶発的な支出の除外
固定費でも変動費でもない一時的・イベント的な支出は exclude: true にしてください。
- 例: 同窓会参加費、冠婚葬祭、旅行代、年1回の更新料等

## 入力データ
${JSON.stringify(candidates.map(c => ({
  description: c.description,
  category: `${c.category.main}/${c.category.sub}`,
  amounts: c.amounts,
  avg: c.averageAmount,
  months: c.months.length,
})), null, 2)}

## 出力形式
JSON配列のみを返してください（説明文・コードブロック等は不要）:
[
  {
    "descriptions": ["元のdescription1", "元のdescription2"],
    "normalizedName": "正規化した表示名",
    "category": "カテゴリmain/カテゴリsub",
    "isFixed": true,
    "reason": "判定理由（15文字以内）",
    "exclude": false
  }
]

注意: 入力の全descriptionをいずれかのグループのdescriptionsに必ず含めてください。`;

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find(b => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') return fallback(candidates);

    const jsonMatch = textBlock.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return fallback(candidates);

    const groups: AIGroup[] = JSON.parse(jsonMatch[0]);

    // 元のcandidateをdescriptionでマップ
    const candidateMap = new Map(candidates.map(c => [c.description, c]));

    const merged = groups.filter(g => !g.exclude).map(group => {
      // グループに属するcandidateを収集
      const matched = group.descriptions
        .map(d => candidateMap.get(d))
        .filter((c): c is CandidateExpense => c != null);

      if (matched.length === 0) return null;

      // 月ごとに合算してマージ（同月の金額を足し合わせる）
      const monthTotalMap = new Map<string, number>();
      matched.forEach(c => {
        c.months.forEach((m, i) => {
          monthTotalMap.set(m, (monthTotalMap.get(m) ?? 0) + (c.amounts[i] ?? 0));
        });
      });
      const allMonths = Array.from(monthTotalMap.keys()).sort();
      const allAmounts = allMonths.map(m => monthTotalMap.get(m)!);
      const avg = Math.round(allAmounts.reduce((a, b) => a + b, 0) / allAmounts.length);
      const variance = avg > 0
        ? Math.sqrt(allAmounts.reduce((s, a) => s + Math.pow(a - avg, 2), 0) / allAmounts.length) / avg
        : 0;

      // カテゴリはAIが指定したもの優先、なければ最初のcandidateのものを使用
      const [catMain, catSub] = group.category?.split('/') ?? [];
      const category = catMain && catSub
        ? { main: catMain, sub: catSub }
        : matched[0].category;

      return {
        description: group.normalizedName || matched[0].description,
        category,
        amounts: allAmounts,
        averageAmount: avg,
        frequency: allAmounts.length / allMonths.length,
        months: allMonths,
        isFixed: group.isFixed,
        variance,
        aiReason: group.reason,
      };
    }).filter((e): e is NonNullable<typeof e> => e !== null);

    // 平均金額が高い順にソート
    merged.sort((a, b) => b.averageAmount - a.averageAmount);

    return NextResponse.json(merged);
  } catch (error) {
    console.error('AI recurring error:', error);
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: 'RATE_LIMIT_EXCEEDED' }, { status: 429 });
    }
    return NextResponse.json({ error: 'AI analysis failed' }, { status: 500 });
  }
}

function fallback(candidates: CandidateExpense[]) {
  return NextResponse.json(
    candidates.map(c => ({ ...c, isFixed: c.variance < 0.05 }))
  );
}
