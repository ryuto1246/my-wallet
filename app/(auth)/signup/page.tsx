/**
 * サインアップページ
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signUp, signInWithGoogle } from "@/lib/firebase/auth";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // パスワード確認
    if (password !== confirmPassword) {
      setError("パスワードが一致しません。");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("パスワードは6文字以上で入力してください。");
      setLoading(false);
      return;
    }

    try {
      await signUp(email, password, name);
      router.push("/dashboard");
    } catch (err) {
      const error = err as { code?: string };
      if (error.code === "auth/email-already-in-use") {
        setError("このメールアドレスは既に使用されています。");
      } else {
        setError("アカウント作成に失敗しました。入力内容を確認してください。");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");

    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (err) {
      setError("Googleログインに失敗しました。");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <Card className="w-full max-w-md shadow-soft-lg border-0 rounded-3xl overflow-hidden">
        <CardHeader className="space-y-1 pt-8 pb-6">
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Smart Wallet
          </CardTitle>
          <CardDescription className="text-center text-base text-gray-700">
            新しいアカウントを作成
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-900 font-medium">
                名前
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="山田 太郎"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
                className="border-gray-300 text-gray-900 placeholder:text-gray-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-900 font-medium">
                メールアドレス
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="border-gray-300 text-gray-900 placeholder:text-gray-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-900 font-medium">
                パスワード
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="border-gray-300 text-gray-900 placeholder:text-gray-500"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-gray-900 font-medium"
              >
                パスワード確認
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                className="border-gray-300 text-gray-900 placeholder:text-gray-500"
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/30 h-12"
              disabled={loading}
            >
              {loading ? "アカウント作成中..." : "アカウント作成"}
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-600 font-medium">
                または
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full rounded-xl border-2 border-gray-300 h-12 text-gray-900 hover:bg-gray-100 hover:border-gray-400 font-medium"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            Googleでサインアップ
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-gray-700">
            既にアカウントをお持ちの方は
            <Link
              href="/login"
              className="ml-1 text-blue-600 hover:underline font-medium"
            >
              ログイン
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
