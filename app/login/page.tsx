// File: app/login/page.tsx
// Page: AdminLoginPage
// Purpose: ADMIN·DEV 계정이 Credentials 방식으로 관리자 세션을 시작하는 로그인 페이지다.
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import LoginForm from "./LoginForm";

interface LoginPageProps {
  searchParams?: { callbackUrl?: string };
}

// 이미 로그인한 관리자는 관리자 홈으로 보내고 안전한 내부 복귀 경로만 폼에 전달한다.
export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const session = await getServerSession(authOptions);
  if (session?.user.role === "ADMIN" || session?.user.role === "DEV") {
    redirect("/admin");
  }

  const requestedUrl = searchParams?.callbackUrl;
  const callbackUrl =
    requestedUrl?.startsWith("/") && !requestedUrl.startsWith("//")
      ? requestedUrl
      : "/admin";

  return (
    <main className="min-h-screen bg-[#FAFAF7] dark:bg-[#0B0E14] px-4 py-12 text-slate-900 dark:text-slate-100 flex items-center justify-center">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] p-8 shadow-xl">
        <div className="mb-8">
          <a href="/" className="inline-flex text-xl font-black tracking-tight">
            RO<span className="text-[#f99e1a]">MS</span>
          </a>
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f99e1a]">
            Administrator Sign In
          </p>
          <h1 className="mt-5 text-2xl font-black">관리자 로그인</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            ADMIN 또는 DEV 계정으로 로그인해주세요.
          </p>
        </div>
        <LoginForm callbackUrl={callbackUrl} />
      </section>
    </main>
  );
}
