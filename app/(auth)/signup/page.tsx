/**
 * サインアップページ
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthTemplate } from "@/components/templates";
import { AuthCard } from "@/components/organisms";
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

  const fields = [
    {
      id: "name",
      label: "名前",
      type: "text" as const,
      placeholder: "山田 太郎",
      value: name,
      onChange: setName,
    },
    {
      id: "email",
      label: "メールアドレス",
      type: "email" as const,
      placeholder: "email@example.com",
      value: email,
      onChange: setEmail,
    },
    {
      id: "password",
      label: "パスワード",
      type: "password" as const,
      placeholder: "••••••••",
      value: password,
      onChange: setPassword,
    },
    {
      id: "confirmPassword",
      label: "パスワード確認",
      type: "password" as const,
      placeholder: "••••••••",
      value: confirmPassword,
      onChange: setConfirmPassword,
    },
  ];

  return (
    <AuthTemplate>
      <AuthCard
        title="Smart Wallet"
        description="新しいアカウントを作成"
        fields={fields}
        error={error}
        loading={loading}
        submitLabel="アカウント作成"
        googleLabel="Googleでサインアップ"
        onSubmit={handleSubmit}
        onGoogleSignIn={handleGoogleSignIn}
        footerText="既にアカウントをお持ちの方は"
        footerLinkText="ログイン"
        footerLinkHref="/login"
      />
    </AuthTemplate>
  );
}
