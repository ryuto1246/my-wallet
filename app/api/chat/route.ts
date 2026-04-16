/**
 * Claude会話分析 APIルート（ストリーミング）
 */

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, transactions = [], monthsContext = 3 } = body;

    // Build context from transactions
    const now = new Date();
    const cutoff = new Date(now.getFullYear(), now.getMonth() - monthsContext + 1, 1);
    const contextTransactions = transactions.filter((t: { date: string | Date }) => {
      const d = new Date(t.date);
      return d >= cutoff;
    });

    const totalIncome = contextTransactions
      .filter((t: { isIncome: boolean }) => t.isIncome)
      .reduce((sum: number, t: { amount: number }) => sum + t.amount, 0);
    const totalExpense = contextTransactions
      .filter((t: { isIncome: boolean }) => !t.isIncome)
      .reduce((sum: number, t: { amount: number }) => sum + t.amount, 0);

    // Build category summary
    const categoryMap = new Map<string, number>();
    contextTransactions
      .filter((t: { isIncome: boolean }) => !t.isIncome)
      .forEach((t: { category: { main: string }; amount: number }) => {
        const key = t.category?.main || 'その他';
        categoryMap.set(key, (categoryMap.get(key) || 0) + t.amount);
      });
    const categorySummary = Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([cat, amt]) => `  - ${cat}: ¥${amt.toLocaleString('ja-JP')}`)
      .join('\n');

    const systemPrompt = `あなたは家計管理のAIアシスタントです。ユーザーの支出データを分析し、改善提案や洞察を提供します。

直近${monthsContext}ヶ月（${cutoff.getFullYear()}年${cutoff.getMonth()+1}月〜現在）のデータ:
- 収入合計: ¥${totalIncome.toLocaleString('ja-JP')}
- 支出合計: ¥${totalExpense.toLocaleString('ja-JP')}
- 収支: ¥${(totalIncome - totalExpense).toLocaleString('ja-JP')}
- 取引件数: ${contextTransactions.length}件

カテゴリ別支出:
${categorySummary || '  （データなし）'}

回答は日本語で、具体的な数字を使って分かりやすく説明してください。
家計改善のアドバイスは実践的で現実的なものにしてください。`;

    const stream = client.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              const data = JSON.stringify({ type: 'text', text: event.delta.text });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: {"type":"done"}\n\n'));
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ error: 'Chat failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
