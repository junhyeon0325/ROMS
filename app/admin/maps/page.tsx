// app/admin/maps/page.tsx
"use client";

import React, { useState } from "react";
import { useAdmin } from "@/lib/context/AdminContext";
import { MapItem } from "@/lib/types/admin";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
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
  const [selectedMapId, setSelectedMapId] = useState<string | null>("MAP-01");

  const [mapForm, setMapForm] = useState({
    nameKr: "왕의 길",
    nameEn: "King's Row",
    mode: "혼합" as "혼합" | "호위" | "쟁탈" | "플래시포인트" | "밀기",
    location: "영국 런던",
    isActive: true,
    desc: "좁은 골목길과 지하 거점이 특징인 전통적인 인기 하이브리드 전장.",
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
    <section className="space-y-6">
      {/* 1) 메인 타이틀 & 부연 설명 */}
      <AdminPageHeader
        title="맵(전장) 등록"
        description="오버워치 2 공식 전장(맵)과 게임 모드를 등록하고 공식 맵풀 운영 여부를 관리할 수 있습니다."
      />

      {/* 2) 2단 분할 레이아웃 */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* [좌측 7컬럼] 등록된 전장 조회 */}
        <div className="xl:col-span-7">
          <AdminCard
            title="등록된 전장(맵) 조회"
            countBadge={`총 ${filteredMapList.length}건`}
          >
            {/* 검색 & 필터 박스 */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 mb-4 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  맵 이름 또는 위치 검색
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="국문/영문 전장명 또는 국가 검색..."
                  value={mapSearch}
                  onChange={(e) => setMapSearch(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-3">
                  {(["혼합", "호위", "쟁탈", "플래시포인트", "밀기"] as const).map((m) => (
                    <label
                      key={m}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700"
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

            {/* 전장 목록 테이블 */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-800">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold">
                    <th className="px-3.5 py-3">전장명 (국문 / 영문)</th>
                    <th className="px-3.5 py-3 w-28">모드</th>
                    <th className="px-3.5 py-3 w-32">지역</th>
                    <th className="px-3.5 py-3 w-24">맵풀 여부</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-[#111726]">
                  {filteredMapList.map((m) => {
                    const isSelected = selectedMapId === m.id;
                    return (
                      <tr
                        key={m.id}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-blue-50/80 dark:bg-blue-950/40 font-medium"
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
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
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
                  })}
                </tbody>
              </table>
            </div>
          </AdminCard>
        </div>

        {/* [우측 5컬럼] 전장 정보 등록 및 수정 폼 */}
        <div className="xl:col-span-5">
          <AdminCard
            title="전장 정보 등록 / 수정"
            actions={
              <AdminFormActions
                onSave={handleSaveMap}
                onDelete={selectedMapId ? handleDeleteMap : undefined}
                onNew={handleNewMap}
                isEditing={!!selectedMapId}
              />
            }
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    전장명 (국문) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="예: 왕의 길"
                    value={mapForm.nameKr}
                    onChange={(e) =>
                      setMapForm((p) => ({ ...p, nameKr: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    전장명 (영문) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
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
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
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
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
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
                      className="text-blue-600 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
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

      {/* 3) 푸터 안내 바 */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 dark:text-slate-500 pt-6 pb-2 border-t border-slate-200 dark:border-slate-800 gap-2 text-center sm:text-left">
        <span className="font-semibold text-slate-600 dark:text-slate-400">ROMS · 맵(전장) 등록 관리</span>
        <span>등록된 전장 데이터는 세트별 전장 선택 및 밴픽 시스템에 연동됩니다.</span>
      </div>
    </section>
  );
}
