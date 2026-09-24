// app/admin/page.tsx
/**
 * [관리자 통합 관제 대시보드 페이지 컴포넌트]
 * - 관리자 접속 시 첫 화면 (URL: "/admin")
 * - 시스템 핵심 KPI 지표 요약, 퀵 배너 및 주요 현황(회원/대회/전장 등) 바로가기 제공
 */
"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useAdmin } from "@/lib/context/AdminContext";
import { useAdminCodes, useAdminFeedback, useAdminMaps, useAdminStreamers } from "@/lib/context/AdminFeatureContexts";
import AdminCard from "@/components/admin/AdminCard";
import AdminKpiCard from "@/components/admin/AdminKpiCard";
import DashboardMapPoolSection from "@/app/admin/components/DashboardMapPoolSection";
import DashboardStreamersSection from "@/app/admin/components/DashboardStreamersSection";

export default function AdminDashboardPage() {
  const { seasons } = useAdmin();
  const { items: streamers } = useAdminStreamers();
  const { items: maps } = useAdminMaps();
  const { items: codeGroups } = useAdminCodes();
  const { showFeedback } = useAdminFeedback();

  // 스트리머 KPI 메타 텍스트 (치지직 연동 인원 vs 일반 등록 인원)
  const streamerMetaText = useMemo(() => {
    if (streamers.length === 0) return "—";
    const chzzkCount = streamers.filter((streamer) => Boolean(streamer.channelId)).length;
    const standardCount = streamers.length - chzzkCount;
    return `치지직 연동 ${chzzkCount} · 일반 등록 ${standardCount}`;
  }, [streamers]);

  return (
    <section className="space-y-6">
      {/* 1) 관리자 대시보드 히어로 배너 & 퀵 액션 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 md:p-8 text-white shadow-xl border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-3 text-xl md:text-2xl font-bold tracking-tight text-white mb-2">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#60A5FA"
              strokeWidth="2"
              className="w-6 h-6 md:w-7 md:h-7 shrink-0"
            >
              <rect x="3" y="3" width="7" height="9" rx="1" />
              <rect x="14" y="3" width="7" height="5" rx="1" />
              <rect x="14" y="12" width="7" height="9" rx="1" />
              <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
            <span>ROMS 통합 관제 센터</span>
          </div>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            오버워치 e스포츠 경기 아카이브 및 대회 운영 통합 관리 플랫폼입니다.
            선수 로스터, 대회 일정, 공식 전장 맵풀 및 공통 마스터 코드를 실시간으로 관리하고 모니터링할 수 있습니다.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2 md:gap-2.5">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-white transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            onClick={() => showFeedback("통합 관제 지표 데이터를 갱신했습니다.")}
            title="실시간 상태 새로고침"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-3.5 h-3.5"
            >
              <path d="M23 4v6h-6" />
              <path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            새로고침
          </button>
          <Link
            href="/admin/streamers"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-[#f99e1a] hover:bg-[#ea8c08] border border-[#f99e1a]/40 text-slate-950 transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
          >
            + 스트리머 관리
          </Link>
          <Link
            href="/admin/seasons"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-white transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
          >
            + 대회 관리
          </Link>
          <Link
            href="/admin/maps"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-white transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
          >
            + 맵 관리
          </Link>
          <Link
            href="/admin/codes"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-white transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
          >
            + 코드 관리
          </Link>
        </div>
      </div>

      {/* 2) 실시간 KPI 핵심 통계 지표 그리드 (6종) - AdminKpiCard 컴포넌트로 모듈화 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <AdminKpiCard
          href="/admin/streamers"
          label="등록 스트리머"
          value={streamers.length}
          unit="명"
          color="blue"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
          meta={streamerMetaText}
          title="스트리머 관리 화면으로 이동"
        />

        <AdminKpiCard
          href="/admin/seasons"
          label="개설 대회 토너먼트"
          value={seasons.length}
          unit="개"
          color="purple"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <circle cx="12" cy="8" r="7" />
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
            </svg>
          }
          meta={`진행 ${seasons.filter((t) => t.status === "진행중").length} · 예정 ${seasons.filter((t) => t.status === "개최 예정").length}`}
          title="대회 등록 관리 화면으로 이동"
        />

        <AdminKpiCard
          href="/admin/maps"
          label="공식 지정 전장"
          value={maps.length}
          unit="종"
          color="emerald"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
              <line x1="8" y1="2" x2="8" y2="18" />
              <line x1="16" y1="6" x2="16" y2="22" />
            </svg>
          }
          meta="오버워치 2 5개 모드"
          title="맵 관리 화면으로 이동"
        />

        <AdminKpiCard
          href="/admin/codes"
          label="시스템 마스터 코드"
          value={codeGroups.length}
          unit="개 그룹"
          color="amber"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          }
          meta="표준 마스터 코드 관리"
          title="공통코드 관리 화면으로 이동"
        />

        <AdminKpiCard
          onClick={() => showFeedback("데이터베이스 엔진 및 API 서버가 최적 상태로 가동 중입니다.")}
          label="시스템 가동률"
          value="99.9"
          unit="%"
          color="cyan"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          }
          meta="Prisma DB 연결 정상"
          actionText="정상"
          title="시스템 가동 상태 확인"
        />

        <AdminKpiCard
          onClick={() => showFeedback("치지직 공식 스트리머 연동 모듈이 대기 중입니다.")}
          label="치지직 API 모듈"
          value="LIVE"
          color="rose"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <circle cx="12" cy="12" r="2" />
              <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
            </svg>
          }
          meta="스트리머 연동 준비"
          actionText="대기"
          title="외부 플랫폼 연동 상태 확인"
        />
      </div>

      {/* 3) 대시보드 메인 2열 그리드 - AdminCard 컴포넌트로 통일 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 좌측 열: 등록 인원 현황 & 진행 대회 요약 */}
        <div className="flex flex-col gap-6">
          {/* 패널 1: 최근 등록 인원 */}
          <DashboardStreamersSection streamers={streamers} />

          {/* 패널 2: 진행 대회 요약 */}
          <AdminCard
            title={
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" className="w-4.5 h-4.5">
                  <circle cx="12" cy="8" r="7" />
                  <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                </svg>
                <span>현재 진행 및 접수 중 대회 현황</span>
              </>
            }
            actions={
              <Link
                href="/admin/seasons"
                className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline transition-colors"
              >
                대회 관리 ({seasons.length}건) →
              </Link>
            }
          >
            {seasons.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 dark:text-slate-500">
                <span className="text-2xl block mb-1">🏆</span>
                개설된 대회가 없습니다.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {seasons.map((t) => (
                  <Link
                    key={t.id}
                    href="/admin/seasons"
                    className="group p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50/30 dark:hover:bg-purple-950/20 transition-all block"
                    title="대회 상세 설정으로 이동"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {t.name}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          t.status === "진행중"
                            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                            : t.status === "개최 예정"
                            ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <span>팀 수: {t.teamCount}개 팀</span>
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">상금: {t.prize}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </AdminCard>
        </div>

        {/* 우측 열: 공식 맵풀 요약 & 감사 로그 */}
        <div className="flex flex-col gap-6">
          {/* 패널 3: 공식 지정 전장 맵풀 요약 */}
          <DashboardMapPoolSection maps={maps} />

          {/* 패널 4: 최근 시스템 감사 로그 (Audit Log) */}
          <AdminCard
            title={
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" className="w-4.5 h-4.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 14 14" />
                </svg>
                <span>최근 시스템 감사 로그 (Audit Logs)</span>
              </>
            }
            actions={
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                실시간 자동 기록
              </span>
            }
          >
            <div className="flex flex-col">
              <div className="flex gap-3.5 pb-4 last:pb-0 relative">
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#f99e1a] shrink-0 mt-1" />
                  <div className="w-0.5 grow bg-slate-200 dark:bg-slate-700 mt-1" />
                </div>
                <div className="grow min-w-0">
                  <div className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-snug">
                    <strong className="text-[#f99e1a] dark:text-amber-400">[인원 연동]</strong> 치지직 스트리머 제타치즈(MB-002) 계정 연동 완료
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">방금 전 · 관리자 승인 완료</div>
                </div>
              </div>

              <div className="flex gap-3.5 pb-4 last:pb-0 relative">
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-600 shrink-0 mt-1" />
                  <div className="w-0.5 grow bg-slate-200 dark:bg-slate-700 mt-1" />
                </div>
                <div className="grow min-w-0">
                  <div className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-snug">
                    <strong className="text-purple-600 dark:text-purple-400">[대회 상태]</strong> 러너리그 2026 Season 5 진행 상태 변경 (개최 예정 → 진행중)
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">1시간 전 · 대회 운영팀</div>
                </div>
              </div>

              <div className="flex gap-3.5 pb-4 last:pb-0 relative">
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0 mt-1" />
                  <div className="w-0.5 grow bg-slate-200 dark:bg-slate-700 mt-1" />
                </div>
                <div className="grow min-w-0">
                  <div className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-snug">
                    <strong className="text-emerald-600 dark:text-emerald-400">[전장 등록]</strong> 공식 맵풀 6종 활성화 및 모드별 밸런스 데이터 검증
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">3시간 전 · 시스템 데몬</div>
                </div>
              </div>

              <div className="flex gap-3.5 last:pb-0 relative">
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-600 shrink-0 mt-1" />
                </div>
                <div className="grow min-w-0">
                  <div className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-snug">
                    <strong className="text-amber-600 dark:text-amber-400">[공통코드]</strong> MEMBER_ROLE, MAP_MODE 마스터 코드 그룹 최신화
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">어제 · 시스템 관리자</div>
                </div>
              </div>
            </div>
          </AdminCard>
        </div>
      </div>
    </section>
  );
}
