#!/bin/bash
# Noto Sans JPフォントファイルをダウンロードするスクリプト

FONT_DIR="public/fonts"
FONT_URL="https://github.com/google/fonts/raw/main/ofl/notosansjp/NotoSansJP-Regular.ttf"

# フォルダを作成
mkdir -p "$FONT_DIR"

# フォントファイルをダウンロード
echo "Noto Sans JPフォントをダウンロード中..."
curl -L "$FONT_URL" -o "$FONT_DIR/NotoSansJP-Regular.ttf"

if [ $? -eq 0 ]; then
    echo "フォントファイルのダウンロードが完了しました: $FONT_DIR/NotoSansJP-Regular.ttf"
    ls -lh "$FONT_DIR/NotoSansJP-Regular.ttf"
else
    echo "エラー: フォントファイルのダウンロードに失敗しました"
    exit 1
fi

