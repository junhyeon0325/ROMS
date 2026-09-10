// app/admin/tournaments/page.tsx
"use client";

import React, { useState } from "react";
import { useAdmin } from "@/lib/context/AdminContext";
import { TournamentItem } from "@/lib/types/admin";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminCard from "@/components/admin/AdminCard";
import AdminFormActions from "@/components/admin/AdminFormActions";

export default function AdminTournamentsPage() {
  const { tournaments, setTournaments, showFeedback } = useAdmin();

  const [tournamentSearch, setTournamentSearch] = useState("");
  const [tournamentStatusFilter, setTournamentStatusFilter] = useState({
    진행중: true,
    접수중: true,
    종료: true,
  });
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>("TOUR-005");

  const [tournamentForm, setTournamentForm] = useState({
    name: "러너리그 Season 05",
    status: "진행중" as "진행중" | "접수중" | "종료",
    organizer: "러너 (Runner)",
    period: "2026.07.15 ~ 2026.08.30",
    teams: 8,
    prize: "10,000,000원",
    desc: "오버워치 2 러너 정규 e스포츠 리그 시즌 5",
  });

  const filteredTournamentList = tournaments.filter((t) => {
    const matchSearch =
      t.name.toLowerCase().includes(tournamentSearch.toLowerCase()) ||
      t.organizer.toLowerCase().includes(tournamentSearch.toLowerCase());
    const matchStatus = tournamentStatusFilter[t.status];
    return matchSearch && matchStatus;
  });

  const handleSelectTournament = (t: TournamentItem) => {
    setSelectedTournamentId(t.id);
    setTournamentForm({
      name: t.name,
      status: t.status,
      organizer: t.organizer,
      period: t.period,
      teams: t.teams,
      prize: t.prize,
      desc: t.desc,
    });
  };

  const handleNewTournament = () => {
    setSelectedTournamentId(null);
    setTournamentForm({
      name: "",
      status: "접수중",
      organizer: "러너 (Runner)",
      period: "2026.09.01 ~ 2026.10.15",
      teams: 8,
      prize: "5,000,000원",
      desc: "",
    });
    showFeedback("신규 대회 등록 모드로 전환되었습니다.");
  };

  const handleSaveTournament = () => {
    if (!tournamentForm.name.trim()) {
      showFeedback("대회명을 입력해주세요.");
      return;
    }
    if (selectedTournamentId) {
      setTournaments((prev) =>
        prev.map((t) =>
          t.id === selectedTournamentId ? { ...t, ...tournamentForm } : t,
        ),
      );
      showFeedback(`대회 [${tournamentForm.name}] 정보가 저장되었습니다.`);
    } else {
      const newId = `TOUR-00${tournaments.length + 5}`;
      const newItem: TournamentItem = { id: newId, ...tournamentForm };
      setTournaments((prev) => [newItem, ...prev]);
      setSelectedTournamentId(newId);
      showFeedback(`신규 대회 [${tournamentForm.name}] 등록 완료되었습니다.`);
    }
  };

  const handleDeleteTournament = () => {
    if (!selectedTournamentId) return;
    setTournaments((prev) => prev.filter((t) => t.id !== selectedTournamentId));
    handleNewTournament();
    showFeedback("대회 정보가 삭제되었습니다.");
  };

  return (
    <section className="space-y-6">
      {/* 1) 메인 타이틀 & 부연 설명 */}
      <AdminPageHeader
        title="대회 등록"
        description="시즌 및 정규 리그 대회 정보를 등록하고 진행 상태와 상금 규모를 관리할 수 있습니다."
      />

      {/* 2) 2단 분할 레이아웃 */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* [좌측 7컬럼] 등록된 대회 조회 */}
        <div className="xl:col-span-7">
          <AdminCard
            title="등록된 대회 조회"
            countBadge={`총 ${filteredTournamentList.length}건`}
          >
            {/* 검색 & 필터 박스 */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 mb-4 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  대회명 또는 주최자 검색
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="대회명 또는 주최자 검색..."
                  value={tournamentSearch}
                  onChange={(e) => setTournamentSearch(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-3">
                  {(["진행중", "접수중", "종료"] as const).map((stat) => (
                    <label
                      key={stat}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700"
                        checked={tournamentStatusFilter[stat]}
                        onChange={(e) =>
                          setTournamentStatusFilter((p) => ({
                            ...p,
                            [stat]: e.target.checked,
                          }))
                        }
                      />
                      <span>{stat}</span>
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:underline transition-colors"
                  onClick={() => {
                    setTournamentSearch("");
                    setTournamentStatusFilter({ 진행중: true, 접수중: true, 종료: true });
                  }}
                >
                  필터 초기화
                </button>
              </div>
            </div>

            {/* 대회 목록 테이블 */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-800">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold">
                    <th className="px-3.5 py-3">대회명 / 주최</th>
                    <th className="px-3.5 py-3 w-24">상태</th>
                    <th className="px-3.5 py-3 w-28">규모 / 상금</th>
                    <th className="px-3.5 py-3 w-32">진행 기간</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-[#111726]">
                  {filteredTournamentList.map((t) => {
                    const isSelected = selectedTournamentId === t.id;
                    return (
                      <tr
                        key={t.id}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-blue-50/80 dark:bg-blue-950/40 font-medium"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        }`}
                        onClick={() => handleSelectTournament(t)}
                      >
                        <td className="px-3.5 py-3">
                          <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                            {t.name}
                          </div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                            주최: {t.organizer} · ID: {t.id}
                          </div>
                        </td>
                        <td className="px-3.5 py-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              t.status === "진행중"
                                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                                : t.status === "접수중"
                                ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td className="px-3.5 py-3">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {t.teams}개 팀
                          </div>
                          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                            {t.prize}
                          </div>
                        </td>
                        <td className="px-3.5 py-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          {t.period}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </AdminCard>
        </div>

        {/* [우측 5컬럼] 대회 정보 등록 및 수정 폼 */}
        <div className="xl:col-span-5">
          <AdminCard
            title="대회 정보 등록 / 수정"
            actions={
              <AdminFormActions
                onSave={handleSaveTournament}
                onDelete={selectedTournamentId ? handleDeleteTournament : undefined}
                onNew={handleNewTournament}
                isEditing={!!selectedTournamentId}
              />
            }
          >
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  대회명 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="예: 러너리그 Season 05"
                  value={tournamentForm.name}
                  onChange={(e) =>
                    setTournamentForm((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  진행 상태
                </label>
                <div className="flex gap-2">
                  {(["접수중", "진행중", "종료"] as const).map((stat) => (
                    <label
                      key={stat}
                      className={`flex-1 text-center py-2 text-xs font-semibold rounded-xl border cursor-pointer transition-all ${
                        tournamentForm.status === stat
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <input
                        type="radio"
                        name="status"
                        className="hidden"
                        checked={tournamentForm.status === stat}
                        onChange={() =>
                          setTournamentForm((p) => ({ ...p, status: stat }))
                        }
                      />
                      <span>{stat}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    주최자 / 주관
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={tournamentForm.organizer}
                    onChange={(e) =>
                      setTournamentForm((p) => ({ ...p, organizer: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    진행 기간
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                    placeholder="YYYY.MM.DD ~ YYYY.MM.DD"
                    value={tournamentForm.period}
                    onChange={(e) =>
                      setTournamentForm((p) => ({ ...p, period: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    참가 팀 수
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={tournamentForm.teams}
                    onChange={(e) =>
                      setTournamentForm((p) => ({
                        ...p,
                        teams: Number(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    총 상금 규모
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={tournamentForm.prize}
                    onChange={(e) =>
                      setTournamentForm((p) => ({ ...p, prize: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  대회 소개 및 룰 메모
                </label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                  placeholder="대회 개요 및 참가 규정을 입력하세요."
                  value={tournamentForm.desc}
                  onChange={(e) =>
                    setTournamentForm((p) => ({ ...p, desc: e.target.value }))
                  }
                />
              </div>
            </div>
          </AdminCard>
        </div>
      </div>

      {/* 3) 푸터 안내 바 */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 dark:text-slate-500 pt-6 pb-2 border-t border-slate-200 dark:border-slate-800 gap-2 text-center sm:text-left">
        <span className="font-semibold text-slate-600 dark:text-slate-400">ROMS · 대회 등록 관리</span>
        <span>등록된 대회 정보는 경기 일정 및 대진표에 연동됩니다.</span>
      </div>
    </section>
  );
}
