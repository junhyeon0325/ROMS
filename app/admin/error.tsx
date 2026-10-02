// File: app/admin/error.tsx
// Page/Component: AdminError
// Purpose: 관리자 서버 조회 실패를 알리고 다시 시도할 수 있게 한다.
"use client";

// 서버 조회 오류를 관리자에게 표시하고 같은 화면을 재요청한다.
export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return <div role="alert" className="rounded-xl border border-red-200 bg-white p-8 text-sm dark:border-red-900 dark:bg-slate-900">
    <p className="font-semibold text-red-700 dark:text-red-400">관리자 데이터를 불러오지 못했습니다.</p>
    <button type="button" onClick={reset} className="mt-3 rounded-lg bg-amber-500 px-4 py-2 font-bold text-slate-950">다시 시도</button>
  </div>;
}
