// File: app/admin/loading.tsx
// Page/Component: AdminLoading
// Purpose: 관리자 서버 화면을 읽는 동안 진행 상태를 안내한다.
// 관리자 페이지 전환 시 공통 로딩 상태를 표시한다.
export default function AdminLoading() {
  return <div role="status" className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">관리자 데이터를 불러오는 중입니다…</div>;
}
