// File: components/auth/LogoutButton.tsx
// Component: LogoutButton
// Purpose: 현재 관리자 세션을 종료하고 로그인 페이지로 돌아가는 버튼을 제공한다.
"use client";

import { signOut } from "next-auth/react";

// NextAuth 세션 쿠키를 서버에서 만료시키는 로그아웃 동작을 실행한다.
export default function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 transition hover:border-rose-300 hover:text-rose-600 dark:hover:border-rose-800 dark:hover:text-rose-400"
    >
      로그아웃
    </button>
  );
}
