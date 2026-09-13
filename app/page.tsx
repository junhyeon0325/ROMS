// app/page.tsx
/**
 * [사용자 메인 대시보드 페이지 컴포넌트]
 * - 일반 사용자가 접속하는 서비스 첫 화면 (URL: "/")
 * - 시즌 하이라이트 지표, 대회 참가팀 순위표, 최근 경기 결과 요약 제공
 */
"use client";

import React, { useState } from "react";
import UserHeader from "@/components/layout/UserHeader";
import UserFooter from "@/components/layout/UserFooter";

interface RankingItem {
  name: string;
  role: "tank" | "dps" | "support";
  wins: number;
  kda: string;
  wr: string;
}

interface HighlightItem {
  label: string;
  value: string;
  name: string;
}

interface MatchItem {
  tag: string;
  names: string;
  score: string;
  result: "win" | "lose";
}

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState("러너리그");
  const [searchQuery, setSearchQuery] = useState("");

  const roleLabel: Record<string, string> = {
    tank: "탱커",
    dps: "딜러",
    support: "힐러",
  };

  const ranking: RankingItem[] = [];
  const highlights: HighlightItem[] = [];
  const matches: MatchItem[] = [];

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };


  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF7] dark:bg-[#0B0E14] text-slate-900 dark:text-slate-100 transition-colors">
      {/* 1. 상단 사용자 헤더 */}
      <UserHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
      />

      <main className="flex-1">
        {/* 2. 메인 배너 */}
      <div className="max-w-6xl mx-auto px-6 md:px-12 pt-10 pb-10 relative overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-slate-800/10 border border-amber-500/20 dark:border-amber-500/20 rounded-3xl p-8 md:p-12 relative overflow-hidden">
          <div className="font-mono text-xs tracking-widest uppercase text-[#f99e1a] dark:text-amber-400 font-bold mb-3">
            ROMS · Runner-league Overwatch Management System
          </div>
          <h1 className="font-black text-2xl md:text-4xl text-slate-900 dark:text-white mb-3 tracking-tight">
            새로운 시즌 경기를 준비하고 있습니다
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-xl leading-relaxed">
            현재 등록된 경기 결과 및 선수 전적 데이터가 없습니다. 관리자 콘솔에서 대회와 참가 스트리머를 등록하면 실시간 순위와 매치 결과가 이곳에 표시됩니다.
          </p>
          <a
            href="/admin"
            className="inline-flex items-center gap-2 bg-[#f99e1a] hover:bg-[#ea8c08] text-slate-950 font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
          >
            관리자 콘솔 바로가기 →
          </a>
        </div>
      </div>

      {/* 3. 메인 콘텐츠 컨테이너 */}
      <div className="max-w-6xl mx-auto px-6 md:px-12 pb-20 space-y-12">
        {/* 섹션 1: 러너리그 순위 */}
        <div className="pb-8 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-baseline justify-between mb-5 pb-3 border-b border-slate-200/80 dark:border-slate-800">
            <h2 className="font-black text-lg text-slate-900 dark:text-white">
              러너리그 순위
            </h2>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              선수별 통합 전적 현황
            </span>
          </div>

          {ranking.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
              <span className="text-3xl block mb-2">📊</span>
              등록된 선수별 순위 및 전적 데이터가 없습니다.
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800/80">
              {ranking.map((p, i) => (
                <div
                  key={p.name}
                  className="grid grid-cols-[36px_1fr_70px] md:grid-cols-[56px_1fr_120px_90px_90px] items-center py-4 cursor-pointer hover:pl-2.5 transition-all group select-none"
                >
                  <span
                    className={`font-black text-xl md:text-2xl ${
                      i === 0
                        ? "text-[#f99e1a] dark:text-amber-400"
                        : "text-slate-300 dark:text-slate-600"
                    }`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        p.role === "tank"
                          ? "bg-blue-600"
                          : p.role === "dps"
                          ? "bg-rose-500"
                          : "bg-emerald-500"
                      }`}
                    />
                    <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-[#f99e1a] dark:group-hover:text-[#f99e1a] transition-colors">
                      {p.name}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 ml-1 font-normal">
                      {roleLabel[p.role]}
                    </span>
                  </div>

                  <span className="font-mono font-bold text-xs md:text-sm text-slate-900 dark:text-white">
                    {p.wins} WINS
                  </span>
                  <span className="hidden md:block font-mono text-xs text-slate-600 dark:text-slate-400">
                    KDA {p.kda}
                  </span>
                  <span className="hidden md:block font-mono text-xs text-slate-600 dark:text-slate-400">
                    {p.wr}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 섹션 2: 이번 시즌 지표 */}
        <div className="pb-8 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-baseline justify-between mb-6 pb-3 border-b border-slate-200/80 dark:border-slate-800">
            <h2 className="font-black text-lg text-slate-900 dark:text-white">
              이번 시즌 지표
            </h2>
          </div>

          {highlights.length === 0 ? (
            <div className="py-10 text-center text-slate-400 dark:text-slate-500 text-xs">
              <span className="text-3xl block mb-2">📈</span>
              집계된 시즌 하이라이트 지표가 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800">
              {highlights.map((h) => (
                <div
                  key={h.label}
                  className="pt-3 sm:pt-0 sm:px-4 first:pl-0 last:border-r-0 cursor-pointer group"
                >
                  <div className="text-xs text-slate-400 dark:text-slate-500 mb-2 font-medium">
                    {h.label}
                  </div>
                  <div className="font-black text-2xl md:text-3xl text-slate-900 dark:text-white group-hover:text-[#f99e1a] dark:group-hover:text-[#f99e1a] transition-colors mb-1">
                    {h.value}
                  </div>
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {h.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 섹션 3: 최근 경기 결과 */}
        <div>
          <div className="flex items-baseline justify-between mb-5 pb-3 border-b border-slate-200/80 dark:border-slate-800">
            <h2 className="font-black text-lg text-slate-900 dark:text-white">
              최근 경기 결과
            </h2>
          </div>

          {matches.length === 0 ? (
            <div className="py-10 text-center text-slate-400 dark:text-slate-500 text-xs">
              <span className="text-3xl block mb-2">⚔️</span>
              최근 진행된 경기 결과가 없습니다.
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800/80">
              {matches.map((m, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 py-4 cursor-pointer hover:pl-2 transition-all group"
                >
                  <span className="font-mono text-xs text-slate-400 dark:text-slate-500 w-28 md:w-32 shrink-0">
                    {m.tag}
                  </span>
                  <span className="flex-1 font-bold text-xs md:text-sm text-slate-900 dark:text-white group-hover:text-[#f99e1a] dark:group-hover:text-[#f99e1a] transition-colors">
                    {m.names}
                  </span>
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white mr-3">
                    {m.score}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      m.result === "win"
                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                        : "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                    }`}
                  >
                    {m.result === "win" ? "승리" : "패배"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </main>

      {/* 4. 하단 사용자 고정 푸터 */}
      <UserFooter />
    </div>
  );
}


