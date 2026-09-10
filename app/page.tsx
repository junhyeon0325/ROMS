// app/page.tsx
"use client";

import React, { useState } from "react";
import UserHeader from "@/components/layout/UserHeader";

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState("러너리그");
  const [searchQuery, setSearchQuery] = useState("");

  const roleLabel: Record<string, string> = {
    tank: "탱커",
    dps: "딜러",
    support: "힐러",
  };

  const ranking = [
    { name: "제타치즈", role: "dps", wins: 5, kda: "4.8", wr: "78%" },
    { name: "리코샤", role: "tank", wins: 4, kda: "3.1", wr: "71%" },
    { name: "후니베어", role: "support", wins: 3, kda: "5.2", wr: "66%" },
    { name: "폭풍우진", role: "dps", wins: 3, kda: "4.1", wr: "64%" },
    { name: "미스틱캣", role: "tank", wins: 2, kda: "2.9", wr: "58%" },
  ];

  const highlights = [
    { label: "최다처치", value: "60", name: "제타치즈" },
    { label: "최다도움", value: "30", name: "후니베어" },
    { label: "최다죽음", value: "15", name: "산왕이" },
    { label: "최다피해", value: "20k", name: "폭풍우진" },
    { label: "최다치유", value: "30k", name: "리코샤" },
    { label: "최다경감", value: "40k", name: "미스틱캣" },
  ];

  const matches = [
    {
      tag: "RUNNER · W5",
      names: "제타치즈 vs 산왕이",
      score: "3 : 1",
      result: "win",
    },
    {
      tag: "RIVAL · 8강",
      names: "리코샤 vs 노을빛",
      score: "2 : 3",
      result: "lose",
    },
    {
      tag: "RUNNER · W4",
      names: "후니베어 vs 폭풍우진",
      score: "3 : 2",
      result: "win",
    },
    {
      tag: "RIVAL · 4강",
      names: "미스틱캣 vs 제타치즈",
      score: "1 : 3",
      result: "lose",
    },
  ];

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF7] dark:bg-[#0B0E14] text-slate-900 dark:text-slate-100 transition-colors">
      {/* 1. 상단 사용자 헤더 */}
      <UserHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
      />

      {/* 2. 메인 배너 MVP */}
      <div className="max-w-6xl mx-auto px-6 md:px-12 pt-12 pb-10 relative overflow-hidden">
        {/* 장식용 배경 실루엣 */}
        <div className="absolute right-0 top-0 bottom-0 w-60 bg-amber-300/30 dark:bg-amber-400/15 -skew-x-12 translate-x-1/3 -z-10 pointer-events-none" />

        <div className="font-mono text-xs tracking-widest uppercase text-blue-600 dark:text-blue-400 font-bold mb-3.5">
          Season 05 · Runner League Champion
        </div>

        <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-8">
          <div className="font-black text-8xl md:text-[180px] leading-none tracking-tighter text-slate-900 dark:text-white relative inline-block select-none">
            5
            <span className="absolute right-1 bottom-3 font-mono font-bold text-sm tracking-wider text-blue-600 dark:text-blue-400">
              WINS
            </span>
          </div>

          <div className="pb-3 md:pb-5">
            <h1 className="font-black text-3xl md:text-4xl text-slate-900 dark:text-white mb-2 tracking-tight">
              제타치즈
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-4">
              딜러 · 최다처치 60 · K/D 평균 2.4 · 승률 78%
            </p>
            <button
              type="button"
              className="inline-flex items-center gap-2 bg-slate-900 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs px-5 py-3 rounded-lg transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              전적 상세보기 →
            </button>
          </div>
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

          <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800/80">
            {ranking.map((p, i) => (
              <div
                key={p.name}
                className="grid grid-cols-[36px_1fr_70px] md:grid-cols-[56px_1fr_120px_90px_90px] items-center py-4 cursor-pointer hover:pl-2.5 transition-all group select-none"
              >
                <span
                  className={`font-black text-xl md:text-2xl ${
                    i === 0
                      ? "text-blue-600 dark:text-blue-400"
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
                  <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
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
        </div>

        {/* 섹션 2: 이번 시즌 지표 */}
        <div className="pb-8 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-baseline justify-between mb-6 pb-3 border-b border-slate-200/80 dark:border-slate-800">
            <h2 className="font-black text-lg text-slate-900 dark:text-white">
              이번 시즌 지표
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800">
            {highlights.map((h) => (
              <div
                key={h.label}
                className="pt-3 sm:pt-0 sm:px-4 first:pl-0 last:border-r-0 cursor-pointer group"
              >
                <div className="text-xs text-slate-400 dark:text-slate-500 mb-2 font-medium">
                  {h.label}
                </div>
                <div className="font-black text-2xl md:text-3xl text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1">
                  {h.value}
                </div>
                <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {h.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 섹션 3: 최근 경기 결과 */}
        <div>
          <div className="flex items-baseline justify-between mb-5 pb-3 border-b border-slate-200/80 dark:border-slate-800">
            <h2 className="font-black text-lg text-slate-900 dark:text-white">
              최근 경기 결과
            </h2>
          </div>

          <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800/80">
            {matches.map((m, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 py-4 cursor-pointer hover:pl-2 transition-all group"
              >
                <span className="font-mono text-xs text-slate-400 dark:text-slate-500 w-28 md:w-32 shrink-0">
                  {m.tag}
                </span>
                <span className="flex-1 font-bold text-xs md:text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
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
        </div>
      </div>
    </div>
  );
}
