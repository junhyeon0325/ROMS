// app/admin/codes/page.tsx
/**
 * [공통 코드 관리 페이지 컴포넌트]
 * - 상하 5:5 분할 마스터-디테일 그리드 UI 구조
 * - 상단 그리드(50%): 공통코드 그룹 목록 조회, 인라인 신규 행 추가 등록, 수정, 삭제, 사용여부 인라인 토글
 * - 하단 그리드(50%): 선택된 코드그룹의 세부 공통코드 목록 조회, 인라인 신규 행 추가 등록, 수정, 삭제, 사용여부 인라인 토글
 */
"use client";

import React, { useState, useMemo } from "react";
import { useAdmin } from "@/lib/context/AdminContext";
import { CodeGroupItem, CodeItem } from "@/lib/types/admin";
import AdminCard from "@/components/admin/AdminCard";

export default function AdminCodesPage() {
  const { codeGroups, setCodeGroups, codes, setCodes, showFeedback } = useAdmin();

  // 1. 상태: 선택된 코드 그룹 (기본값: 첫 번째 그룹)
  const [selectedGroupCode, setSelectedGroupCode] = useState<string>(
    codeGroups.length > 0 ? codeGroups[0].groupCode : "MEMBER_ROLE"
  );

  // 2. 상태: 하단 그리드에서 선택된 세부 코드 ID (수정/삭제 바인딩용)
  const [selectedDetailCode, setSelectedDetailCode] = useState<string | null>(null);

  // 3. 검색 상태
  const [groupSearch, setGroupSearch] = useState("");
  const [codeSearch, setCodeSearch] = useState("");

  // 4. 인라인 행 추가 상태: 코드그룹
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [inlineGroupForm, setInlineGroupForm] = useState<{
    groupCode: string;
    groupName: string;
    description: string;
    sortOrder: number;
    isUse: boolean;
  }>({
    groupCode: "",
    groupName: "",
    description: "",
    sortOrder: 1,
    isUse: true,
  });

  // 5. 인라인 행 추가 상태: 세부 코드
  const [isAddingCode, setIsAddingCode] = useState(false);
  const [inlineCodeForm, setInlineCodeForm] = useState<{
    code: string;
    name: string;
    nameEn: string;
    sort: number;
    useYn: "Y" | "N";
    desc: string;
  }>({
    code: "",
    name: "",
    nameEn: "",
    sort: 1,
    useYn: "Y",
    desc: "",
  });

  // 6. 인라인 행 수정 상태: 코드그룹
  const [editingGroupCode, setEditingGroupCode] = useState<string | null>(null);
  const [inlineEditGroupForm, setInlineEditGroupForm] = useState<{
    groupName: string;
    description: string;
    sortOrder: number;
    isUse: boolean;
  }>({
    groupName: "",
    description: "",
    sortOrder: 1,
    isUse: true,
  });

  // 7. 인라인 행 수정 상태: 세부코드
  const [editingCodeId, setEditingCodeId] = useState<string | null>(null);
  const [inlineEditCodeForm, setInlineEditCodeForm] = useState<{
    name: string;
    nameEn: string;
    sort: number;
    useYn: "Y" | "N";
    desc: string;
  }>({
    name: "",
    nameEn: "",
    sort: 1,
    useYn: "Y",
    desc: "",
  });

  // ==========================================
  // [데이터 필터링 및 통계 계산]
  // ==========================================

  // 각 그룹별 소속 코드 개수 매핑
  const groupCodeCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    codes.forEach((c) => {
      map[c.group] = (map[c.group] || 0) + 1;
    });
    return map;
  }, [codes]);

  // 상단: 필터링된 코드그룹 목록
  const filteredGroups = useMemo(() => {
    return codeGroups
      .filter((g) => {
        const query = groupSearch.toLowerCase().trim();
        if (!query) return true;
        return (
          g.groupCode.toLowerCase().includes(query) ||
          g.groupName.toLowerCase().includes(query) ||
          (g.description && g.description.toLowerCase().includes(query))
        );
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [codeGroups, groupSearch]);

  // 현재 선택된 코드그룹 객체
  const currentSelectedGroup = useMemo(() => {
    return codeGroups.find((g) => g.groupCode === selectedGroupCode) || null;
  }, [codeGroups, selectedGroupCode]);

  // 하단: 현재 선택된 그룹의 필터링된 세부 코드 목록
  const filteredCodes = useMemo(() => {
    if (!selectedGroupCode) return [];
    return codes
      .filter((c) => c.group === selectedGroupCode)
      .filter((c) => {
        const query = codeSearch.toLowerCase().trim();
        if (!query) return true;
        return (
          c.code.toLowerCase().includes(query) ||
          c.name.toLowerCase().includes(query) ||
          (c.nameEn && c.nameEn.toLowerCase().includes(query)) ||
          (c.desc && c.desc.toLowerCase().includes(query))
        );
      })
      .sort((a, b) => a.sort - b.sort);
  }, [codes, selectedGroupCode, codeSearch]);

  // 현재 선택된 세부 코드 객체
  const currentSelectedCode = useMemo(() => {
    if (!selectedDetailCode) return null;
    return filteredCodes.find((c) => c.code === selectedDetailCode) || null;
  }, [filteredCodes, selectedDetailCode]);

  // 그룹 선택 변경 핸들러
  const handleSelectGroup = (groupCode: string) => {
    setSelectedGroupCode(groupCode);
    setSelectedDetailCode(null);
    setIsAddingCode(false);
  };

  // ==========================================
  // [인라인 그룹 추가 핸들러]
  // ==========================================

  // 인라인 그룹 추가 행 시작
  const handleStartAddGroup = () => {
    setEditingGroupCode(null);
    setIsAddingGroup(true);
    setInlineGroupForm({
      groupCode: "",
      groupName: "",
      description: "",
      sortOrder: codeGroups.length + 1,
      isUse: true,
    });
  };

  // 인라인 그룹 저장
  const handleSaveInlineGroup = () => {
    const groupCode = inlineGroupForm.groupCode.trim().toUpperCase();
    const groupName = inlineGroupForm.groupName.trim();

    if (!groupCode || !groupName) {
      showFeedback("그룹 코드와 그룹명을 모두 입력해주세요.");
      return;
    }

    if (codeGroups.some((g) => g.groupCode === groupCode)) {
      showFeedback(`이미 존재하는 그룹 코드 [${groupCode}] 입니다.`);
      return;
    }

    const newGroup: CodeGroupItem = {
      groupCode,
      groupName,
      description: inlineGroupForm.description.trim(),
      sortOrder: Number(inlineGroupForm.sortOrder) || 1,
      isUse: inlineGroupForm.isUse,
      createdAt: new Date().toISOString().split("T")[0],
    };

    setCodeGroups((prev) => [...prev, newGroup]);
    setSelectedGroupCode(groupCode);
    setSelectedDetailCode(null);
    setIsAddingGroup(false);
    showFeedback(`신규 그룹 [${groupCode}]이(가) 등록되었습니다.`);
  };

  // 인라인 그룹 추가 취소
  const handleCancelInlineGroup = () => {
    setIsAddingGroup(false);
  };

  // 그룹 인라인 수정 시작
  const handleStartEditGroup = (group: CodeGroupItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsAddingGroup(false);
    setEditingGroupCode(group.groupCode);
    setInlineEditGroupForm({
      groupName: group.groupName,
      description: group.description || "",
      sortOrder: group.sortOrder,
      isUse: group.isUse,
    });
  };

  // 그룹 인라인 수정 취소
  const handleCancelEditGroup = () => {
    setEditingGroupCode(null);
  };

  // 그룹 인라인 수정 저장
  const handleSaveInlineEditGroup = () => {
    if (!editingGroupCode) return;
    const name = inlineEditGroupForm.groupName.trim();

    if (!name) {
      showFeedback("그룹명을 입력해주세요.");
      return;
    }

    setCodeGroups((prev) =>
      prev.map((g) =>
        g.groupCode === editingGroupCode
          ? {
              ...g,
              groupName: name,
              description: inlineEditGroupForm.description.trim(),
              sortOrder: Number(inlineEditGroupForm.sortOrder) || 1,
              isUse: inlineEditGroupForm.isUse,
            }
          : g
      )
    );
    showFeedback(`그룹 [${editingGroupCode}] 정보가 수정되었습니다.`);
    setEditingGroupCode(null);
  };

  // 그룹 사용여부 즉시 토글
  const handleToggleGroupUse = (groupCode: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCodeGroups((prev) =>
      prev.map((g) => (g.groupCode === groupCode ? { ...g, isUse: !g.isUse } : g))
    );
    showFeedback(`그룹 [${groupCode}] 사용 상태가 변경되었습니다.`);
  };

  // 그룹 삭제
  const handleDeleteGroup = (group: CodeGroupItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const count = groupCodeCountMap[group.groupCode] || 0;
    const confirmMsg =
      count > 0
        ? `[${group.groupName}(${group.groupCode})] 그룹을 삭제하시겠습니까?\n소속된 세부 코드 ${count}건도 함께 삭제됩니다.`
        : `[${group.groupName}(${group.groupCode})] 그룹을 삭제하시겠습니까?`;

    if (!window.confirm(confirmMsg)) return;

    setCodeGroups((prev) => prev.filter((g) => g.groupCode !== group.groupCode));
    setCodes((prev) => prev.filter((c) => c.group !== group.groupCode));

    if (selectedGroupCode === group.groupCode) {
      const remaining = codeGroups.filter((g) => g.groupCode !== group.groupCode);
      setSelectedGroupCode(remaining.length > 0 ? remaining[0].groupCode : "");
      setSelectedDetailCode(null);
    }
    if (editingGroupCode === group.groupCode) {
      setEditingGroupCode(null);
    }
    showFeedback(`그룹 [${group.groupCode}]이(가) 삭제되었습니다.`);
  };

  // ==========================================
  // [인라인 세부 코드 추가 및 수정 핸들러]
  // ==========================================

  // 인라인 세부 코드 추가 행 시작
  const handleStartAddCode = () => {
    if (!selectedGroupCode) {
      showFeedback("먼저 상단 그리드에서 코드 그룹을 선택해주세요.");
      return;
    }
    setEditingCodeId(null);
    setIsAddingCode(true);
    setInlineCodeForm({
      code: "",
      name: "",
      nameEn: "",
      sort: filteredCodes.length + 1,
      useYn: "Y",
      desc: "",
    });
  };

  // 인라인 세부 코드 저장
  const handleSaveInlineCode = () => {
    if (!selectedGroupCode) return;
    const code = inlineCodeForm.code.trim().toUpperCase();
    const name = inlineCodeForm.name.trim();

    if (!code || !name) {
      showFeedback("코드 ID와 코드명을 모두 입력해주세요.");
      return;
    }

    const isDuplicate = codes.some(
      (c) => c.group === selectedGroupCode && c.code === code
    );
    if (isDuplicate) {
      showFeedback(`해당 그룹에 이미 동일한 코드 [${code}]가 존재합니다.`);
      return;
    }

    const newCode: CodeItem = {
      group: selectedGroupCode,
      code,
      name,
      nameEn: inlineCodeForm.nameEn.trim(),
      sort: Number(inlineCodeForm.sort) || 1,
      useYn: inlineCodeForm.useYn,
      desc: inlineCodeForm.desc.trim(),
    };

    setCodes((prev) => [...prev, newCode]);
    setSelectedDetailCode(code);
    setIsAddingCode(false);
    showFeedback(`신규 코드 [${code}]이(가) 등록되었습니다.`);
  };

  // 인라인 세부 코드 추가 취소
  const handleCancelInlineCode = () => {
    setIsAddingCode(false);
  };

  // 코드 인라인 수정 시작
  const handleStartEditCode = (codeItem: CodeItem) => {
    setIsAddingCode(false);
    setEditingCodeId(codeItem.code);
    setInlineEditCodeForm({
      name: codeItem.name,
      nameEn: codeItem.nameEn || "",
      sort: codeItem.sort,
      useYn: codeItem.useYn,
      desc: codeItem.desc || "",
    });
  };

  // 코드 인라인 수정 취소
  const handleCancelEditCode = () => {
    setEditingCodeId(null);
  };

  // 코드 인라인 수정 저장
  const handleSaveInlineEditCode = () => {
    if (!editingCodeId || !selectedGroupCode) return;
    const name = inlineEditCodeForm.name.trim();

    if (!name) {
      showFeedback("코드명을 입력해주세요.");
      return;
    }

    setCodes((prev) =>
      prev.map((c) =>
        c.group === selectedGroupCode && c.code === editingCodeId
          ? {
              ...c,
              name,
              nameEn: inlineEditCodeForm.nameEn.trim(),
              sort: Number(inlineEditCodeForm.sort) || 1,
              useYn: inlineEditCodeForm.useYn,
              desc: inlineEditCodeForm.desc.trim(),
            }
          : c
      )
    );
    showFeedback(`코드 [${editingCodeId}] 정보가 수정되었습니다.`);
    setEditingCodeId(null);
  };

  // 코드 사용여부 즉시 토글
  const handleToggleCodeUse = (codeItem: CodeItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextUseYn = codeItem.useYn === "Y" ? "N" : "Y";
    setCodes((prev) =>
      prev.map((c) =>
        c.group === codeItem.group && c.code === codeItem.code
          ? { ...c, useYn: nextUseYn }
          : c
      )
    );
    showFeedback(`코드 [${codeItem.code}] 사용여부가 [${nextUseYn}]으로 변경되었습니다.`);
  };

  // 코드 삭제
  const handleDeleteCode = (codeItem: CodeItem) => {
    if (!window.confirm(`[${codeItem.name}(${codeItem.code})] 코드를 삭제하시겠습니까?`)) {
      return;
    }
    setCodes((prev) =>
      prev.filter((c) => !(c.group === codeItem.group && c.code === codeItem.code))
    );
    if (selectedDetailCode === codeItem.code) {
      setSelectedDetailCode(null);
    }
    if (editingCodeId === codeItem.code) {
      setEditingCodeId(null);
    }
    showFeedback(`코드 [${codeItem.code}]이(가) 삭제되었습니다.`);
  };

  return (
    <section className="h-full min-h-0 flex flex-col gap-4">
      {/* ========================================================================= */}
      {/* [상단 그리드 (50%)]: 공통코드 그룹 관리 그리드 */}
      {/* ========================================================================= */}
      <div className="flex-1 min-h-[300px] lg:min-h-0 flex flex-col">
        <AdminCard
          title="공통코드 그룹 관리"
          countBadge={`총 ${filteredGroups.length}개 그룹`}
          className="h-full flex flex-col !p-4 md:!p-5"
          actions={
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* 인라인 그룹 수정 진행 중일 때: 상단 취소/저장 버튼 */}
              {editingGroupCode ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCancelEditGroup}
                    className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-750 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
                  >
                    <span>취소</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveInlineEditGroup}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#f99e1a] text-slate-950 hover:bg-[#e08a10] active:scale-95 transition-all shadow-xs cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>저장</span>
                  </button>
                </div>
              ) : isAddingGroup ? (
                /* 인라인 그룹 추가 진행 중일 때: 상단 취소/저장 버튼 */
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCancelInlineGroup}
                    className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-750 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
                  >
                    <span>취소</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveInlineGroup}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#f99e1a] text-slate-950 hover:bg-[#e08a10] active:scale-95 transition-all shadow-xs cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>저장</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* 그룹 수정 버튼 (누르면 그리드 내 해당 행이 수정 모드로 전환) */}
                  <button
                    type="button"
                    disabled={!currentSelectedGroup}
                    onClick={() => currentSelectedGroup && handleStartEditGroup(currentSelectedGroup)}
                    className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750 active:scale-95 transition-all shadow-2xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
                  >
                    <svg className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    <span>수정</span>
                  </button>

                  {/* 그룹 삭제 버튼 */}
                  <button
                    type="button"
                    disabled={!currentSelectedGroup}
                    onClick={() => currentSelectedGroup && handleDeleteGroup(currentSelectedGroup)}
                    className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-300 active:scale-95 transition-all shadow-2xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>삭제</span>
                  </button>

                  {/* 그룹 추가 버튼 (누르면 그리드 최상단에 행 추가) */}
                  <button
                    type="button"
                    onClick={handleStartAddGroup}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#f99e1a] text-slate-950 hover:bg-[#e08a10] active:scale-95 transition-all shadow-xs cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>그룹 추가</span>
                  </button>
                </>
              )}
            </div>
          }
        >
          {/* 상단 툴바: 검색 영역 */}
          <div className="flex items-center justify-between gap-3 mb-2.5 shrink-0">
            <div className="relative w-full max-w-xs sm:max-w-sm">
              <input
                type="text"
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f99e1a]/20 focus:border-[#f99e1a] transition-all"
                placeholder="그룹 코드 또는 그룹명 검색..."
                value={groupSearch}
                onChange={(e) => setGroupSearch(e.target.value)}
              />
              <svg
                className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            <div className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:block">
              {editingGroupCode
                ? "행 정보를 수정한 후 저장 또는 Enter를 누르세요."
                : isAddingGroup
                ? "신규 행에 정보를 입력 후 저장 또는 Enter를 누르세요."
                : "행 클릭 시 선택되어 수정/삭제할 수 있습니다."}
            </div>
          </div>

          {/* 코드그룹 테이블 그리드 */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 custom-scrollbar relative">
            <table className="w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-[#151c2e] shadow-2xs">
                <tr className="text-slate-600 dark:text-slate-300 font-semibold">
                  <th className="px-2 py-2 w-16 min-w-[64px] text-center whitespace-nowrap bg-slate-100 dark:bg-[#151c2e]">순번</th>
                  <th className="px-3.5 py-2 w-48 bg-slate-100 dark:bg-[#151c2e]">그룹 코드</th>
                  <th className="px-3.5 py-2 w-56 bg-slate-100 dark:bg-[#151c2e]">그룹명</th>
                  <th className="px-3 py-2 w-24 text-center bg-slate-100 dark:bg-[#151c2e]">코드 수</th>
                  <th className="px-3 py-2 w-24 text-center bg-slate-100 dark:bg-[#151c2e]">사용여부</th>
                  <th className="px-3.5 py-2 bg-slate-100 dark:bg-[#151c2e]">설명 / 비고</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-[#111726]">
                {/* [인라인 신규 그룹 추가 행] */}
                {isAddingGroup && (
                  <tr className="bg-amber-500/10 dark:bg-amber-500/15 border-l-4 border-[#f99e1a] animate-in fade-in duration-150">
                    <td className="px-2 py-2 text-center whitespace-nowrap">
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-extrabold bg-[#f99e1a] text-slate-950 shadow-2xs whitespace-nowrap leading-none tracking-tight">
                        NEW
                      </span>
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="text"
                        autoFocus
                        placeholder="예: MEMBER_ROLE"
                        className="w-full px-2 py-1 text-xs font-mono font-bold uppercase rounded bg-white dark:bg-slate-900 border border-[#f99e1a] text-[#f99e1a] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f99e1a]/30 shadow-2xs"
                        value={inlineGroupForm.groupCode}
                        onChange={(e) =>
                          setInlineGroupForm((p) => ({ ...p, groupCode: e.target.value.toUpperCase() }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveInlineGroup();
                          if (e.key === "Escape") handleCancelInlineGroup();
                        }}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="text"
                        placeholder="예: 참가자 역할 구분"
                        className="w-full px-2 py-1 text-xs font-semibold rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#f99e1a] focus:ring-1 focus:ring-[#f99e1a]"
                        value={inlineGroupForm.groupName}
                        onChange={(e) =>
                          setInlineGroupForm((p) => ({ ...p, groupName: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveInlineGroup();
                          if (e.key === "Escape") handleCancelInlineGroup();
                        }}
                      />
                    </td>
                    <td className="px-3 py-2 text-center text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                      0건
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <select
                        className="px-1.5 py-1 text-xs rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#f99e1a]"
                        value={inlineGroupForm.isUse ? "Y" : "N"}
                        onChange={(e) =>
                          setInlineGroupForm((p) => ({ ...p, isUse: e.target.value === "Y" }))
                        }
                      >
                        <option value="Y">사용</option>
                        <option value="N">미사용</option>
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          placeholder="코드그룹 용도 및 정의를 기술하세요..."
                          className="flex-1 px-2 py-1 text-xs rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#f99e1a]"
                          value={inlineGroupForm.description}
                          onChange={(e) =>
                            setInlineGroupForm((p) => ({ ...p, description: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveInlineGroup();
                            if (e.key === "Escape") handleCancelInlineGroup();
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleSaveInlineGroup}
                          className="px-2.5 py-1 rounded bg-[#f99e1a] text-slate-950 font-bold text-xs hover:bg-[#e08a10] active:scale-95 cursor-pointer shadow-xs shrink-0"
                        >
                          저장
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelInlineGroup}
                          className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-750 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 active:scale-95 cursor-pointer shrink-0"
                        >
                          취소
                        </button>
                      </div>
                    </td>
                  </tr>
                )}

                {filteredGroups.length === 0 && !isAddingGroup ? (
                  <tr>
                    <td colSpan={6} className="px-3.5 py-10 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <span className="text-2xl">📁</span>
                        <p className="font-semibold text-xs text-slate-600 dark:text-slate-400">
                          검색된 코드그룹이 없습니다.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredGroups.map((g, idx) => {
                    const isSelected = selectedGroupCode === g.groupCode;
                    const isEditing = editingGroupCode === g.groupCode;
                    const codeCount = groupCodeCountMap[g.groupCode] || 0;

                    // [인라인 그룹 수정 행]
                    if (isEditing) {
                      return (
                        <tr
                          key={g.groupCode}
                          className="bg-amber-500/10 dark:bg-amber-500/15 border-l-4 border-[#f99e1a] animate-in fade-in duration-150"
                        >
                          <td className="px-2 py-2 text-center whitespace-nowrap">
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-extrabold bg-[#f99e1a] text-slate-950 shadow-2xs whitespace-nowrap leading-none tracking-tight">
                              수정
                            </span>
                          </td>
                          <td className="px-3.5 py-2 font-mono font-bold text-slate-400 dark:text-slate-500">
                            {g.groupCode}
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="text"
                              autoFocus
                              placeholder="그룹명 입력"
                              className="w-full px-2 py-1 text-xs font-semibold rounded bg-white dark:bg-slate-900 border border-[#f99e1a] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#f99e1a]"
                              value={inlineEditGroupForm.groupName}
                              onChange={(e) =>
                                setInlineEditGroupForm((p) => ({ ...p, groupName: e.target.value }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveInlineEditGroup();
                                if (e.key === "Escape") handleCancelEditGroup();
                              }}
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {codeCount}건
                            </span>
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <select
                              className="px-1.5 py-1 text-xs rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#f99e1a]"
                              value={inlineEditGroupForm.isUse ? "Y" : "N"}
                              onChange={(e) =>
                                setInlineEditGroupForm((p) => ({ ...p, isUse: e.target.value === "Y" }))
                              }
                            >
                              <option value="Y">사용</option>
                              <option value="N">미사용</option>
                            </select>
                          </td>
                          <td className="px-2 py-1.5">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                placeholder="설명 / 비고"
                                className="flex-1 px-2 py-1 text-xs rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#f99e1a]"
                                value={inlineEditGroupForm.description}
                                onChange={(e) =>
                                  setInlineEditGroupForm((p) => ({ ...p, description: e.target.value }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveInlineEditGroup();
                                  if (e.key === "Escape") handleCancelEditGroup();
                                }}
                              />
                              <button
                                type="button"
                                onClick={handleSaveInlineEditGroup}
                                className="px-2.5 py-1 rounded bg-[#f99e1a] text-slate-950 font-bold text-xs hover:bg-[#e08a10] active:scale-95 cursor-pointer shadow-xs shrink-0"
                              >
                                저장
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelEditGroup}
                                className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-750 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 active:scale-95 cursor-pointer shrink-0"
                              >
                                취소
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr
                        key={g.groupCode}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-amber-500/10 dark:bg-amber-500/15 font-medium border-l-4 border-[#f99e1a]"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        }`}
                        onClick={() => handleSelectGroup(g.groupCode)}
                      >
                        <td className="px-2 py-2 text-center text-slate-400 dark:text-slate-500 font-mono whitespace-nowrap">
                          {idx + 1}
                        </td>
                        <td className="px-3.5 py-2 font-mono font-bold text-[#f99e1a] dark:text-amber-400">
                          {g.groupCode}
                        </td>
                        <td className="px-3.5 py-2 font-semibold text-slate-900 dark:text-slate-100">
                          {g.groupName}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {codeCount}건
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={(e) => handleToggleGroupUse(g.groupCode, e)}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                              g.isUse
                                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            {g.isUse ? "사용" : "미사용"}
                          </button>
                        </td>
                        <td className="px-3.5 py-2 text-slate-500 dark:text-slate-400 truncate max-w-xs" title={g.description}>
                          {g.description || "—"}
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

      {/* ========================================================================= */}
      {/* [하단 그리드 (50%)]: 선택된 코드그룹의 세부 코드 관리 그리드 */}
      {/* ========================================================================= */}
      <div className="flex-1 min-h-[300px] lg:min-h-0 flex flex-col">
        <AdminCard
          title={
            <div className="flex items-center gap-2">
              <span>세부 코드 관리</span>
              {currentSelectedGroup && (
                <span className="hidden sm:inline-flex items-center gap-1 text-xs font-normal text-slate-500 dark:text-slate-400">
                  (<span className="text-[#f99e1a] font-mono font-bold">{currentSelectedGroup.groupCode}</span>
                  <span>·</span>
                  <span>{currentSelectedGroup.groupName}</span>)
                </span>
              )}
            </div>
          }
          countBadge={
            currentSelectedGroup
              ? `등록 ${filteredCodes.length}건`
              : "그룹 미선택"
          }
          className="h-full flex flex-col !p-4 md:!p-5"
          actions={
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* 인라인 코드 수정 진행 중일 때: 상단 취소/저장 버튼 */}
              {editingCodeId ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCancelEditCode}
                    className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-750 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
                  >
                    <span>취소</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveInlineEditCode}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#f99e1a] text-slate-950 hover:bg-[#e08a10] active:scale-95 transition-all shadow-xs cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>저장</span>
                  </button>
                </div>
              ) : isAddingCode ? (
                /* 인라인 코드 추가 진행 중일 때: 상단 취소/저장 버튼 */
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCancelInlineCode}
                    className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-750 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
                  >
                    <span>취소</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveInlineCode}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#f99e1a] text-slate-950 hover:bg-[#e08a10] active:scale-95 transition-all shadow-xs cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>저장</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* 코드 수정 버튼 (누르면 그리드 내 해당 행이 수정 모드로 전환) */}
                  <button
                    type="button"
                    disabled={!currentSelectedCode}
                    onClick={() => currentSelectedCode && handleStartEditCode(currentSelectedCode)}
                    className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750 active:scale-95 transition-all shadow-2xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
                  >
                    <svg className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    <span>수정</span>
                  </button>

                  {/* 코드 삭제 버튼 */}
                  <button
                    type="button"
                    disabled={!currentSelectedCode}
                    onClick={() => currentSelectedCode && handleDeleteCode(currentSelectedCode)}
                    className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-300 active:scale-95 transition-all shadow-2xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>삭제</span>
                  </button>

                  {/* 코드 등록 버튼 (누르면 그리드 최상단에 행 추가) */}
                  <button
                    type="button"
                    disabled={!selectedGroupCode}
                    onClick={handleStartAddCode}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer ${
                      selectedGroupCode
                        ? "bg-[#f99e1a] text-slate-950 hover:bg-[#e08a10] active:scale-95"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>코드 등록</span>
                  </button>
                </>
              )}
            </div>
          }
        >
          {/* 하단 툴바: 검색 영역 */}
          <div className="flex items-center justify-between gap-3 mb-2.5 shrink-0">
            <div className="relative w-full max-w-xs sm:max-w-sm">
              <input
                type="text"
                disabled={!selectedGroupCode}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f99e1a]/20 focus:border-[#f99e1a] transition-all disabled:opacity-50"
                placeholder="코드 ID 또는 코드명 검색..."
                value={codeSearch}
                onChange={(e) => setCodeSearch(e.target.value)}
              />
              <svg
                className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {currentSelectedGroup && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline mr-2">
                  {editingCodeId
                    ? "행 정보를 수정한 후 저장 또는 Enter를 누르세요."
                    : isAddingCode
                    ? "신규 행에 정보를 입력 후 저장 또는 Enter를 누르세요."
                    : "행 클릭 시 선택되어 수정/삭제할 수 있습니다."}
                </span>
                <span className="text-slate-400 dark:text-slate-500 hidden sm:inline">대상 그룹:</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 dark:bg-amber-500/20 text-[#f99e1a] font-mono font-bold text-[11px]">
                  {currentSelectedGroup.groupCode}
                </span>
              </div>
            )}
          </div>

          {/* 세부 코드 테이블 그리드 */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 custom-scrollbar relative">
            <table className="w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-[#151c2e] shadow-2xs">
                <tr className="text-slate-600 dark:text-slate-300 font-semibold">
                  <th className="px-2 py-2 w-16 min-w-[64px] text-center whitespace-nowrap bg-slate-100 dark:bg-[#151c2e]">순번</th>
                  <th className="px-3.5 py-2 w-40 bg-slate-100 dark:bg-[#151c2e]">코드 ID</th>
                  <th className="px-3.5 py-2 w-52 bg-slate-100 dark:bg-[#151c2e]">코드명 (국문)</th>
                  <th className="px-3.5 py-2 w-48 bg-slate-100 dark:bg-[#151c2e]">코드명 (영문)</th>
                  <th className="px-3 py-2 w-24 text-center bg-slate-100 dark:bg-[#151c2e]">사용여부</th>
                  <th className="px-3.5 py-2 bg-slate-100 dark:bg-[#151c2e]">설명 / 비고</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-[#111726]">
                {/* [인라인 신규 세부 코드 추가 행] */}
                {isAddingCode && (
                  <tr className="bg-amber-500/10 dark:bg-amber-500/15 border-l-4 border-[#f99e1a] animate-in fade-in duration-150">
                    <td className="px-2 py-2 text-center whitespace-nowrap">
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-extrabold bg-[#f99e1a] text-slate-950 shadow-2xs whitespace-nowrap leading-none tracking-tight">
                        NEW
                      </span>
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="text"
                        autoFocus
                        placeholder="예: COACH"
                        className="w-full px-2 py-1 text-xs font-mono font-bold uppercase rounded bg-white dark:bg-slate-900 border border-[#f99e1a] text-[#f99e1a] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f99e1a]/30 shadow-2xs"
                        value={inlineCodeForm.code}
                        onChange={(e) =>
                          setInlineCodeForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveInlineCode();
                          if (e.key === "Escape") handleCancelInlineCode();
                        }}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="text"
                        placeholder="예: 감독"
                        className="w-full px-2 py-1 text-xs font-semibold rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#f99e1a] focus:ring-1 focus:ring-[#f99e1a]"
                        value={inlineCodeForm.name}
                        onChange={(e) =>
                          setInlineCodeForm((p) => ({ ...p, name: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveInlineCode();
                          if (e.key === "Escape") handleCancelInlineCode();
                        }}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="text"
                        placeholder="예: Coach"
                        className="w-full px-2 py-1 text-xs font-mono rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#f99e1a]"
                        value={inlineCodeForm.nameEn}
                        onChange={(e) =>
                          setInlineCodeForm((p) => ({ ...p, nameEn: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveInlineCode();
                          if (e.key === "Escape") handleCancelInlineCode();
                        }}
                      />
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <select
                        className="px-1.5 py-1 text-xs rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#f99e1a]"
                        value={inlineCodeForm.useYn}
                        onChange={(e) =>
                          setInlineCodeForm((p) => ({ ...p, useYn: e.target.value as "Y" | "N" }))
                        }
                      >
                        <option value="Y">사용</option>
                        <option value="N">미사용</option>
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          placeholder="코드 설명 / 비고..."
                          className="flex-1 px-2 py-1 text-xs rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#f99e1a]"
                          value={inlineCodeForm.desc}
                          onChange={(e) =>
                            setInlineCodeForm((p) => ({ ...p, desc: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveInlineCode();
                            if (e.key === "Escape") handleCancelInlineCode();
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleSaveInlineCode}
                          className="px-2.5 py-1 rounded bg-[#f99e1a] text-slate-950 font-bold text-xs hover:bg-[#e08a10] active:scale-95 cursor-pointer shadow-xs shrink-0"
                        >
                          저장
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelInlineCode}
                          className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-750 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 active:scale-95 cursor-pointer shrink-0"
                        >
                          취소
                        </button>
                      </div>
                    </td>
                  </tr>
                )}

                {!selectedGroupCode ? (
                  <tr>
                    <td colSpan={6} className="px-3.5 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="text-3xl">👆</span>
                        <p className="font-bold text-xs text-slate-700 dark:text-slate-300">
                          상단 그리드에서 코드 그룹을 먼저 선택해주세요.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filteredCodes.length === 0 && !isAddingCode ? (
                  <tr>
                    <td colSpan={6} className="px-3.5 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="text-2xl">⚙️</span>
                        <p className="font-bold text-xs text-slate-700 dark:text-slate-300">
                          등록된 세부 코드가 없습니다.
                        </p>
                        <p className="text-[11px] text-slate-400">
                          우측 상단의 '+ 코드 등록' 버튼을 눌러 새로운 코드를 등록해주세요.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCodes.map((c, idx) => {
                    const isSelectedCode = selectedDetailCode === c.code;
                    const isEditingCode = editingCodeId === c.code;

                    // [인라인 세부 코드 수정 행]
                    if (isEditingCode) {
                      return (
                        <tr
                          key={c.code}
                          className="bg-amber-500/10 dark:bg-amber-500/15 border-l-4 border-[#f99e1a] animate-in fade-in duration-150"
                        >
                          <td className="px-2 py-2 text-center whitespace-nowrap">
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-extrabold bg-[#f99e1a] text-slate-950 shadow-2xs whitespace-nowrap leading-none tracking-tight">
                              수정
                            </span>
                          </td>
                          <td className="px-3.5 py-2 font-mono font-bold text-slate-400 dark:text-slate-500">
                            {c.code}
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="text"
                              autoFocus
                              placeholder="코드명 (국문)"
                              className="w-full px-2 py-1 text-xs font-semibold rounded bg-white dark:bg-slate-900 border border-[#f99e1a] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#f99e1a]"
                              value={inlineEditCodeForm.name}
                              onChange={(e) =>
                                setInlineEditCodeForm((p) => ({ ...p, name: e.target.value }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveInlineEditCode();
                                if (e.key === "Escape") handleCancelEditCode();
                              }}
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="text"
                              placeholder="코드명 (영문)"
                              className="w-full px-2 py-1 text-xs font-mono rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#f99e1a]"
                              value={inlineEditCodeForm.nameEn}
                              onChange={(e) =>
                                setInlineEditCodeForm((p) => ({ ...p, nameEn: e.target.value }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveInlineEditCode();
                                if (e.key === "Escape") handleCancelEditCode();
                              }}
                            />
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <select
                              className="px-1.5 py-1 text-xs rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#f99e1a]"
                              value={inlineEditCodeForm.useYn}
                              onChange={(e) =>
                                setInlineEditCodeForm((p) => ({ ...p, useYn: e.target.value as "Y" | "N" }))
                              }
                            >
                              <option value="Y">사용</option>
                              <option value="N">미사용</option>
                            </select>
                          </td>
                          <td className="px-2 py-1.5">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                placeholder="코드 설명 / 비고..."
                                className="flex-1 px-2 py-1 text-xs rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#f99e1a]"
                                value={inlineEditCodeForm.desc}
                                onChange={(e) =>
                                  setInlineEditCodeForm((p) => ({ ...p, desc: e.target.value }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveInlineEditCode();
                                  if (e.key === "Escape") handleCancelEditCode();
                                }}
                              />
                              <button
                                type="button"
                                onClick={handleSaveInlineEditCode}
                                className="px-2.5 py-1 rounded bg-[#f99e1a] text-slate-950 font-bold text-xs hover:bg-[#e08a10] active:scale-95 cursor-pointer shadow-xs shrink-0"
                              >
                                저장
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelEditCode}
                                className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-750 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 active:scale-95 cursor-pointer shrink-0"
                              >
                                취소
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr
                        key={c.code}
                        className={`cursor-pointer transition-colors ${
                          isSelectedCode
                            ? "bg-amber-500/10 dark:bg-amber-500/15 font-medium border-l-4 border-[#f99e1a]"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        }`}
                        onClick={() => setSelectedDetailCode(c.code)}
                      >
                        <td className="px-2 py-2.5 text-center text-slate-400 dark:text-slate-500 font-mono whitespace-nowrap">
                          {idx + 1}
                        </td>
                        <td className="px-3.5 py-2.5 font-mono font-bold text-slate-900 dark:text-slate-100">
                          {c.code}
                        </td>
                        <td className="px-3.5 py-2.5 font-semibold text-slate-900 dark:text-slate-100">
                          {c.name}
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          {c.nameEn || "—"}
                        </td>
                        <td className="px-3.5 py-2.5 text-center">
                          <button
                            type="button"
                            onClick={(e) => handleToggleCodeUse(c, e)}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                              c.useYn === "Y"
                                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            {c.useYn === "Y" ? "사용" : "미사용"}
                          </button>
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-500 dark:text-slate-400 truncate max-w-xs" title={c.desc}>
                          {c.desc || "—"}
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
    </section>
  );
}




