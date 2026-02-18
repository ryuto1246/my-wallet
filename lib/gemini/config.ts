/**
 * Gemini API設定
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini APIキーの取得
const getApiKey = (): string => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('Gemini API key is not set. AI suggestions will be disabled.');
    return '';
  }
  
  return apiKey;
};

// Gemini APIクライアントの初期化
let genAI: GoogleGenerativeAI | null = null;

export const getGeminiClient = (): GoogleGenerativeAI | null => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    return null;
  }
  
  if (!genAI) {
    genAI = new GoogleGenerativeAI(apiKey);
  }
  
  return genAI;
};

// 使用するモデル名（環境変数で上書き可能。未設定時は gemini-2.0-flash）
const GEMINI_MODEL =
  process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-2.0-flash';

// Gemini Proモデルを取得
export const getGeminiModel = () => {
  const client = getGeminiClient();
  
  if (!client) {
    return null;
  }
  
  // v1 を使用（v1beta ではモデルが見つからない場合があるため）
  return client.getGenerativeModel(
    { model: GEMINI_MODEL },
    { apiVersion: 'v1' }
  );
};

// API利用可能かチェック
export const isGeminiAvailable = (): boolean => {
  return !!getApiKey();
};










