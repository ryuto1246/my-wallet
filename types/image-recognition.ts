/**
 * 画像認識機能の型定義
 * Phase 4: スクショ認識
 */

/**
 * 対応決済サービスの種類
 */
export type PaymentService =
  | 'olive' // 三井住友OLIVE（クレジットカード）
  | 'smbc_bank' // 三井住友銀行
  | 'sony' // ソニー銀行
  | 'dpayment' // d払い
  | 'dcard' // dカード
  | 'paypay' // PayPay
  | 'cash' // 現金（手入力）
  | 'unknown'; // 不明

/**
 * 画像認識の生データ
 */
export interface RawRecognitionData {
  /** 認識されたテキスト全体 */
  fullText: string;
  /** Gemini APIからの生レスポンス */
  rawResponse: string;
  /** 信頼度（0-1） */
  confidence: number;
}

/**
 * 認識された取引情報
 */
export interface RecognizedTransaction {
  /** 決済サービスの種類 */
  paymentService: PaymentService;
  /** 取引日時 */
  date: Date | null;
  /** 金額 */
  amount: number | null;
  /** 構造化された項目名（例: ??（セブンイレブン）で買い物） */
  merchantName: string | null;
  /** 画像に記載されている元の店舗名（例: セブンイレブン渋谷店） */
  originalMerchantName?: string | null;
  /** カテゴリー（AI推測） */
  suggestedCategory?: {
    main: string;
    sub: string;
  };
  /** 認識の信頼度（0-1） */
  confidence: number;
  /** 生データ */
  rawData: RawRecognitionData;
  /** 認識された追加情報 */
  metadata?: {
    /** 取引ID（決済サービス側） */
    transactionId?: string;
    /** 決済方法 */
    paymentMethod?: string;
    /** 場所・住所 */
    location?: string;
  };
}

/**
 * 画像認識の結果
 */
export interface ImageRecognitionResult {
  /** 画像URL（Firebase Storage） */
  imageUrl: string;
  /** 画像のローカルプレビューURL */
  previewUrl: string;
  /** 認識された取引情報 */
  transaction: RecognizedTransaction;
  /** 処理のステータス */
  status: 'pending' | 'processing' | 'success' | 'error';
  /** エラーメッセージ（エラー時） */
  error?: string;
  /** 重複検出結果 */
  duplicateInfo?: DuplicateDetectionResult;
}

/**
 * 重複検出の結果
 */
export interface DuplicateDetectionResult {
  /** 重複が検出されたか */
  isDuplicate: boolean;
  /** 類似度スコア（0-1） */
  similarityScore: number;
  /** 重複の可能性がある既存取引のID */
  matchingTransactionIds: string[];
  /** 重複理由の説明 */
  reason?: string;
}

/**
 * 画像認識のリクエスト
 */
export interface ImageRecognitionRequest {
  /** アップロードされた画像ファイル */
  file: File;
  /** ユーザーID */
  userId: string;
  /** 決済サービスのヒント（任意） */
  serviceHint?: PaymentService;
}

/**
 * バッチ認識の結果
 */
export interface BatchRecognitionResult {
  /** 成功した認識結果 */
  successful: ImageRecognitionResult[];
  /** 失敗した認識結果 */
  failed: Array<{
    file: File;
    error: string;
  }>;
  /** 重複として除外された結果 */
  duplicates: ImageRecognitionResult[];
  /** 処理の統計情報 */
  stats: {
    total: number;
    successful: number;
    failed: number;
    duplicates: number;
  };
}

/**
 * 決済サービス別のパーサー設定
 */
export interface ServiceParserConfig {
  /** サービス名 */
  service: PaymentService;
  /** サービスを識別するキーワード */
  identifyingKeywords: string[];
  /** 日付の抽出パターン */
  datePatterns: RegExp[];
  /** 金額の抽出パターン */
  amountPatterns: RegExp[];
  /** 店舗名の抽出パターン */
  merchantPatterns: RegExp[];
}

/**
 * OCR処理のオプション
 */
export interface OCROptions {
  /** 言語（デフォルト: 日本語） */
  language?: 'ja' | 'en';
  /** 決済サービスのヒント */
  serviceHint?: PaymentService;
  /** 重複チェックを行うか */
  checkDuplicates?: boolean;
  /** 重複判定の閾値（0-1、デフォルト: 0.8） */
  duplicateThreshold?: number;
}

/**
 * 画像アップロードの進捗状況
 */
export interface UploadProgress {
  /** アップロード済みのバイト数 */
  loaded: number;
  /** 全体のバイト数 */
  total: number;
  /** 進捗率（0-100） */
  percentage: number;
}


