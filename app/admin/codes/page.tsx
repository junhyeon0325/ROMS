// app/admin/codes/page.tsx
/**
 * [공통 코드 관리 페이지 컴포넌트]
 * - 시스템 전반에서 쓰이는 공통 분류 코드(그룹/상세 코드) 관리 화면 (URL: "/admin/codes")
 * - 역할군, 티어, 경기 상태 등 표준 코드 목록 조회 및 등록/수정 폼 제공
 */
"use client";

import React, { useState } from "react";
import { useAdmin } from "@/lib/context/AdminContext";
import { CodeItem } from "@/lib/types/admin";
import AdminCard from "@/components/admin/AdminCard";
import AdminFormActions from "@/components/admin/AdminFormActions";

export default function AdminCodesPage() {
  const { codes, setCodes, showFeedback } = useAdmin();

  const [codeGroupFilter, setCodeGroupFilter] = useState("ALL");
  const [codeSearch, setCodeSearch] = useState("");
  const [selectedCodeId, setSelectedCodeId] = useState<string | null>(null);

  const [codeForm, setCodeForm] = useState({
    group: "MEMBER_ROLE",
    code: "",
    name: "",
    nameEn: "",
    sort: 1,
    useYn: "Y" as "Y" | "N",
    desc: "",
  });


  const filteredCodeList = codes.filter((c) => {
    const matchGroup = codeGroupFilter === "ALL" || c.group === codeGroupFilter;
    const matchSearch =
      c.code.toLowerCase().includes(codeSearch.toLowerCase()) ||
      c.name.toLowerCase().includes(codeSearch.toLowerCase());
    return matchGroup && matchSearch;
  });

  const handleSelectCode = (c: CodeItem) => {
    setSelectedCodeId(c.code);
    setCodeForm({
      group: c.group,
      code: c.code,
      name: c.name,
      nameEn: c.nameEn,
      sort: c.sort,
      useYn: c.useYn,
      desc: c.desc || "",
    });
  };

  const handleNewCode = () => {
    setSelectedCodeId(null);
    setCodeForm({
      group: codeGroupFilter === "ALL" ? "MEMBER_ROLE" : codeGroupFilter,
      code: "",
      name: "",
      nameEn: "",
      sort: 1,
      useYn: "Y",
      desc: "",
    });
    showFeedback("신규 코드 등록 모드로 전환되었습니다.");
  };

  const handleSaveCode = () => {
    if (!codeForm.code.trim() || !codeForm.name.trim()) {
      showFeedback("코드 ID와 코드명을 입력해주세요.");
      return;
    }
    if (selectedCodeId) {
      setCodes((prev) =>
        prev.map((c) => (c.code === selectedCodeId ? { ...c, ...codeForm } : c)),
      );
      showFeedback(`코드 [${codeForm.code}] 정보가 저장되었습니다.`);
    } else {
      setCodes((prev) => [codeForm, ...prev]);
      setSelectedCodeId(codeForm.code);
      showFeedback(`신규 코드 [${codeForm.code}] 등록 완료되었습니다.`);
    }
  };

  const handleDeleteCode = () => {
    if (!selectedCodeId) return;
    setCodes((prev) => prev.filter((c) => c.code !== selectedCodeId));
    handleNewCode();
    showFeedback("코드 정보가 삭제되었습니다.");
  };

  return (
    <section className="h-full min-h-0 flex flex-col">
      {/* 2단 분할 레이아웃 */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full min-h-0 flex-1">
        {/* [좌측 7컬럼] 등록된 코드 조회 */}
        <div className="xl:col-span-7 h-full min-h-0 flex flex-col">
          <AdminCard
            title="등록된 코드 조회"
            countBadge={`총 ${filteredCodeList.length}건`}
            className="h-full"
          >
            {/* 검색 & 그룹 필터 박스 */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 mb-3 space-y-2.5 shrink-0">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  코드 그룹 필터
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: "ALL", label: "전체" },
                    { id: "MEMBER_ROLE", label: "참가자 역할" },
                    { id: "MAP_MODE", label: "전장 모드" },
                    { id: "TOUR_STAT", label: "대회 상태" },
                  ].map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        codeGroupFilter === g.id
                          ? "bg-[#f99e1a] text-slate-950 font-bold shadow-xs"
                          : "bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                      onClick={() => setCodeGroupFilter(g.id)}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f99e1a]/20 focus:border-[#f99e1a] transition-all"
                  placeholder="코드 ID 또는 코드명 검색..."
                  value={codeSearch}
                  onChange={(e) => setCodeSearch(e.target.value)}
                />
              </div>
            </div>

            {/* 코드 목록 테이블 (그리드 내부 스크롤) */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 custom-scrollbar relative">
              <table className="w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-[#151c2e] shadow-2xs">
                  <tr className="text-slate-600 dark:text-slate-300 font-semibold">
                    <th className="px-3.5 py-2.5 w-32 bg-slate-100 dark:bg-[#151c2e]">코드 ID</th>
                    <th className="px-3.5 py-2.5 bg-slate-100 dark:bg-[#151c2e]">코드명 (국문/영문)</th>
                    <th className="px-3.5 py-2.5 w-20 bg-slate-100 dark:bg-[#151c2e]">순서</th>
                    <th className="px-3.5 py-2.5 w-24 bg-slate-100 dark:bg-[#151c2e]">사용여부</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-[#111726]">
                  {filteredCodeList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3.5 py-16 text-center text-slate-400 dark:text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span className="text-3xl">⚙️</span>
                          <p className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                            등록된 공통코드가 없습니다.
                          </p>
                          <p className="text-[11px] text-slate-400">
                            우측 등록 폼에서 새로운 시스템 코드를 등록해주세요.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCodeList.map((c) => {
                      const isSelected = selectedCodeId === c.code;
                      return (
                        <tr
                          key={c.code}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-amber-500/10 dark:bg-amber-500/15 font-medium border-l-2 border-[#f99e1a]"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                          }`}
                          onClick={() => handleSelectCode(c)}
                        >
                          <td className="px-3.5 py-3 font-mono font-bold text-[#f99e1a] dark:text-amber-400">
                            {c.code}
                          </td>
                          <td className="px-3.5 py-3">
                            <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                              {c.name}
                            </div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                              {c.nameEn} · [{c.group}]
                            </div>
                          </td>
                          <td className="px-3.5 py-3 text-slate-500 dark:text-slate-400 font-mono">
                            {c.sort}
                          </td>
                          <td className="px-3.5 py-3">
                            <span
                              className={`text-xs font-bold ${
                                c.useYn === "Y"
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-slate-400 dark:text-slate-600"
                              }`}
                            >
                              {c.useYn === "Y" ? "사용" : "미사용"}
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

        {/* [우측 5컬럼] 코드 등록 관리 */}
        <div className="xl:col-span-5 h-full min-h-0 flex flex-col">
          <AdminCard
            title="코드 등록 / 상세 관리"
            className="h-full"
            actions={
              <AdminFormActions
                onSave={handleSaveCode}
                onDelete={selectedCodeId ? handleDeleteCode : undefined}
                onNew={handleNewCode}
                isEditing={!!selectedCodeId}
              />
            }
          >
            <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1.5 custom-scrollbar">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  코드 그룹 <span className="text-rose-500">*</span>
                </label>
                <select
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#f99e1a]/20 focus:border-[#f99e1a] transition-all"
                  value={codeForm.group}
                  onChange={(e) =>
                    setCodeForm((p) => ({ ...p, group: e.target.value }))
                  }
                >
                  <option value="MEMBER_ROLE">MEMBER_ROLE (참가자 역할)</option>
                  <option value="MAP_MODE">MAP_MODE (오버워치 전장 모드)</option>
                  <option value="TOUR_STAT">TOUR_STAT (대회 진행 상태)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    코드 ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f99e1a]/20 focus:border-[#f99e1a] transition-all font-mono uppercase disabled:opacity-60"
                    placeholder="예: COACH, HYBRID"
                    value={codeForm.code}
                    onChange={(e) =>
                      setCodeForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))
                    }
                    disabled={!!selectedCodeId}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    정렬 순서
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#f99e1a]/20 focus:border-[#f99e1a] transition-all"
                    value={codeForm.sort}
                    onChange={(e) =>
                      setCodeForm((p) => ({ ...p, sort: Number(e.target.value) || 1 }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    코드명 (국문) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#f99e1a]/20 focus:border-[#f99e1a] transition-all"
                    value={codeForm.name}
                    onChange={(e) =>
                      setCodeForm((p) => ({ ...p, name: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    코드명 (영문)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#f99e1a]/20 focus:border-[#f99e1a] transition-all"
                    value={codeForm.nameEn}
                    onChange={(e) =>
                      setCodeForm((p) => ({ ...p, nameEn: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  사용 여부
                </label>
                <div className="flex gap-4 pt-1">
                  <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="useYn"
                      className="text-[#f99e1a] focus:ring-[#f99e1a] accent-[#f99e1a]"
                      checked={codeForm.useYn === "Y"}
                      onChange={() => setCodeForm((p) => ({ ...p, useYn: "Y" }))}
                    />
                    <span>사용 (Y)</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="useYn"
                      className="text-[#f99e1a] focus:ring-[#f99e1a] accent-[#f99e1a]"
                      checked={codeForm.useYn === "N"}
                      onChange={() => setCodeForm((p) => ({ ...p, useYn: "N" }))}
                    />
                    <span>미사용 (N)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  코드 설명 / 비고
                </label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f99e1a]/20 focus:border-[#f99e1a] transition-all resize-none"
                  placeholder="코드 용도 및 정의를 입력하세요."
                  value={codeForm.desc}
                  onChange={(e) =>
                    setCodeForm((p) => ({ ...p, desc: e.target.value }))
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
