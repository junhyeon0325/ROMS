// File: app/login/LoginForm.tsx
// Component: LoginForm
// Purpose: 관리자 이메일과 비밀번호를 NextAuth Credentials 엔드포인트에 안전하게 전달한다.
"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

interface LoginFormProps {
  callbackUrl: string;
}

// 자격 증명을 검증하고 성공 시 요청한 내부 관리자 경로로 이동한다.
export default function LoginForm({ callbackUrl }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 제출 중 중복 요청을 막고 인증 결과에 따라 오류 표시 또는 안전한 경로 이동을 수행한다.
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (!result?.ok) {
        setErrorMessage("이메일 또는 비밀번호를 확인해주세요.");
        return;
      }

      router.push(result.url || callbackUrl);
      router.refresh();
    } catch {
      setErrorMessage("로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <label className="block">
        <span className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300">
          이메일
        </span>
        <input
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm outline-none transition focus:border-[#f99e1a]"
        />
      </label>
      <label className="block">
        <span className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300">
          비밀번호
        </span>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm outline-none transition focus:border-[#f99e1a]"
        />
      </label>
      {errorMessage && (
        <p role="alert" className="text-xs font-semibold text-rose-600 dark:text-rose-400">
          {errorMessage}
        </p>
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-[#f99e1a] px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-[#ea8c08] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "로그인 중..." : "로그인"}
      </button>
    </form>
  );
}
