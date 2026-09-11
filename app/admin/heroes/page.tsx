// app/admin/heroes/page.tsx
/**
 * [영웅 데이터 관리 페이지 컴포넌트]
 * - 오버워치 영웅 마스터 데이터 관리 화면 (URL: "/admin/heroes")
 * - 역할군(돌격/공격/지원)별 영웅 목록 조회, 신규 영웅 추가 및 픽 가능 여부 설정 폼 제공
 */
"use client";

import React, { useState } from "react";
import { useAdmin } from "@/lib/context/AdminContext";
import AdminCard from "@/components/admin/AdminCard";
import AdminFormActions from "@/components/admin/AdminFormActions";

export interface HeroItem {
  id: string;
  nameKr: string;
  nameEn: string;
  role: "돌격" | "공격" | "지원";
  difficulty: "쉬움" | "보통" | "어려움";
  isPickable: boolean;
  desc: string;
}

const initialHeroes: HeroItem[] = [];

export default function AdminHeroesPage() {
  const { showFeedback } = useAdmin();

  const [heroes, setHeroes] = useState<HeroItem[]>(initialHeroes);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "돌격" | "공격" | "지원">("ALL");
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);

  const [heroForm, setHeroForm] = useState({
    nameKr: "",
    nameEn: "",
    role: "돌격" as "돌격" | "공격" | "지원",
    difficulty: "보통" as "쉬움" | "보통" | "어려움",
    isPickable: true,
    desc: "",
  });


  const filteredHeroes = heroes.filter((h) => {
    const matchesSearch =
      h.nameKr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.nameEn.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "ALL" || h.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleSelectHero = (h: HeroItem) => {
    setSelectedHeroId(h.id);
    setHeroForm({
      nameKr: h.nameKr,
      nameEn: h.nameEn,
      role: h.role,
      difficulty: h.difficulty,
      isPickable: h.isPickable,
      desc: h.desc,
    });
  };

  const handleNewHero = () => {
    setSelectedHeroId(null);
    setHeroForm({
      nameKr: "",
      nameEn: "",
      role: "공격",
      difficulty: "보통",
      isPickable: true,
      desc: "",
    });
    showFeedback("신규 영웅 등록 모드로 전환되었습니다.");
  };

  const handleSaveHero = () => {
    if (!heroForm.nameKr.trim() || !heroForm.nameEn.trim()) {
      showFeedback("영웅 국문명과 영문명을 입력해주세요.");
      return;
    }

    if (selectedHeroId) {
      setHeroes((prev) =>
        prev.map((h) => (h.id === selectedHeroId ? { ...h, ...heroForm } : h))
      );
      showFeedback(`영웅 [${heroForm.nameKr}] 정보가 수정되었습니다.`);
    } else {
      const newId = `HERO-${String(heroes.length + 1).padStart(2, "0")}`;
      const newItem: HeroItem = { id: newId, ...heroForm };
      setHeroes((prev) => [newItem, ...prev]);
      setSelectedHeroId(newId);
      showFeedback(`신규 영웅 [${heroForm.nameKr}] 등록이 완료되었습니다.`);
    }
  };

  const handleDeleteHero = () => {
    if (!selectedHeroId) return;
    setHeroes((prev) => prev.filter((h) => h.id !== selectedHeroId));
    handleNewHero();
    showFeedback("영웅이 삭제되었습니다.");
  };

  const handleTogglePickable = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHeroes((prev) =>
      prev.map((h) => {
        if (h.id === id) {
          const next = !h.isPickable;
          showFeedback(`[${h.nameKr}] 영웅이 ${next ? "픽 가능" : "대회 밴(선택불가)"} 상태로 변경되었습니다.`);
          return { ...h, isPickable: next };
        }
        return h;
      })
    );
  };

  const roleColor = (role: "돌격" | "공격" | "지원") => {
    switch (role) {
      case "돌격":
        return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900";
      case "공격":
        return "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900";
      case "지원":
        return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900";
    }
  };

  const roleIcon = (role: "돌격" | "공격" | "지원") => {
    switch (role) {
      case "돌격":
        return "🛡️";
      case "공격":
        return "⚔️";
      case "지원":
        return "💉";
    }
  };

  return (
    <section className="h-full min-h-0 flex flex-col">
      {/* 2단 레이아웃 */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full min-h-0 flex-1">
        {/* 좌측 7컬럼: 영웅 목록 */}
        <div className="xl:col-span-7 h-full min-h-0 flex flex-col">
          <AdminCard
            title="등록된 영웅 목록"
            countBadge={`총 ${filteredHeroes.length}명`}
            className="h-full"
          >
            {/* 검색 및 역할군 필터 */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 mb-3 space-y-2.5 shrink-0">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  영웅 이름 검색
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f99e1a]/20 focus:border-[#f99e1a] transition-all"
                  placeholder="영웅 이름 (예: 디바, D.Va, 아나, Tracer...) 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                {(["ALL", "돌격", "공격", "지원"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRoleFilter(r)}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                      roleFilter === r
                        ? "bg-[#f99e1a] text-slate-950 font-bold shadow-xs"
                        : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>{r === "ALL" ? "🌐" : roleIcon(r as any)}</span>
                    <span>{r === "ALL" ? "전체 역할군" : r}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 영웅 목록 그리드 (내부 스크롤) */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-1.5 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredHeroes.map((hero) => {
                  const isSelected = hero.id === selectedHeroId;

                  return (
                    <div
                      key={hero.id}
                      onClick={() => handleSelectHero(hero)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                        isSelected
                          ? "bg-amber-500/10 dark:bg-amber-500/15 border-[#f99e1a] shadow-xs"
                          : "bg-white dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg shrink-0">
                          {roleIcon(hero.role)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {hero.nameKr}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {hero.nameEn}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${roleColor(
                                hero.role
                              )}`}
                            >
                              {hero.role}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              난이도: {hero.difficulty}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handleTogglePickable(hero.id, e)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-md border transition-colors ${
                            hero.isPickable
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                              : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800"
                          }`}
                        >
                          {hero.isPickable ? "픽 가능" : "밴 (선택불가)"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredHeroes.length === 0 && (
                <div className="text-center py-16 text-xs text-slate-400">
                  <span className="text-3xl block mb-2">🦸</span>
                  조건에 일치하는 영웅이 없습니다.
                </div>
              )}
            </div>
          </AdminCard>
        </div>

        {/* 우측 5컬럼: 영웅 상세/등록 폼 */}
        <div className="xl:col-span-5 h-full min-h-0 flex flex-col">
          <AdminCard
            title={selectedHeroId ? `영웅 상세 정보 (${heroForm.nameKr})` : "신규 영웅 등록"}
            className="h-full"
            actions={
              <AdminFormActions
                onSave={handleSaveHero}
                onDelete={selectedHeroId ? handleDeleteHero : undefined}
                onNew={handleNewHero}
                isEditing={!!selectedHeroId}
              />
            }
          >
            <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1.5 custom-scrollbar">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    영웅 국문명 *
                  </label>
                  <input
                    type="text"
                    value={heroForm.nameKr}
                    onChange={(e) => setHeroForm({ ...heroForm, nameKr: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                    placeholder="예: 트레이서, 디바..."
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    영웅 영문명 *
                  </label>
                  <input
                    type="text"
                    value={heroForm.nameEn}
                    onChange={(e) => setHeroForm({ ...heroForm, nameEn: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                    placeholder="예: Tracer, D.Va..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    역할군 (포지션)
                  </label>
                  <select
                    value={heroForm.role}
                    onChange={(e) =>
                      setHeroForm({ ...heroForm, role: e.target.value as any })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                  >
                    <option value="돌격">돌격 (Tank)</option>
                    <option value="공격">공격 (Damage)</option>
                    <option value="지원">지원 (Support)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    운용 난이도
                  </label>
                  <select
                    value={heroForm.difficulty}
                    onChange={(e) =>
                      setHeroForm({ ...heroForm, difficulty: e.target.value as any })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                  >
                    <option value="쉬움">쉬움 (★☆☆)</option>
                    <option value="보통">보통 (★★☆)</option>
                    <option value="어려움">어려움 (★★★)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  영웅 특징 및 기술 설명
                </label>
                <textarea
                  rows={4}
                  value={heroForm.desc}
                  onChange={(e) => setHeroForm({ ...heroForm, desc: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 resize-none"
                  placeholder="영웅의 플레이 스타일과 핵심 특성을 입력하세요."
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    대회 픽(선택) 허용 여부
                  </span>
                  <p className="text-[11px] text-slate-400">
                    비활성화 시 모든 공식 경기에서 글로벌 밴 처리됩니다.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={heroForm.isPickable}
                  onChange={(e) =>
                    setHeroForm({ ...heroForm, isPickable: e.target.checked })
                  }
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
