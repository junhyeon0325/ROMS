// app/admin/game-modes/page.tsx
/**
 * [게임 모드 관리 페이지 컴포넌트]
 * - 오버워치 경기 방식(쟁탈, 혼합, 호위, 밀기 등) 관리 화면 (URL: "/admin/game-modes")
 * - 모드별 승리 조건, 제한 시간 설정 및 신규 모드 등록/수정 폼 제공
 */
"use client";

import React, { useState } from "react";
import { useAdmin } from "@/lib/context/AdminContext";
import AdminCard from "@/components/admin/AdminCard";
import AdminFormActions from "@/components/admin/AdminFormActions";

export interface GameModeItem {
  id: string;
  code: string;
  nameKr: string;
  nameEn: string;
  winCondition: string;
  timeLimit: string;
  targetScore: string;
  isActive: boolean;
  desc: string;
  icon: string;
}

const initialGameModes: GameModeItem[] = [];

export default function AdminGameModesPage() {
  const { showFeedback } = useAdmin();

  const [gameModes, setGameModes] = useState<GameModeItem[]>(initialGameModes);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [selectedModeId, setSelectedModeId] = useState<string | null>(null);

  const [modeForm, setModeForm] = useState({
    code: "",
    nameKr: "",
    nameEn: "",
    winCondition: "",
    timeLimit: "",
    targetScore: "",
    isActive: true,
    desc: "",
    icon: "🎮",
  });


  const filteredModes = gameModes.filter((m) => {
    const matchesSearch =
      m.nameKr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      activeFilter === "ALL" ||
      (activeFilter === "ACTIVE" && m.isActive) ||
      (activeFilter === "INACTIVE" && !m.isActive);
    return matchesSearch && matchesFilter;
  });

  const handleSelectMode = (m: GameModeItem) => {
    setSelectedModeId(m.id);
    setModeForm({
      code: m.code,
      nameKr: m.nameKr,
      nameEn: m.nameEn,
      winCondition: m.winCondition,
      timeLimit: m.timeLimit,
      targetScore: m.targetScore,
      isActive: m.isActive,
      desc: m.desc,
      icon: m.icon,
    });
  };

  const handleNewMode = () => {
    setSelectedModeId(null);
    setModeForm({
      code: "",
      nameKr: "",
      nameEn: "",
      winCondition: "",
      timeLimit: "",
      targetScore: "",
      isActive: true,
      desc: "",
      icon: "🎮",
    });
    showFeedback("신규 게임 모드 등록 모드로 전환되었습니다.");
  };

  const handleSaveMode = () => {
    if (!modeForm.nameKr.trim() || !modeForm.code.trim()) {
      showFeedback("모드 국문 이름과 모드 코드를 입력해주세요.");
      return;
    }

    if (selectedModeId) {
      setGameModes((prev) =>
        prev.map((m) => (m.id === selectedModeId ? { ...m, ...modeForm } : m))
      );
      showFeedback(`게임 모드 [${modeForm.nameKr}] 정보가 저장되었습니다.`);
    } else {
      const newId = `MODE-0${gameModes.length + 1}`;
      const newItem: GameModeItem = { id: newId, ...modeForm };
      setGameModes((prev) => [...prev, newItem]);
      setSelectedModeId(newId);
      showFeedback(`신규 게임 모드 [${modeForm.nameKr}] 등록이 완료되었습니다.`);
    }
  };

  const handleDeleteMode = () => {
    if (!selectedModeId) return;
    setGameModes((prev) => prev.filter((m) => m.id !== selectedModeId));
    handleNewMode();
    showFeedback("게임 모드가 삭제되었습니다.");
  };

  const handleToggleStatus = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setGameModes((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const nextState = !m.isActive;
          showFeedback(`[${m.nameKr}] 모드가 ${nextState ? "공식 모드로 활성화" : "비활성화"}되었습니다.`);
          return { ...m, isActive: nextState };
        }
        return m;
      })
    );
  };

  return (
    <section className="h-full min-h-0 flex flex-col">
      {/* 2단 레이아웃 */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full min-h-0 flex-1">
        {/* 좌측 7컬럼: 게임 모드 목록 */}
        <div className="xl:col-span-7 h-full min-h-0 flex flex-col">
          <AdminCard
            title="등록된 게임 모드 목록"
            countBadge={`총 ${filteredModes.length}종`}
            className="h-full"
          >
            {/* 검색 및 필터 */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 mb-3 space-y-2.5 shrink-0">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  모드명 또는 코드 검색
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f99e1a]/20 focus:border-[#f99e1a] transition-all"
                  placeholder="모드명 (예: 혼합, Hybrid, ESCORT) 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                {(["ALL", "ACTIVE", "INACTIVE"] as const).map((filterKey) => (
                  <button
                    key={filterKey}
                    type="button"
                    onClick={() => setActiveFilter(filterKey)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                      activeFilter === filterKey
                        ? "bg-[#f99e1a] text-slate-950 font-bold"
                        : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {filterKey === "ALL" ? "전체" : filterKey === "ACTIVE" ? "공식 활성 모드" : "비활성"}
                  </button>
                ))}
              </div>
            </div>

            {/* 카드 리스트 (내부 스크롤) */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1.5 custom-scrollbar">
              {filteredModes.map((mode) => {
                const isSelected = mode.id === selectedModeId;

                return (
                  <div
                    key={mode.id}
                    onClick={() => handleSelectMode(mode)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-amber-500/10 dark:bg-amber-500/15 border-[#f99e1a] shadow-xs"
                        : "bg-white dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl p-2 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        {mode.icon}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {mode.nameKr}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            ({mode.nameEn})
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">
                            {mode.code}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                          {mode.winCondition} · {mode.targetScore}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleToggleStatus(mode.id, e)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
                          mode.isActive
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {mode.isActive ? "대회 공식" : "미사용"}
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredModes.length === 0 && (
                <div className="text-center py-16 text-xs text-slate-400">
                  <span className="text-3xl block mb-2">🎮</span>
                  조건에 맞는 게임 모드가 없습니다.
                </div>
              )}
            </div>
          </AdminCard>
        </div>

        {/* 우측 5컬럼: 게임 모드 등록/수정 폼 */}
        <div className="xl:col-span-5 h-full min-h-0 flex flex-col">
          <AdminCard
            title={selectedModeId ? `게임 모드 상세 정보 (${modeForm.nameKr})` : "신규 게임 모드 등록"}
            className="h-full"
            actions={
              <AdminFormActions
                onSave={handleSaveMode}
                onDelete={selectedModeId ? handleDeleteMode : undefined}
                onNew={handleNewMode}
                isEditing={!!selectedModeId}
              />
            }
          >
            <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1.5 custom-scrollbar">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    모드 국문명 *
                  </label>
                  <input
                    type="text"
                    value={modeForm.nameKr}
                    onChange={(e) => setModeForm({ ...modeForm, nameKr: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                    placeholder="예: 혼합, 호위, 쟁탈..."
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    모드 영문명
                  </label>
                  <input
                    type="text"
                    value={modeForm.nameEn}
                    onChange={(e) => setModeForm({ ...modeForm, nameEn: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                    placeholder="예: Hybrid, Escort..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    시스템 코드 *
                  </label>
                  <input
                    type="text"
                    value={modeForm.code}
                    onChange={(e) => setModeForm({ ...modeForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-mono uppercase"
                    placeholder="HYBRID, CONTROL..."
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    대표 이모지/아이콘
                  </label>
                  <input
                    type="text"
                    value={modeForm.icon}
                    onChange={(e) => setModeForm({ ...modeForm, icon: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                    placeholder="🏰, 🚚, 🎯, ⚡..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  승리 조건
                </label>
                <input
                  type="text"
                  value={modeForm.winCondition}
                  onChange={(e) => setModeForm({ ...modeForm, winCondition: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                  placeholder="예: 거점 점령 후 화물 목적지 호위"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    경기 제한 시간
                  </label>
                  <input
                    type="text"
                    value={modeForm.timeLimit}
                    onChange={(e) => setModeForm({ ...modeForm, timeLimit: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                    placeholder="예: 기본 4분"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    목표 점수
                  </label>
                  <input
                    type="text"
                    value={modeForm.targetScore}
                    onChange={(e) => setModeForm({ ...modeForm, targetScore: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                    placeholder="예: 최대 3점, 2선승"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  규칙 및 운영 설명
                </label>
                <textarea
                  rows={4}
                  value={modeForm.desc}
                  onChange={(e) => setModeForm({ ...modeForm, desc: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 resize-none"
                  placeholder="게임 모드에 대한 상세 규칙을 입력하세요."
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    대회 공식 모드 여부
                  </span>
                  <p className="text-[11px] text-slate-400">
                    비활성화 시 정규 리그 세트 배정에서 제외됩니다.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={modeForm.isActive}
                  onChange={(e) => setModeForm({ ...modeForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-[#f99e1a] focus:ring-[#f99e1a] accent-[#f99e1a]"
                />
              </div>
            </div>
          </AdminCard>
        </div>
      </div>
    </section>
  );
}
