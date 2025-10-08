/**
 * 画像アップロードゾーンコンポーネント
 * ドラッグ&ドロップと画像認識に対応
 */

"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImagePreview } from "@/components/molecules/ImagePreview";
import { validateImageFile } from "@/lib/firebase/storage";

interface ImageUploadZoneProps {
  /** アップロード完了時のコールバック */
  onUpload: (files: File[]) => void;
  /** 最大アップロード枚数 */
  maxFiles?: number;
  /** 複数ファイルを許可するか */
  multiple?: boolean;
  /** アップロード済みの画像URL */
  uploadedImages?: Array<{
    url: string;
    fileName: string;
    progress?: number;
  }>;
  /** 画像削除時のコールバック */
  onRemoveImage?: (index: number) => void;
  /** 認識中か */
  isRecognizing?: boolean;
}

export function ImageUploadZone({
  onUpload,
  maxFiles = 5,
  multiple = true,
  uploadedImages = [],
  onRemoveImage,
  isRecognizing = false,
}: ImageUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ファイル検証とアップロード
  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      setErrors([]);
      const validFiles: File[] = [];
      const newErrors: string[] = [];

      // 最大枚数チェック
      const remainingSlots = maxFiles - uploadedImages.length;
      if (files.length > remainingSlots) {
        newErrors.push(
          `最大${maxFiles}枚までアップロードできます（残り${remainingSlots}枚）`
        );
      }

      // 各ファイルを検証
      Array.from(files)
        .slice(0, remainingSlots)
        .forEach((file) => {
          const validation = validateImageFile(file);
          if (validation.isValid) {
            validFiles.push(file);
          } else {
            newErrors.push(`${file.name}: ${validation.error}`);
          }
        });

      if (newErrors.length > 0) {
        setErrors(newErrors);
      }

      if (validFiles.length > 0) {
        onUpload(validFiles);
      }
    },
    [maxFiles, uploadedImages.length, onUpload]
  );

  // ドラッグ&ドロップハンドラ
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      handleFiles(files);
    },
    [handleFiles]
  );

  // ファイル選択ハンドラ
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
      // 同じファイルを再選択できるようにリセット
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleFiles]
  );

  // ファイル選択ダイアログを開く
  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const canUploadMore = uploadedImages.length < maxFiles;

  return (
    <div className="space-y-4">
      {/* アップロードゾーン */}
      {canUploadMore && (
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          } ${isRecognizing ? "opacity-50 pointer-events-none" : ""}`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            {isRecognizing ? (
              <>
                <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
                <div className="text-sm text-muted-foreground">
                  画像を認識中...
                </div>
              </>
            ) : (
              <>
                <div
                  className={`rounded-full p-4 ${
                    isDragging ? "bg-primary/10" : "bg-muted"
                  }`}
                >
                  <Upload
                    className={`h-8 w-8 ${
                      isDragging ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">画像をドラッグ&ドロップ</p>
                  <p className="text-xs text-muted-foreground">または</p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={openFileDialog}
                  disabled={isRecognizing}
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  ファイルを選択
                </Button>

                <p className="text-xs text-muted-foreground">
                  対応形式: JPEG, PNG, WebP（最大10MB）
                  {multiple && (
                    <>
                      <br />
                      最大{maxFiles}枚まで（残り
                      {maxFiles - uploadedImages.length}枚）
                    </>
                  )}
                </p>
              </>
            )}
          </div>

          {/* 隠しファイル入力 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple={multiple}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* エラーメッセージ */}
      {errors.length > 0 && (
        <div className="rounded-lg bg-destructive/10 p-4 space-y-2">
          {errors.map((error, index) => (
            <p key={index} className="text-sm text-destructive">
              {error}
            </p>
          ))}
        </div>
      )}

      {/* アップロード済み画像のプレビュー */}
      {uploadedImages.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium">
            アップロード済み画像（{uploadedImages.length}枚）
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadedImages.map((image, index) => (
              <ImagePreview
                key={index}
                imageUrl={image.url}
                fileName={image.fileName}
                uploadProgress={image.progress}
                onRemove={
                  onRemoveImage ? () => onRemoveImage(index) : undefined
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
