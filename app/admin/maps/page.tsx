// app/admin/maps/page.tsx
/**
 * [전장(맵) 풀 관리 페이지 컴포넌트]
 * - 오버워치 전장 풀(Map Pool) 데이터 관리 화면 (URL: "/admin/maps")
 * - 게임 모드별 전장 목록 조회, 신규 전장 등록 및 전장 활성/비활성 설정 폼 제공
 */
"use client";

import React, { useState } from "react";
import { useAdmin } from "@/lib/context/AdminContext";
import { MapItem } from "@/lib/types/admin";
import AdminCard from "@/components/admin/AdminCard";
import AdminFormActions from "@/components/admin/AdminFormActions";

export default function AdminMapsPage() {
  const { maps, setMaps, showFeedback } = useAdmin();

  const [mapSearch, setMapSearch] = useState("");
  const [mapModeFilter, setMapModeFilter] = useState({
    혼합: true,
    호위: true,
    쟁탈: true,
    플래시포인트: true,
    밀기: true,
  });
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);

  const [mapForm, setMapForm] = useState({
    nameKr: "",
    nameEn: "",
    mode: "혼합" as "혼합" | "호위" | "쟁탈" | "플래시포인트" | "밀기",
    location: "",
    isActive: true,
    desc: "",
  });


  const filteredMapList = maps.filter((m) => {
    const matchSearch =
      m.nameKr.toLowerCase().includes(mapSearch.toLowerCase()) ||
      m.nameEn.toLowerCase().includes(mapSearch.toLowerCase()) ||
      m.location.toLowerCase().includes(mapSearch.toLowerCase());
    const matchMode = mapModeFilter[m.mode];
    return matchSearch && matchMode;
  });

  const handleSelectMap = (m: MapItem) => {
    setSelectedMapId(m.id);
    setMapForm({
      nameKr: m.nameKr,
      nameEn: m.nameEn,
      mode: m.mode,
      location: m.location,
      isActive: m.isActive,
      desc: m.desc || "",
    });
  };

  const handleNewMap = () => {
    setSelectedMapId(null);
    setMapForm({
      nameKr: "",
      nameEn: "",
      mode: "혼합",
      location: "",
      isActive: true,
      desc: "",
    });
    showFeedback("신규 맵 등록 모드로 전환되었습니다.");
  };

  const handleSaveMap = () => {
    if (!mapForm.nameKr.trim()) {
      showFeedback("국문 전장명을 입력해주세요.");
      return;
    }
    if (selectedMapId) {
      setMaps((prev) =>
        prev.map((m) => (m.id === selectedMapId ? { ...m, ...mapForm } : m)),
      );
      showFeedback(`전장 [${mapForm.nameKr}] 정보가 저장되었습니다.`);
    } else {
      const newId = `MAP-0${maps.length + 1}`;
      const newItem: MapItem = { id: newId, ...mapForm };
      setMaps((prev) => [newItem, ...prev]);
      setSelectedMapId(newId);
      showFeedback(`신규 전장 [${mapForm.nameKr}] 등록 완료되었습니다.`);
    }
  };

  const handleDeleteMap = () => {
    if (!selectedMapId) return;
    setMaps((prev) => prev.filter((m) => m.id !== selectedMapId));
    handleNewMap();
    showFeedback("전장 정보가 삭제되었습니다.");
  };

  return (
    <section className="h-full min-h-0 flex flex-col">
      {/* 2단 분할 레이아웃 */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full min-h-0 flex-1">
        {/* [좌측 7컬럼] 등록된 전장 조회 */}
        <div className="xl:col-span-7 h-full min-h-0 flex flex-col">
          <AdminCard
            title="등록된 전장(맵) 조회"
            countBadge={`총 ${filteredMapList.length}건`}
            className="h-full"
          >
            {/* 검색 & 필터 박스 */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 mb-3 space-y-2.5 shrink-0">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  맵 이름 또는 위치 검색
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f99e1a]/20 focus:border-[#f99e1a] transition-all"
                  placeholder="맵 이름 또는 배경 지역 검색..."
                  value={mapSearch}
                  onChange={(e) => setMapSearch(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                <div className="flex items-center gap-3">
                  {(["혼합", "호위", "쟁탈", "플래시포인트", "밀기"] as const).map((m) => (
                    <label
                      key={m}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-[#f99e1a] focus:ring-[#f99e1a] accent-[#f99e1a] dark:bg-slate-800 dark:border-slate-700"
                        checked={mapModeFilter[m]}
                        onChange={(e) =>
                          setMapModeFilter((p) => ({ ...p, [m]: e.target.checked }))
                        }
                      />
                      <span>{m}</span>
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:underline transition-colors"
                  onClick={() => {
                    setMapSearch("");
                    setMapModeFilter({ 혼합: true, 호위: true, 쟁탈: true, 플래시포인트: true, 밀기: true });
                  }}
                >
                  필터 초기화
                </button>
              </div>
            </div>

            {/* 전장 목록 테이블 (그리드 내부 스크롤) */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 custom-scrollbar relative">
              <table className="w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-[#151c2e] shadow-2xs">
                  <tr className="text-slate-600 dark:text-slate-300 font-semibold">
                    <th className="px-3.5 py-2.5 bg-slate-100 dark:bg-[#151c2e]">전장명 (국문 / 영문)</th>
                    <th className="px-3.5 py-2.5 w-28 bg-slate-100 dark:bg-[#151c2e]">모드</th>
                    <th className="px-3.5 py-2.5 w-32 bg-slate-100 dark:bg-[#151c2e]">지역</th>
                    <th className="px-3.5 py-2.5 w-24 bg-slate-100 dark:bg-[#151c2e]">맵풀 여부</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-[#111726]">
                  {filteredMapList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3.5 py-16 text-center text-slate-400 dark:text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span className="text-3xl">🗺️</span>
                          <p className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                            등록된 전장(맵)이 없습니다.
                          </p>
                          <p className="text-[11px] text-slate-400">
                            우측 등록 폼에서 새로운 전장을 등록해주세요.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredMapList.map((m) => {
                      const isSelected = selectedMapId === m.id;
                      return (
                        <tr
                          key={m.id}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-amber-500/10 dark:bg-amber-500/15 font-medium border-l-2 border-[#f99e1a]"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                          }`}
                          onClick={() => handleSelectMap(m)}
                        >
                          <td className="px-3.5 py-3">
                            <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                              {m.nameKr}
                            </div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                              {m.nameEn} · {m.id}
                            </div>
                          </td>
                          <td className="px-3.5 py-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-[#f99e1a] dark:text-amber-400 border border-amber-500/30">
                              {m.mode}
                            </span>
                          </td>
                          <td className="px-3.5 py-3 text-slate-600 dark:text-slate-300">
                            {m.location}
                          </td>
                          <td className="px-3.5 py-3">
                            <span
                              className={`text-xs font-bold ${
                                m.isActive
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-slate-400 dark:text-slate-600"
                              }`}
                            >
                              {m.isActive ? "공식 승인" : "미지정"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </AdminCard>
        </div>

        {/* [우측 5컬럼] 전장 정보 등록 및 수정 폼 */}
        <div className="xl:col-span-5 h-full min-h-0 flex flex-col">
          <AdminCard
            title="전장 정보 등록 / 수정"
            className="h-full"
            actions={
              <AdminFormActions
                onSave={handleSaveMap}
                onDelete={selectedMapId ? handleDeleteMap : undefined}
                onNew={handleNewMap}
                isEditing={!!selectedMapId}
              />
            }
          >
            <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1.5 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    전장명 (국문) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f99e1a]/20 focus:border-[#f99e1a] transition-all"
                    placeholder="예: 킹스 로우"
                    value={mapForm.nameKr}
                    onChange={(e) =>
                      setMapForm((p) => ({ ...p, nameKr: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    영문 전장명 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f99e1a]/20 focus:border-[#f99e1a] transition-all font-mono"
                    placeholder="예: King's Row"
                    value={mapForm.nameEn}
                    onChange={(e) =>
                      setMapForm((p) => ({ ...p, nameEn: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  게임 모드
                </label>
                <div className="flex flex-wrap gap-2">
                  {(["혼합", "호위", "쟁탈", "플래시포인트", "밀기"] as const).map((mode) => (
                    <label
                      key={mode}
                      className={`flex-1 min-w-[60px] text-center py-2 text-xs font-semibold rounded-xl border cursor-pointer transition-all ${
                        mapForm.mode === mode
                          ? "bg-[#f99e1a] text-slate-950 font-bold border-[#f99e1a] shadow-sm"
                          : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                      }`}
                    >
                      <input
                        type="radio"
                        name="mode"
                        className="hidden"
                        checked={mapForm.mode === mode}
                        onChange={() => setMapForm((p) => ({ ...p, mode }))}
                      />
                      <span>{mode}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  배경 지역 / 국가
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f99e1a]/20 focus:border-[#f99e1a] transition-all"
                  placeholder="예: 영국 런던"
                  value={mapForm.location}
                  onChange={(e) =>
                    setMapForm((p) => ({ ...p, location: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  공식 맵풀 채택 여부
                </label>
                <div className="flex gap-4 pt-1">
                  <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="isActive"
                      className="text-[#f99e1a] focus:ring-[#f99e1a] accent-[#f99e1a]"
                      checked={mapForm.isActive === true}
                      onChange={() => setMapForm((p) => ({ ...p, isActive: true }))}
                    />
                    <span>공식 맵풀 승인 (대회 사용)</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="isActive"
                      className="text-blue-600 focus:ring-blue-500"
                      checked={mapForm.isActive === false}
                      onChange={() => setMapForm((p) => ({ ...p, isActive: false }))}
                    />
                    <span>비활성 (미채택)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  전장 특징 및 밴픽 가이드
                </label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f99e1a]/20 focus:border-[#f99e1a] transition-all resize-none"
                  placeholder="전장의 주요 격전지 및 밴픽 유의사항을 입력하세요."
                  value={mapForm.desc}
                  onChange={(e) =>
                    setMapForm((p) => ({ ...p, desc: e.target.value }))
                  }
                />
              </div>
            </div>
          </AdminCard>
        </div>
      </div>
    </section>
  );
}
