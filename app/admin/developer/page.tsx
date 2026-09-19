// File: app/admin/developer/page.tsx
// Page: DeveloperAccessPage
// Purpose: DEV 전용 경로의 권한 경계가 적용되었음을 확인하는 최소 상태 페이지다.

// 민감한 운영 기능 없이 DEV 전용 영역의 준비 상태만 표시한다.
export default function DeveloperAccessPage() {
  return (
    <section className="rounded-2xl border border-sky-200 dark:border-sky-900 bg-white dark:bg-[#111726] p-8">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400">
        Developer only
      </p>
      <h2 className="mt-3 text-2xl font-black">개발자 전용 영역</h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        DEV 역할의 전용 페이지와 API를 추가할 수 있는 권한 경계가 준비되었습니다.
      </p>
    </section>
  );
}
