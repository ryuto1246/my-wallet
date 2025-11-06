/**
 * PDF生成関連のユーティリティ関数
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * 日本語フォントを登録する
 * Noto Sans JP Variable Fontを読み込んで登録
 * ローカルファイル（public/fonts/NotoSansJP-VariableFont_wght.ttf）を使用
 */
async function registerJapaneseFont(doc: jsPDF): Promise<boolean> {
  try {
    // ローカルファイルから読み込む（Next.jsのpublicフォルダは/でアクセス可能）
    const fontUrl = '/fonts/NotoSansJP-VariableFont_wght.ttf';
    
    const response = await fetch(fontUrl, {
      mode: 'same-origin',
      cache: 'default',
    });
    
    if (!response.ok || response.status !== 200) {
      console.warn('フォントファイルの読み込みに失敗しました。デフォルトフォントを使用します。');
      return false;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // ファイルサイズの確認（10MB以上はスキップ）
    if (uint8Array.length > 10 * 1024 * 1024) {
      console.warn('フォントファイルが大きすぎます。');
      return false;
    }
    
    // Base64エンコード（大きなファイルを安全に処理するため、チャンクごとに処理）
    let binaryString = '';
    const chunkSize = 0x8000; // 32KB chunks
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      for (let j = 0; j < chunk.length; j++) {
        binaryString += String.fromCharCode(chunk[j]);
      }
    }
    
    const base64String = btoa(binaryString);
    
    // フォントを登録
    const fontFileName = 'NotoSansJP-VariableFont_wght.ttf';
    try {
      // VFSにファイルを追加
      doc.addFileToVFS(fontFileName, base64String);
      
      // フォントを登録（normalスタイル）
      doc.addFont(fontFileName, 'NotoSansJP', 'normal');
      
      // フォントが正しく登録されたか確認
      const fonts = doc.getFontList();
      const fontKeys = Object.keys(fonts);
      const isRegistered = fontKeys.some(
        (key) => key.toLowerCase() === 'notosansjp' || key === 'NotoSansJP'
      );
      
      if (!isRegistered) {
        console.warn('フォントの登録に失敗しました。登録済みフォント:', fontKeys);
        return false;
      }
      
      console.log('日本語フォントが正常に登録されました');
      
      // boldスタイルも登録（Variable Fontは重みを調整可能だが、jsPDFでは別スタイルとして登録）
      try {
        doc.addFont(fontFileName, 'NotoSansJP', 'bold');
      } catch {
        // boldの登録に失敗しても、normalフォントは使用可能
        console.warn('Boldフォントの登録に失敗しましたが、normalフォントは使用可能です。');
      }
      
      return true;
    } catch (fontError) {
      console.error('フォント登録中にエラーが発生しました:', fontError);
      return false;
    }
  } catch (error) {
    console.error('フォント登録エラー:', error);
    return false;
  }
}

/**
 * 親立替請求PDFを生成
 * @param transactions 親立替を含む取引一覧
 * @param year 年
 * @param month 月（0-11）
 */
