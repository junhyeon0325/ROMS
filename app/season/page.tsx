// File: app/season/page.tsx
// Page/Component: 시즌 아카이브 목록
// Purpose: 등록된 시즌과 각 시즌의 MVP를 공개 목록으로 제공한다.
import Link from "next/link";
import { prisma } from "@/lib/prisma";

// 모든 시즌을 최신순으로 조회해 개별 아카이브로 연결한다.
export default async function SeasonArchiveListPage() {
  const seasons = await prisma.season.findMany({
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      mvpStreamer: { select: { name: true, profileImageUrl: true } },
    },
    orderBy: [{ endDate: "desc" }, { createdAt: "desc" }],
  });

  return (
    <main className="min-h-screen bg-[#FAFAF7] px-5 py-12 text-slate-900 dark:bg-[#0B0E14] dark:text-slate-100">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm font-semibold text-amber-600 hover:text-amber-700">ROMS 홈</Link>
        <header className="mt-8 border-b border-slate-200 pb-6 dark:border-slate-800">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">ROMS Archive</p>
          <h1 className="mt-2 text-3xl font-black">시즌 아카이브</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">시즌 기록과 대회에서 선정된 MVP를 확인할 수 있습니다.</p>
        </header>
        {seasons.length ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {seasons.map((season) => {
              const dates = [season.startDate, season.endDate]
                .map((date) => date?.toISOString().slice(0, 10).replaceAll("-", "."))
                .filter((date): date is string => Boolean(date));
              return (
                <Link key={season.id.toString()} href={`/season/${season.id}`} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-amber-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs font-bold text-amber-600">{dates.join(" ~ ") || "기간 미정"}</p>
                  <h2 className="mt-2 text-xl font-black">{season.name}</h2>
                  <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">시즌 MVP <span className="font-bold text-slate-800 dark:text-slate-100">{season.mvpStreamer?.name ?? "미등록"}</span></p>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="mt-8 rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700">등록된 시즌이 없습니다.</p>
        )}
      </div>
    </main>
  );
}
