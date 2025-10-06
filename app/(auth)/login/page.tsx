/**
 * ログインページ
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthTemplate } from "@/components/templates";
import { AuthCard } from "@/components/organisms";
import { signIn, signInWithGoogle } from "@/lib/firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signIn(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(
        "ログインに失敗しました。メールアドレスとパスワードを確認してください。"
      );
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
  ];

  return (
    <AuthTemplate>
      <AuthCard
        title="Smart Wallet"
        description="アカウントにログインしてください"
        fields={fields}
        error={error}
        loading={loading}
        submitLabel="ログイン"
        googleLabel="Googleでログイン"
        onSubmit={handleSubmit}
        onGoogleSignIn={handleGoogleSignIn}
        footerText="アカウントをお持ちでない方は"
        footerLinkText="新規登録"
        footerLinkHref="/signup"
      />
    </AuthTemplate>
  );
}
