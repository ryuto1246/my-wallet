/**
 * CSVファイルからFirestoreにトランザクションをインポートするスクリプト
 * 
 * 使い方:
 * npm run import-csv -- <UID> <CSVファイルパス>
 * または
 * npx tsx scripts/import-csv.ts <UID> <CSVファイルパス>
 * 
 * 注意: このスクリプトはFirebase Admin SDKを使用します。
 * サービスアカウントキーが必要です。
 */

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// 環境変数の読み込み
config({ path: path.resolve(process.cwd(), '.env.local') });

// サービスアカウントキーのパス
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH || 
  path.resolve(process.cwd(), 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`サービスアカウントキーが見つかりません: ${serviceAccountPath}`);
  console.error('Firebase Consoleからサービスアカウントキーをダウンロードして配置してください。');
  process.exit(1);
}

const serviceAccount = JSON.parse(
  fs.readFileSync(serviceAccountPath, 'utf8')
);

// Firebase Admin初期化
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

const db = admin.firestore();

// 支払い手段のマッピング
const PAYMENT_METHOD_MAP: Record<string, string> = {
  '現金': 'cash',
  'ソニー銀行': 'sony_bank',
  '三井住友カード': 'olive',      // クレジットカード
  '三井住友銀行': 'smbc_bank',    // 銀行口座
  'OLIVE': 'olive',
  'paypay': 'paypay',
  'PayPay': 'paypay',
  'd払い': 'd_payment',
  'dカード': 'd_card',
};

// カテゴリーのマッピング（CSVのカテゴリーから main/sub に変換）
const CATEGORY_MAP: Record<string, { main: string; sub: string }> = {
  '収入/アルバイト': { main: '収入', sub: 'アルバイト・給与' },
  '収入/お小遣い': { main: '収入', sub: 'お小遣い・援助' },
  '収入/立替金回収': { main: '収入', sub: '立替金回収' },
  '収入/その他': { main: '収入', sub: 'その他' },
  '食費/自炊': { main: '食費', sub: '自炊（食材購入）' },
  '食費/外食': { main: '食費', sub: 'コンビニ' }, // デフォルト
  '食費/学食': { main: '食費', sub: '学食' },
  '食費/飲み会': { main: '食費', sub: '飲み会・宅飲み' },
  '食費/家族': { main: '食費', sub: '自炊（食材購入）' },
  '交通費/電車バス': { main: '交通費', sub: '電車・バス（定期外）' },
  '交通費/特急': { main: '交通費', sub: '新幹線・特急' },
  '交通費/タクシー': { main: '交通費', sub: 'タクシー・代行' },
  '交通費/車': { main: '交通費', sub: '車（ガソリン・駐車場）' },
  '交通費/その他': { main: '交通費', sub: 'その他' },
  '生活/日用品': { main: '日用品・生活費', sub: '日用品・消耗品' },
  '生活/衣料品': { main: '衣料・美容', sub: '衣類' },
  '生活/美容': { main: '衣料・美容', sub: '理美容（カット・カラー）' },
  '生活/医療': { main: '健康・医療', sub: '病院・診療' },
  '生活/犬': { main: 'ペット', sub: 'ペット用品' },
  '生活/その他': { main: '日用品・生活費', sub: 'その他' },
  '生活費/通信': { main: '通信・サブスク', sub: '携帯電話' },
  '学業教養/文房具': { main: '教育・教養', sub: '文房具' },
  '学業教養/ソフトウェア': { main: '教育・教養', sub: 'ソフトウェア・ツール' },
  '学業教養/学費': { main: '教育・教養', sub: '学費・授業料' },
  '学業教養/教科書': { main: '教育・教養', sub: '教科書・参考書' },
  '学業教養/書籍': { main: '教育・教養', sub: '書籍・雑誌' },
  '学業教養/音楽': { main: '教育・教養', sub: 'その他' },
  '学業教養/資格': { main: '教育・教養', sub: '資格・検定' },
  '学業教養/その他': { main: '教育・教養', sub: 'その他' },
  '娯楽/娯楽': { main: '趣味・娯楽', sub: 'その他' },
  '娯楽/交際': { main: '交際費', sub: 'プレゼント' },
  '娯楽/団体費': { main: '交際費', sub: '会費・団体費' },
  '娯楽/その他': { main: '趣味・娯楽', sub: 'その他' },
  '仕事/Nectere': { main: '仕事関連', sub: 'その他' },
  '仕事/RADICA': { main: '仕事関連', sub: 'その他' },
  'その他/手数料': { main: 'その他', sub: '手数料' },
  'その他/立替': { main: 'その他', sub: '立替' },
  'その他/借金返済': { main: 'その他', sub: '返済' },
  'その他/その他': { main: 'その他', sub: 'その他' },
};

// 立替区分のマッピング
const ADVANCE_TYPE_MAP: Record<string, string> = {
  '親': 'parent',
  '友人': 'friend',
  'Nectere': 'work',
  '東大吹部': 'work',
};

interface CSVRow {
  日付: string;
  取引コード: string;
  振替先コード: string;
  カテゴリーコード: string;
  金額: string;
  メモ: string;
  カテゴリー: string;
  取引種類: string;
  支払い手段: string;
  立替区分: string;
  振替先: string;
}

