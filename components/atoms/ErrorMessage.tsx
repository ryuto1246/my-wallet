/**
 * エラーメッセージ（Atom）
 * エラー表示用の再利用可能なコンポーネント
 */

interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
      {message}
    </div>
  );
}