export async function generateParentAdvanceInvoicePDF(
  transactions: Array<{
    date: Date;
    description: string;
    amount: number;
    advanceAmount: number;
    memo?: string;
  }>,
  year: number,
  month: number
): Promise<void> {
  const doc = new jsPDF();
  
  // 日本語フォントを登録
  const fontRegistered = await registerJapaneseFont(doc);
  
  // 月の名前を日本語で取得
  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];
  const monthName = monthNames[month];
  
  // フォントを設定（登録できた場合は日本語フォントを使用）
  // フォントが使用可能かテストしてから使用
  let canUseJapaneseFont = false;
  if (fontRegistered) {
    try {
      doc.setFont('NotoSansJP', 'normal');
      doc.setFontSize(10);
      // テストテキストを表示してフォントが動作するか確認
      const testWidth = doc.getTextWidth('テスト');
      if (testWidth > 0) {
        canUseJapaneseFont = true;
      }
    } catch (error) {
      console.warn('日本語フォントの使用に失敗しました。デフォルトフォントを使用します。', error);
      canUseJapaneseFont = false;
    }
  }
  
  // タイトル
  doc.setFontSize(20);
  if (canUseJapaneseFont) {
    doc.setFont('NotoSansJP', 'normal');
  } else {
    doc.setFont('helvetica', 'normal');
  }
  
  try {
    doc.text(`${year}年${monthName} 親立替請求書`, 105, 20, { align: 'center' });
  } catch (error) {
    // フォントエラーが発生した場合はデフォルトフォントで再試行
    console.warn('日本語フォントでテキスト表示に失敗。デフォルトフォントで再試行:', error);
    doc.setFont('helvetica', 'normal');
    doc.text(`${year}年${monthName} 親立替請求書`, 105, 20, { align: 'center' });
    canUseJapaneseFont = false;
  }
  
  // 感謝メッセージ
  doc.setFontSize(12);
  if (canUseJapaneseFont) {
    doc.setFont('NotoSansJP', 'normal');
  } else {
    doc.setFont('helvetica', 'normal');
  }
  
  try {
    doc.text('いつもお世話になっております。', 20, 35);
    doc.text('ご確認のほど、よろしくお願いいたします。', 20, 49);
  } catch (error) {
    console.warn('日本語テキストの表示にエラーが発生しました:', error);
    // エラーが発生しても続行
  }
  
  // 空行
  const yPos = 60;
  
  // テーブル用のデータを準備
  const tableData = transactions.map((tx, index) => [
    (index + 1).toString(),
    `${month + 1}/${tx.date.getDate()}`,
    tx.description,
    tx.advanceAmount.toLocaleString('ja-JP'),
    tx.memo || '-'
  ]);
  
  // 合計金額を計算
  const totalAmount = transactions.reduce((sum, tx) => sum + tx.advanceAmount, 0);
  
  // テーブルを追加
  // ページ幅に収まるようにカラム幅を調整（A4用紙: 210mm = 約210ポイント）
  autoTable(doc, {
    head: [['No.', '日付', '内容', '金額', '備考']],
    body: tableData,
    startY: yPos,
    styles: {
      fontSize: 9,
      cellPadding: 2,
      halign: 'left',
      font: canUseJapaneseFont ? 'NotoSansJP' : 'helvetica',
      overflow: 'linebreak',
      cellWidth: 'wrap',
    },
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      font: canUseJapaneseFont ? 'NotoSansJP' : 'helvetica',
      fontSize: 9,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { halign: 'center', cellWidth: 22 },
      2: { halign: 'left', cellWidth: 65 },
      3: { halign: 'right', cellWidth: 30 },
      4: { halign: 'left', cellWidth: 35 },
    },
    margin: { left: 20, right: 20 },
    tableWidth: 170, // ページ幅に合わせて固定（A4: 210mm - マージン40mm = 170mm相当）
  });
  
  // テーブルの後の位置を取得
  const finalY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || yPos + 50;
  
  // 合計行
  doc.setFontSize(12);
  if (canUseJapaneseFont) {
    try {
      doc.setFont('NotoSansJP', 'bold');
    } catch {
      doc.setFont('NotoSansJP', 'normal');
    }
  } else {
    doc.setFont('helvetica', 'bold');
  }
  
  try {
    // 合計金額のラベルと金額を適切な間隔で配置
    doc.text('合計金額', 120, finalY + 15);
    // 金額を右端に配置（ページ幅210mm - マージン20mm = 190mm相当）
    doc.text(`¥${totalAmount.toLocaleString('ja-JP')}`, 190, finalY + 15, { align: 'right' });
  } catch (error) {
    console.warn('合計金額の表示にエラーが発生しました:', error);
    doc.setFont('helvetica', 'bold');
    doc.text('Total', 120, finalY + 15);
    doc.text(`¥${totalAmount.toLocaleString('ja-JP')}`, 190, finalY + 15, { align: 'right' });
  }
  
  // 感謝メッセージ（下部）
  if (canUseJapaneseFont) {
    doc.setFont('NotoSansJP', 'normal');
  } else {
    doc.setFont('helvetica', 'normal');
  }
  doc.setFontSize(11);
  
  try {
    doc.text('いつもご支援いただき、誠にありがとうございます。', 20, finalY + 30);
    doc.text('今後とも変わらぬご理解とご協力をいただけますよう、', 20, finalY + 37);
    doc.text('お願い申し上げます。', 20, finalY + 44);
  } catch (error) {
    console.warn('感謝メッセージの表示にエラーが発生しました:', error);
    // エラーが発生しても続行
  }
  
  // PDFをダウンロード
  const fileName = `${year}年${month + 1}月_親立替請求書.pdf`;
  doc.save(fileName);
}

/**
 * 指定月の親立替取引を抽出
 */
export function filterParentAdvanceTransactions(
  transactions: Array<{
    date: Date;
    advance?: {
      type: string | null;
      advanceAmount: number;
      memo?: string;
    };
    description: string;
    amount: number;
  }>,
  year: number,
  month: number
): Array<{
  date: Date;
  description: string;
  amount: number;
  advanceAmount: number;
  memo?: string;
}> {
  return transactions
    .filter((tx) => {
      const txDate = new Date(tx.date);
      return (
        txDate.getFullYear() === year &&
        txDate.getMonth() === month &&
        tx.advance?.type === 'parent' &&
        tx.advance.advanceAmount > 0
      );
    })
    .map((tx) => ({
      date: tx.date,
      description: tx.description,
      amount: tx.amount,
      advanceAmount: tx.advance!.advanceAmount,
      memo: tx.advance?.memo,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

