/**
 * Firebase Storage操作
 * 画像のアップロード・削除・取得を管理
 */

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  uploadBytesResumable,
  UploadTask,
} from 'firebase/storage';
import app from './config';
import type { UploadProgress } from '@/types/image-recognition';

const storage = getStorage(app);

/**
 * 画像をFirebase Storageにアップロード
 * @param file アップロードする画像ファイル
 * @param userId ユーザーID
 * @param transactionId トランザクションID（任意）
 * @returns 画像のダウンロードURL
 */
export async function uploadTransactionImage(
  file: File,
  userId: string,
  transactionId?: string
): Promise<string> {
  // ファイル名を生成（タイムスタンプ + ランダム文字列）
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(7);
  const fileName = `${timestamp}_${randomString}_${file.name}`;

  // ストレージパスを生成
  const storagePath = transactionId
    ? `transactions/${userId}/${transactionId}/${fileName}`
    : `transactions/${userId}/temp/${fileName}`;

  const storageRef = ref(storage, storagePath);

  try {
    // ファイルをアップロード
    const snapshot = await uploadBytes(storageRef, file);
    
    // ダウンロードURLを取得
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('画像のアップロードに失敗しました:', error);
    throw new Error('画像のアップロードに失敗しました');
  }
}

/**
 * 進捗状況付きで画像をアップロード
 * @param file アップロードする画像ファイル
 * @param userId ユーザーID
 * @param onProgress 進捗状況のコールバック
 * @param transactionId トランザクションID（任意）
 * @returns 画像のダウンロードURL
 */
export async function uploadTransactionImageWithProgress(
  file: File,
  userId: string,
  onProgress: (progress: UploadProgress) => void,
  transactionId?: string
): Promise<string> {
  // ファイル名を生成
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(7);
  const fileName = `${timestamp}_${randomString}_${file.name}`;

  // ストレージパスを生成
  const storagePath = transactionId
    ? `transactions/${userId}/${transactionId}/${fileName}`
    : `transactions/${userId}/temp/${fileName}`;

  const storageRef = ref(storage, storagePath);

  return new Promise((resolve, reject) => {
    const uploadTask: UploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        // 進捗状況を計算
        const progress: UploadProgress = {
          loaded: snapshot.bytesTransferred,
          total: snapshot.totalBytes,
          percentage: Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          ),
        };
        onProgress(progress);
      },
      (error) => {
        console.error('画像のアップロードに失敗しました:', error);
        reject(new Error('画像のアップロードに失敗しました'));
      },
      async () => {
        try {
          // アップロード完了後、ダウンロードURLを取得
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          console.error('ダウンロードURLの取得に失敗しました:', error);
          reject(new Error('ダウンロードURLの取得に失敗しました'));
        }
      }
    );
  });
}

/**
 * 画像を削除
 * @param imageUrl 削除する画像のURL
 */
export async function deleteTransactionImage(imageUrl: string): Promise<void> {
  try {
    const storageRef = ref(storage, imageUrl);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('画像の削除に失敗しました:', error);
    throw new Error('画像の削除に失敗しました');
  }
}

/**
 * URLから画像を取得（プレビュー用）
 * @param imageUrl 画像のURL
 * @returns 画像のBlob
 */
export async function getTransactionImage(imageUrl: string): Promise<Blob> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error('画像の取得に失敗しました');
    }
    return await response.blob();
  } catch (error) {
    console.error('画像の取得に失敗しました:', error);
    throw new Error('画像の取得に失敗しました');
  }
}

/**
 * 画像ファイルのバリデーション
 * @param file 検証するファイル
 * @returns バリデーション結果
 */
export function validateImageFile(file: File): {
  isValid: boolean;
  error?: string;
} {
  // ファイルサイズのチェック（10MB以下）
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'ファイルサイズは10MB以下にしてください',
    };
  }

  // ファイルタイプのチェック（画像のみ）
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: '対応している画像形式: JPEG, PNG, WebP',
    };
  }

  return { isValid: true };
}

/**
 * 複数の画像を一括アップロード
 * @param files アップロードする画像ファイルの配列
 * @param userId ユーザーID
 * @param onProgress 進捗状況のコールバック（任意）
 * @returns 画像のダウンロードURLの配列
 */
export async function uploadMultipleImages(
  files: File[],
  userId: string,
  onProgress?: (fileIndex: number, progress: UploadProgress) => void
): Promise<string[]> {
  const uploadPromises = files.map((file, index) => {
    if (onProgress) {
      return uploadTransactionImageWithProgress(
        file,
        userId,
        (progress) => onProgress(index, progress)
      );
    } else {
      return uploadTransactionImage(file, userId);
    }
  });

  try {
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('一括アップロードに失敗しました:', error);
    throw new Error('一括アップロードに失敗しました');
  }
}

