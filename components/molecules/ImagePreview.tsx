/**
 * 画像プレビューコンポーネント
 */

"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface ImagePreviewProps {
  /** 画像のURL（Base64またはFirebase URL） */
  imageUrl: string;
  /** 画像のファイル名 */
  fileName?: string;
  /** 削除ボタンのハンドラ */
  onRemove?: () => void;
  /** アップロード進捗率（0-100） */
  uploadProgress?: number;
  /** クリック可能か */
  clickable?: boolean;
  /** クリックハンドラ */
  onClick?: () => void;
}

export function ImagePreview({
  imageUrl,
  fileName,
  onRemove,
  uploadProgress,
  clickable = false,
  onClick,
}: ImagePreviewProps) {
  const isUploading = uploadProgress !== undefined && uploadProgress < 100;

  return (
    <div
      className={`relative group rounded-lg overflow-hidden border-2 border-border bg-muted ${
        clickable ? "cursor-pointer hover:border-primary transition-colors" : ""
      }`}
      onClick={clickable ? onClick : undefined}
    >
      {/* 画像 */}
      <div className="relative aspect-video w-full">
        <Image
          src={imageUrl}
          alt={fileName || "画像プレビュー"}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 300px"
        />

        {/* アップロード中のオーバーレイ */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="mb-2">アップロード中...</div>
              <div className="text-2xl font-bold">{uploadProgress}%</div>
            </div>
          </div>
        )}

        {/* 削除ボタン */}
        {onRemove && !isUploading && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* ファイル名 */}
      {fileName && (
        <div className="p-2 text-xs text-muted-foreground truncate bg-background">
          {fileName}
        </div>
      )}

      {/* アップロード進捗バー */}
      {isUploading && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}
    </div>
  );
}

