// File: app/admin/page.tsx
// Page/Component: AdminDashboardPage
// Purpose: 저장된 대회·경기·선수·맵·영웅 현황과 관리자 바로가기를 표시한다.
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AdminCard from "@/components/admin/AdminCard";
import AdminKpiCard from "@/components/admin/AdminKpiCard";
import { CalendarDays, Swords, Layers, Users, Map, Shield } from "lucide-react";

export const dynamic = "force-dynamic";

const shortcuts = [
  { label: "경기 기록 관리", href: "/admin/matches", description: "경기와 세트 기록 입력" },
  { label: "경기 데이터 조회", href: "/admin/match-records", description: "저장된 기록 확인" },
  { label: "선수별 맵·영웅 통계", href: "/admin/player-map-hero-statistics", description: "선수·맵·영웅 조합별 사용 확인" },
  { label: "대회 등록", href: "/admin/seasons", description: "시즌과 일정 관리" },
  { label: "스트리머 관리", href: "/admin/streamers", description: "등록 스트리머 확인" },
  { label: "맵 관리", href: "/admin/maps", description: "등록 맵 확인" },
];

// 각 모델의 저장 행 수와 최근 대회만 서버에서 읽어 현재 현황을 표시한다.
export default async function AdminDashboardPage() {
  const [seasonCount, matchCount, setCount, streamerCount, mapCount, heroCount, seasons] = await Promise.all([
    prisma.season.count(), prisma.match.count(), prisma.matchSet.count(),
    prisma.streamer.count(), prisma.mapItem.count(), prisma.hero.count(),
    prisma.season.findMany({ orderBy: { createdAt: "desc" }, take: 5,
      select: { id: true, name: true, status: true, startDate: true } }),
  ]);
  const kpis = [
    { label: "등록 대회", value: seasonCount, unit: "개", href: "/admin/seasons", color: "purple" as const, icon: <CalendarDays size={18} /> },
    { label: "저장 경기", value: matchCount, unit: "경기", href: "/admin/matches", color: "blue" as const, icon: <Swords size={18} /> },
    { label: "저장 세트", value: setCount, unit: "세트", href: "/admin/match-records", color: "cyan" as const, icon: <Layers size={18} /> },
    { label: "등록 스트리머", value: streamerCount, unit: "명", href: "/admin/streamers", color: "amber" as const, icon: <Users size={18} /> },
    { label: "등록 맵", value: mapCount, unit: "개", href: "/admin/maps", color: "emerald" as const, icon: <Map size={18} /> },
    { label: "등록 영웅", value: heroCount, unit: "종", href: "/admin/heroes", color: "rose" as const, icon: <Shield size={18} /> },
  ];

  return <section className="space-y-6 pb-8">
    <div className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900 to-indigo-950 p-6 text-white shadow-lg md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">ROMS ADMIN</p>
      <h1 className="mt-2 text-2xl font-bold md:text-3xl">관리자 대시보드</h1>
      <p className="mt-2 text-sm text-slate-300">저장된 대회와 경기 기록의 현재 현황을 확인하세요.</p>
    </div>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {kpis.map((item) => <AdminKpiCard key={item.label} {...item} meta="DB 저장 건수" />)}
    </div>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <AdminCard title="최근 등록 대회" actions={<Link href="/admin/seasons" className="text-xs font-semibold text-amber-700 hover:underline dark:text-amber-400">전체 보기</Link>}>
        {seasons.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">등록된 대회가 없습니다.</p> :
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">{seasons.map((season) => <li key={String(season.id)} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
            <span className="font-semibold text-slate-900 dark:text-slate-100">{season.name}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{season.status}{season.startDate ? ` · ${season.startDate.toISOString().slice(0, 10)}` : ""}</span>
          </li>)}</ul>}
      </AdminCard>
      <AdminCard title="관리 메뉴 바로가기">
        <div className="grid gap-3 sm:grid-cols-2">{shortcuts.map((item) => <Link key={item.href} href={item.href} className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-amber-400 hover:bg-amber-50 dark:border-slate-700 dark:bg-slate-800/40 dark:hover:bg-slate-800">
          <span className="block text-sm font-bold text-slate-900 dark:text-white">{item.label} <span aria-hidden="true">→</span></span>
          <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{item.description}</span>
        </Link>)}</div>
      </AdminCard>
    </div>
  </section>;
}
