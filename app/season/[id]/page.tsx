// File: app/season/[id]/page.tsx
// Page/Component: 시즌 아카이브
// Purpose: 시즌 기본 정보와 관리자가 등록한 시즌 MVP를 공개한다.
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ id: string }> };

// 유효한 시즌 ID를 조회해 아카이브 화면에 필요한 공개 정보만 표시한다.
export default async function SeasonArchivePage({ params }: PageProps) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id)) notFound();

  const season = await prisma.season.findUnique({
    where: { id: BigInt(id) },
    select: {
      name: true,
      startDate: true,
      endDate: true,
      mvpStreamer: { select: { name: true, profileImageUrl: true } },
    },
  });
  if (!season) notFound();

  const period = [season.startDate, season.endDate]
    .map((date) => date?.toISOString().slice(0, 10).replaceAll("-", "."))
    .filter((date): date is string => Boolean(date))
    .join(" ~ ");

  return (
    <main className="min-h-screen bg-[#FAFAF7] px-5 py-12 text-slate-900 dark:bg-[#0B0E14] dark:text-slate-100">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm font-semibold text-amber-600 hover:text-amber-700">ROMS 홈</Link>
        <header className="mt-8 border-b border-slate-200 pb-6 dark:border-slate-800">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">Season Archive</p>
          <h1 className="mt-2 text-3xl font-black">{season.name}</h1>
          {period && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{period}</p>}
        </header>

        <section aria-labelledby="season-mvp" className="mt-8 rounded-3xl border border-amber-300/70 bg-gradient-to-br from-amber-100 to-orange-50 p-6 shadow-sm dark:border-amber-700/50 dark:from-amber-950/50 dark:to-slate-900">
          <p className="text-xs font-bold tracking-[0.18em] text-amber-700 dark:text-amber-400">SEASON AWARD</p>
          <h2 id="season-mvp" className="mt-2 text-xl font-black">시즌 MVP</h2>
          {season.mvpStreamer ? (
            <div className="mt-6 flex items-center gap-5">
              {season.mvpStreamer.profileImageUrl ? (
                // 프로필 이미지가 등록된 MVP에만 이미지를 표시한다.
                <Image src={season.mvpStreamer.profileImageUrl} alt="" width={80} height={80} unoptimized className="h-20 w-20 rounded-2xl object-cover" />
              ) : (
                <div aria-hidden="true" className="flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-200 text-3xl font-black text-amber-800 dark:bg-amber-900 dark:text-amber-200">M</div>
              )}
              <p className="text-2xl font-black">{season.mvpStreamer.name}</p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">시즌 MVP가 아직 등록되지 않았습니다.</p>
          )}
        </section>
      </div>
    </main>
  );
}
