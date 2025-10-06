/**
 * 認証カード（Organism）
 * ログイン・サインアップページで使用する認証フォームカード
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <Card className="w-full max-w-md shadow-soft-lg border-0 rounded-3xl overflow-hidden">
      <CardHeader className="space-y-1 pt-8 pb-6">
        <CardTitle>
          <Logo size="lg" />
        </CardTitle>
        <CardDescription className="text-center text-base text-gray-800">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
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
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <div className="text-sm text-center text-gray-800">
          {footerText}
          <Link
            href={footerLinkHref}
            className="ml-1 text-blue-700 hover:text-blue-800 hover:underline font-medium"
          >
            {footerLinkText}
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
