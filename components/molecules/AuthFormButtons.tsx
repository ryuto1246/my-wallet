/**
 * 認証フォームボタン（Molecule）
 * 認証用の送信ボタンとGoogleボタンのセット
 */

import { Button } from "@/components/ui/button";
import { Divider } from "@/components/atoms";

interface AuthFormButtonsProps {
  submitLabel: string;
  googleLabel: string;
  loading: boolean;
  onGoogleSignIn: () => void;
}

export function AuthFormButtons({
  submitLabel,
  googleLabel,
  loading,
  onGoogleSignIn,
}: AuthFormButtonsProps) {
  return (
    <>
      <Button
        type="submit"
        className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/30 h-12 text-white font-semibold"
        disabled={loading}
      >
        {loading ? `${submitLabel}中...` : submitLabel}
      </Button>

      <Divider text="または" />

      <Button
        type="button"
        variant="outline"
        className="w-full rounded-xl border-2 border-white/50 bg-white/70 h-12 text-gray-900 hover:text-gray-900 hover:bg-white/80 hover:border-white/60 font-medium backdrop-blur-md"
        onClick={onGoogleSignIn}
        disabled={loading}
      >
        {googleLabel}
      </Button>
    </>
  );
}
