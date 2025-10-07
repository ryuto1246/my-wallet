/**
 * 認証カード（Organism）
 * ログイン・サインアップページで使用する認証フォームカード
 * Liquid Glassスタイルを適用
 */

import { Logo, FormField, ErrorMessage } from "@/components/atoms";
import { AuthFormButtons } from "@/components/molecules";
import Link from "next/link";

interface FormFieldConfig {
  id: string;
  label: string;
  type: "text" | "email" | "password";
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

interface AuthCardProps {
  title: string;
  description: string;
  fields: FormFieldConfig[];
  error: string;
  loading: boolean;
  submitLabel: string;
  googleLabel: string;
  onSubmit: (e: React.FormEvent) => void;
  onGoogleSignIn: () => void;
  footerText: string;
  footerLinkText: string;
  footerLinkHref: string;
}

export function AuthCard({
  description,
  fields,
  error,
  loading,
  submitLabel,
  googleLabel,
  onSubmit,
  onGoogleSignIn,
  footerText,
  footerLinkText,
  footerLinkHref,
}: AuthCardProps) {
  return (
    <div className="w-full max-w-[520px] mx-auto overflow-hidden rounded-3xl shadow-2xl border-2 border-white/70 bg-white/98 backdrop-blur-xl">
      <div className="p-10 bg-white/98">
        <div className="space-y-3 mb-8 text-center">
          <Logo size="lg" />
          <p className="text-lg text-gray-800 font-semibold">{description}</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          {fields.map((field) => (
            <FormField
              key={field.id}
              id={field.id}
              label={field.label}
              type={field.type}
              placeholder={field.placeholder}
              value={field.value}
              onChange={field.onChange}
              required
              disabled={loading}
            />
          ))}
          <ErrorMessage message={error} />
          <AuthFormButtons
            submitLabel={submitLabel}
            googleLabel={googleLabel}
            loading={loading}
            onGoogleSignIn={onGoogleSignIn}
          />
        </form>

        <div className="mt-8 text-base text-center text-gray-800 font-medium">
          {footerText}
          <Link
            href={footerLinkHref}
            className="ml-1 text-blue-700 hover:text-blue-800 hover:underline font-bold"
          >
            {footerLinkText}
          </Link>
        </div>
      </div>
    </div>
  );
}