/**
 * CSVファイルを読み込んでパース
 */
function parseCSV(filePath: string): CSVRow[] {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const lines = fileContent.split('\n').filter(line => line.trim());
  
  // ヘッダー行を取得（最初の3行を結合）
  const headers = ['日付', '取引コード', '振替先コード', 'カテゴリーコード', '金額', 'メモ', 'カテゴリー', '取引種類', '支払い手段', '立替区分', '振替先'];
  
  const rows: CSVRow[] = [];
  
  // データ行をパース（4行目から）
  for (let i = 3; i < lines.length; i++) {
    const line = lines[i];
    const values = parseCSVLine(line);
    
    if (values.length >= 11 && values[0]) {
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row as unknown as CSVRow);
    }
  }
  
  return rows;
}

/**
 * CSV行をパース（カンマ区切り、クォート対応）
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * 金額文字列をパース（¥や,を除去）
 */
function parseAmount(amountStr: string): number {
  const cleaned = amountStr.replace(/[¥,]/g, '').replace(/-/g, '');
  return parseInt(cleaned, 10) || 0;
}

/**
 * 日付をパース
 */
function parseDate(dateStr: string): Date {
  const [month, day] = dateStr.split('/').map(n => parseInt(n, 10));
  
  // 10月以降は2024年、それ以前は2025年と仮定
  const actualYear = month >= 10 ? 2024 : 2025;
  
  return new Date(actualYear, month - 1, day);
}

/**
 * 支払い手段を正規化
 */
function normalizePaymentMethod(method: string): string {
  return PAYMENT_METHOD_MAP[method] || 'other';
}

/**
 * カテゴリーを正規化
 */
function normalizeCategory(categoryStr: string): { main: string; sub: string } {
  const mapped = CATEGORY_MAP[categoryStr];
  if (mapped) {
    return mapped;
  }
  
  // マッピングにない場合は「その他」
  return { main: 'その他', sub: 'その他' };
}

/**
 * CSVをFirestoreにインポート
 */
async function importCSV(userId: string, csvPath: string) {
  console.log(`CSVファイルを読み込み中: ${csvPath}`);
  const rows = parseCSV(csvPath);
  console.log(`${rows.length}件のレコードを読み込みました`);
  
  let importedCount = 0;
  let skippedCount = 0;
  
  for (const row of rows) {
    try {
      // 残高確認はスキップ
      if (row.取引種類 === '残高確認') {
        skippedCount++;
        continue;
      }
      
      // 取引種類の判定
      const isIncome = row.取引種類 === '収入';
      const isTransfer = row.取引種類 === '振替';
      
      // カテゴリー
      const category = normalizeCategory(row.カテゴリー);
      
      // 金額
      const amount = parseAmount(row.金額);
      if (amount === 0) {
        skippedCount++;
        continue;
      }
      
      // 日付
      const date = parseDate(row.日付);
      
      // 支払い手段
      const paymentMethod = normalizePaymentMethod(row.支払い手段);
      
      // トランザクションデータ
      const transactionData: Record<string, unknown> = {
        userId,
        date: admin.firestore.Timestamp.fromDate(date),
        amount,
        category,
        description: row.メモ || '',
        paymentMethod,
        isIncome,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      };
      
      // 振替情報
      if (isTransfer && row.振替先) {
        transactionData.transfer = {
          from: paymentMethod,
          to: normalizePaymentMethod(row.振替先),
        };
      }
      
      // 立替情報
      if (row.立替区分) {
        // 支出の立替（誰かのために立て替えた）
        const advanceType = ADVANCE_TYPE_MAP[row.立替区分] || 'other';
        transactionData.advance = {
          isPaid: false,           // 未回収
          advancedFor: advanceType,
          note: row.立替区分,
        };
      } else if (isIncome && category.main === '収入' && category.sub === '立替金回収') {
        // 収入の立替金回収
        transactionData.advance = {
          isPaid: true,            // 回収済み
          advancedFor: 'other',    // 回収元は不明
          note: '立替金回収',
        };
      }
      
      // Firestoreに追加
      await db.collection('transactions').add(transactionData);
      importedCount++;
      
      if (importedCount % 50 === 0) {
        console.log(`${importedCount}件インポート済み...`);
      }
    } catch (error) {
      console.error(`行のインポートエラー:`, row, error);
    }
  }
  
  console.log(`\n完了!`);
  console.log(`インポート: ${importedCount}件`);
  console.log(`スキップ: ${skippedCount}件`);
}

// メイン処理
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('使い方: npx tsx scripts/import-csv.ts <UID> <CSVファイルパス>');
    process.exit(1);
  }
  
  const userId = args[0];
  const csvPath = args[1];
  
  if (!fs.existsSync(csvPath)) {
    console.error(`CSVファイルが見つかりません: ${csvPath}`);
    process.exit(1);
  }
  
  console.log(`ユーザーID: ${userId}`);
  console.log(`CSVファイル: ${csvPath}`);
  console.log('');
  
  await importCSV(userId, csvPath);
  
  process.exit(0);
}

main().catch(console.error);

