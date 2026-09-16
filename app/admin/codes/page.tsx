// app/admin/codes/page.tsx
/**
 * [공통 코드 관리 페이지 컴포넌트]
 * - 상하 5:5 분할 마스터-디테일 그리드 UI 구조
 * - 상단 그리드(50%): 공통코드 그룹 목록 조회, 인라인 신규 행 추가 등록, 수정, 삭제
 * - 하단 그리드(50%): 선택된 코드그룹의 세부 공통코드 목록 조회, 인라인 신규 행 추가 등록, 수정, 삭제
 * - 공통 컴포넌트(AdminGridHeaderActions, AdminSearchInput, AdminEmptyState) 및 useInlineGridEdit 훅 적용 완료
 */
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useAdmin } from "@/lib/context/AdminContext";
import { CodeGroupItem, CodeItem } from "@/lib/types/admin";
import AdminCard from "@/components/admin/AdminCard";
import AdminGridHeaderActions from "@/components/admin/AdminGridHeaderActions";
import AdminSearchInput from "@/components/admin/AdminSearchInput";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminTable, { AdminTableColumn } from "@/components/admin/AdminTable";
import { useInlineGridEdit } from "@/lib/hooks/useInlineGridEdit";

// 코드그룹 폼 인터페이스
interface GroupAddForm {
  groupCode: string;
  groupName: string;
  remarks: string;
  sortOrder: number;
  isUse: boolean;
}

interface GroupEditForm {
  groupName: string;
  remarks: string;
  sortOrder: number;
  isUse: boolean;
}

// 세부코드 폼 인터페이스
interface CodeAddForm {
  code: string;
  name: string;
  sortOrder: number;
  isUse: boolean;
  remarks: string;
}

interface CodeEditForm {
  name: string;
  sortOrder: number;
  isUse: boolean;
  remarks: string;
}

export default function AdminCodesPage() {
  const { codeGroups, codes, refreshCodes, showFeedback, isCodesLoading } = useAdmin();

  // 1. 상태: 선택된 코드 그룹 (기본값: 첫 번째 그룹)
  const [selectedGroupCode, setSelectedGroupCode] = useState<string>(
    codeGroups.length > 0 ? codeGroups[0].groupCode : ""
  );

  // DB 로드 후 선택된 그룹이 비어있으면 첫 번째 그룹으로 자동 선택
  useEffect(() => {
    if (!selectedGroupCode && codeGroups.length > 0) {
      setSelectedGroupCode(codeGroups[0].groupCode);
    }
  }, [codeGroups, selectedGroupCode]);

  // 2. 상태: 하단 그리드에서 선택된 세부 코드 ID (수정/삭제 바인딩용)
  const [selectedDetailCode, setSelectedDetailCode] = useState<string | null>(null);

  // 3. 검색 상태
  const [groupSearch, setGroupSearch] = useState("");
  const [codeSearch, setCodeSearch] = useState("");

  // 4. 인라인 그리드 편집 상태 훅: 코드그룹
  const groupEdit = useInlineGridEdit<GroupAddForm, GroupEditForm>(
    {
      groupCode: "",
      groupName: "",
      remarks: "",
      sortOrder: 1,
      isUse: true,
    },
    {
      groupName: "",
      remarks: "",
      sortOrder: 1,
      isUse: true,
    }
  );

  // 5. 인라인 그리드 편집 상태 훅: 세부 코드
  const codeEdit = useInlineGridEdit<CodeAddForm, CodeEditForm>(
    {
      code: "",
      name: "",
      sortOrder: 1,
      isUse: true,
      remarks: "",
    },
    {
      name: "",
      sortOrder: 1,
      isUse: true,
      remarks: "",
    }
  );

  // ==========================================
  // [데이터 필터링 및 통계 계산]
  // ==========================================

  // 각 그룹별 소속 코드 개수 매핑
  const groupCodeCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    codes.forEach((c) => {
      const gCode = c.groupCode || c.group;
      if (gCode) {
        map[gCode] = (map[gCode] || 0) + 1;
      }
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
          (g.remarks && g.remarks.toLowerCase().includes(query))
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
      .filter((c) => (c.groupCode || c.group) === selectedGroupCode)
      .filter((c) => {
        const query = codeSearch.toLowerCase().trim();
        if (!query) return true;
        const remarksVal = c.remarks || c.desc || "";
        return (
          c.code.toLowerCase().includes(query) ||
          c.name.toLowerCase().includes(query) ||
          remarksVal.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => (a.sortOrder ?? a.sort ?? 0) - (b.sortOrder ?? b.sort ?? 0));
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
    codeEdit.reset();
  };

  // ==========================================
  // [AdminTable 컬럼 정의]
  // ==========================================

  // 상단 코드그룹 테이블 컬럼 정의
  const groupColumns: AdminTableColumn<CodeGroupItem>[] = useMemo(
    () => [
      {
        key: "index",
        header: "순번",
        width: "w-16 min-w-[64px]",
        align: "center",
        render: (_row, idx) => (
          <span className="text-slate-400 dark:text-slate-500 font-mono whitespace-nowrap">
            {idx + 1}
          </span>
        ),
      },
      {
        key: "groupCode",
        header: "그룹 코드",
        width: "w-48",
        render: (row) => (
          <span className="font-mono font-bold text-[#f99e1a] dark:text-amber-400">
            {row.groupCode}
          </span>
        ),
      },
      {
        key: "groupName",
        header: "그룹명",
        width: "w-56",
        render: (row) => (
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {row.groupName}
          </span>
        ),
      },
      {
        key: "codeCount",
        header: "코드 수",
        width: "w-24",
        align: "center",
        render: (row) => {
          const count = groupCodeCountMap[row.groupCode] || 0;
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {count}건
            </span>
          );
        },
      },
      {
        key: "isUse",
        header: "사용여부",
        width: "w-24",
        align: "center",
        render: (row) => (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
              row.isUse
                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700"
            }`}
          >
            {row.isUse ? "사용" : "미사용"}
          </span>
        ),
      },
      {
        key: "remarks",
        header: "설명 / 비고",
        render: (row) => (
          <span
            className="text-slate-500 dark:text-slate-400 truncate max-w-xs block"
            title={row.remarks}
          >
            {row.remarks || "—"}
          </span>
        ),
      },
    ],
    [groupCodeCountMap]
  );

  // 하단 세부코드 테이블 컬럼 정의
  const codeColumns: AdminTableColumn<CodeItem>[] = useMemo(
    () => [
      {
        key: "index",
        header: "순번",
        width: "w-16 min-w-[64px]",
        align: "center",
        render: (_row, idx) => (
          <span className="text-slate-400 dark:text-slate-500 font-mono whitespace-nowrap">
            {idx + 1}
          </span>
        ),
      },
      {
        key: "code",
        header: "코드 ID",
        width: "w-48",
        render: (row) => (
          <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
            {row.code}
          </span>
        ),
      },
      {
        key: "name",
        header: "코드명",
        width: "w-64",
        render: (row) => (
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {row.name}
          </span>
        ),
      },
      {
        key: "isUse",
        header: "사용여부",
        width: "w-24",
        align: "center",
        render: (row) => {
          const isUseActive = row.isUse ?? (row.useYn === "Y");
          return (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                isUseActive
                  ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700"
              }`}
            >
              {isUseActive ? "사용" : "미사용"}
            </span>
          );
        },
      },
      {
        key: "remarks",
        header: "코드 설명",
        render: (row) => {
          const remarksText = row.remarks || row.desc || "—";
          return (
            <span
              className="text-slate-500 dark:text-slate-400 truncate max-w-xs block"
              title={remarksText}
            >
              {remarksText}
            </span>
          );
        },
      },
    ],
    []
  );

  // ==========================================
  // [인라인 그룹 추가 및 수정 핸들러 (DB 연동)]
  // ==========================================

  // 인라인 그룹 추가 행 시작
  const handleStartAddGroup = () => {
    codeEdit.reset();
    groupEdit.startAdd({
      groupCode: "",
      groupName: "",
      remarks: "",
      sortOrder: codeGroups.length + 1,
      isUse: true,
    });
  };

  // 인라인 그룹 저장 (DB POST)
  const handleSaveInlineGroup = async () => {
    const groupCode = groupEdit.addForm.groupCode.trim().toUpperCase();
    const groupName = groupEdit.addForm.groupName.trim();

    if (!groupCode || !groupName) {
      showFeedback("그룹 코드와 그룹명을 모두 입력해주세요.");
      return;
    }

    if (codeGroups.some((g) => g.groupCode === groupCode)) {
      showFeedback(`이미 존재하는 그룹 코드 [${groupCode}] 입니다.`);
      return;
    }

    try {
      const res = await fetch("/api/codes/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupCode,
          groupName,
          remarks: groupEdit.addForm.remarks.trim(),
          sortOrder: Number(groupEdit.addForm.sortOrder) || 1,
          isUse: groupEdit.addForm.isUse,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        showFeedback(json.message || "그룹 등록에 실패했습니다.");
        return;
      }

      await refreshCodes();
      setSelectedGroupCode(groupCode);
      setSelectedDetailCode(null);
      groupEdit.cancelAdd();
      showFeedback(`신규 그룹 [${groupCode}]이(가) DB에 등록되었습니다.`);
    } catch (e: any) {
      showFeedback("그룹 등록 중 네트워크 오류가 발생했습니다.");
    }
  };

  // 그룹 인라인 수정 시작
  const handleStartEditGroup = (group: CodeGroupItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    codeEdit.reset();
    groupEdit.startEdit(group.groupCode, {
      groupName: group.groupName,
      remarks: group.remarks || "",
      sortOrder: group.sortOrder,
      isUse: group.isUse,
    });
  };

  // 그룹 인라인 수정 저장 (DB PUT)
  const handleSaveInlineEditGroup = async () => {
    if (!groupEdit.editingId) return;
    const name = groupEdit.editForm.groupName.trim();

    if (!name) {
      showFeedback("그룹명을 입력해주세요.");
      return;
    }

    try {
      const res = await fetch("/api/codes/groups", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupCode: groupEdit.editingId,
          groupName: name,
          remarks: groupEdit.editForm.remarks.trim(),
          sortOrder: Number(groupEdit.editForm.sortOrder) || 1,
          isUse: groupEdit.editForm.isUse,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        showFeedback(json.message || "그룹 수정에 실패했습니다.");
        return;
      }

      await refreshCodes();
      showFeedback(`그룹 [${groupEdit.editingId}] 정보가 수정되었습니다.`);
      groupEdit.cancelEdit();
    } catch (e: any) {
      showFeedback("그룹 수정 중 네트워크 오류가 발생했습니다.");
    }
  };

  // 그룹 삭제 (DB DELETE)
  const handleDeleteGroup = async (group: CodeGroupItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const count = groupCodeCountMap[group.groupCode] || 0;
    const confirmMsg =
      count > 0
        ? `[${group.groupName}(${group.groupCode})] 그룹을 삭제하시겠습니까?\n소속된 세부 코드 ${count}건도 함께 DB에서 삭제됩니다.`
        : `[${group.groupName}(${group.groupCode})] 그룹을 삭제하시겠습니까?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(
        `/api/codes/groups?groupCode=${encodeURIComponent(group.groupCode)}`,
        { method: "DELETE" }
      );

      const json = await res.json();
      if (!json.success) {
        showFeedback(json.message || "그룹 삭제에 실패했습니다.");
        return;
      }

      await refreshCodes();
      if (selectedGroupCode === group.groupCode) {
        const remaining = codeGroups.filter((g) => g.groupCode !== group.groupCode);
        setSelectedGroupCode(remaining.length > 0 ? remaining[0].groupCode : "");
        setSelectedDetailCode(null);
      }
      groupEdit.reset();
      showFeedback(`그룹 [${group.groupCode}]이(가) 삭제되었습니다.`);
    } catch (e: any) {
      showFeedback("그룹 삭제 중 네트워크 오류가 발생했습니다.");
    }
  };

  // ==========================================
  // [인라인 세부 코드 추가 및 수정 핸들러 (DB 연동)]
  // ==========================================

  // 인라인 세부 코드 추가 행 시작
  const handleStartAddCode = () => {
    if (!selectedGroupCode) {
      showFeedback("먼저 상단 그리드에서 코드 그룹을 선택해주세요.");
      return;
    }
    groupEdit.reset();
    codeEdit.startAdd({
      code: "",
      name: "",
      sortOrder: filteredCodes.length + 1,
      isUse: true,
      remarks: "",
    });
  };

  // 인라인 세부 코드 저장 (DB POST)
  const handleSaveInlineCode = async () => {
    if (!selectedGroupCode) return;
    const code = codeEdit.addForm.code.trim().toUpperCase();
    const name = codeEdit.addForm.name.trim();

    if (!code || !name) {
      showFeedback("코드 ID와 코드명을 모두 입력해주세요.");
      return;
    }

    const isDuplicate = codes.some(
      (c) => (c.groupCode || c.group) === selectedGroupCode && c.code === code
    );
    if (isDuplicate) {
      showFeedback(`해당 그룹에 이미 동일한 코드 [${code}]가 존재합니다.`);
      return;
    }

    try {
      const res = await fetch("/api/codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupCode: selectedGroupCode,
          code,
          name,
          sortOrder: Number(codeEdit.addForm.sortOrder) || 1,
          isUse: codeEdit.addForm.isUse,
          remarks: codeEdit.addForm.remarks.trim(),
        }),
      });

      const json = await res.json();
      if (!json.success) {
        showFeedback(json.message || "코드 등록에 실패했습니다.");
        return;
      }

      await refreshCodes();
      setSelectedDetailCode(code);
      codeEdit.cancelAdd();
      showFeedback(`신규 코드 [${code}]이(가) DB에 등록되었습니다.`);
    } catch (e: any) {
      showFeedback("코드 등록 중 네트워크 오류가 발생했습니다.");
    }
  };

  // 코드 인라인 수정 시작
  const handleStartEditCode = (codeItem: CodeItem) => {
    groupEdit.reset();
    codeEdit.startEdit(codeItem.code, {
      name: codeItem.name,
      sortOrder: codeItem.sortOrder ?? codeItem.sort ?? 1,
      isUse: codeItem.isUse ?? (codeItem.useYn === "Y"),
      remarks: codeItem.remarks || codeItem.desc || "",
    });
  };

  // 코드 인라인 수정 저장 (DB PUT)
  const handleSaveInlineEditCode = async () => {
    if (!codeEdit.editingId || !selectedGroupCode) return;
    const name = codeEdit.editForm.name.trim();

    if (!name) {
      showFeedback("코드명을 입력해주세요.");
      return;
    }

    try {
      const res = await fetch("/api/codes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupCode: selectedGroupCode,
          code: codeEdit.editingId,
          name,
          sortOrder: Number(codeEdit.editForm.sortOrder) || 1,
          isUse: codeEdit.editForm.isUse,
          remarks: codeEdit.editForm.remarks.trim(),
        }),
      });

      const json = await res.json();
      if (!json.success) {
        showFeedback(json.message || "코드 수정에 실패했습니다.");
        return;
      }

      await refreshCodes();
      showFeedback(`코드 [${codeEdit.editingId}] 정보가 수정되었습니다.`);
      codeEdit.cancelEdit();
    } catch (e: any) {
      showFeedback("코드 수정 중 네트워크 오류가 발생했습니다.");
    }
  };

  // 코드 삭제 (DB DELETE)
  const handleDeleteCode = async (codeItem: CodeItem) => {
    if (!window.confirm(`[${codeItem.name}(${codeItem.code})] 코드를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const groupCode = codeItem.groupCode || codeItem.group || selectedGroupCode;
      const res = await fetch(
        `/api/codes?groupCode=${encodeURIComponent(groupCode)}&code=${encodeURIComponent(codeItem.code)}`,
        { method: "DELETE" }
      );

      const json = await res.json();
      if (!json.success) {
        showFeedback(json.message || "코드 삭제에 실패했습니다.");
        return;
      }

      await refreshCodes();
      if (selectedDetailCode === codeItem.code) {
        setSelectedDetailCode(null);
      }
      codeEdit.reset();
      showFeedback(`코드 [${codeItem.code}]이(가) 삭제되었습니다.`);
    } catch (e: any) {
      showFeedback("코드 삭제 중 네트워크 오류가 발생했습니다.");
    }
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
            <AdminGridHeaderActions
              isBusy={groupEdit.isBusy}
              hasSelection={!!currentSelectedGroup}
              onAdd={handleStartAddGroup}
              onEdit={() => currentSelectedGroup && handleStartEditGroup(currentSelectedGroup)}
              onDelete={() => currentSelectedGroup && handleDeleteGroup(currentSelectedGroup)}
              onCancel={() => (groupEdit.isAdding ? groupEdit.cancelAdd() : groupEdit.cancelEdit())}
              onSave={() => (groupEdit.isAdding ? handleSaveInlineGroup() : handleSaveInlineEditGroup())}
              addLabel="그룹 추가"
            />
          }
        >
          {/* 상단 툴바: 검색 영역 */}
          <div className="flex items-center justify-between gap-3 mb-2.5 shrink-0">
            <div className="w-full max-w-xs sm:max-w-sm">
              <AdminSearchInput
                placeholder="그룹 코드 또는 그룹명 검색..."
                value={groupSearch}
                onChange={setGroupSearch}
              />
            </div>

            <div className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:block">
              {groupEdit.editingId
                ? "행 정보를 수정한 후 저장 또는 Enter를 누르세요."
                : groupEdit.isAdding
                ? "신규 행에 정보를 입력 후 저장 또는 Enter를 누르세요."
                : "행 클릭 시 선택되어 수정/삭제할 수 있습니다."}
            </div>
          </div>

          {/* 코드그룹 테이블 그리드 (공통 AdminTable 적용) */}
          <AdminTable<CodeGroupItem>
            columns={groupColumns}
            data={filteredGroups}
            keyField="groupCode"
            selectedId={selectedGroupCode}
            onRowClick={(row) => handleSelectGroup(row.groupCode)}
            isLoading={isCodesLoading}
            emptyTitle="검색된 코드그룹이 없습니다."
            topRow={
              groupEdit.isAdding ? (
                <tr className="bg-amber-500/10 dark:bg-amber-500/15 animate-in fade-in duration-150">
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
                      value={groupEdit.addForm.groupCode}
                      onChange={(e) =>
                        groupEdit.updateAddForm({ groupCode: e.target.value.toUpperCase() })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveInlineGroup();
                        if (e.key === "Escape") groupEdit.cancelAdd();
                      }}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="text"
                      placeholder="예: 참가자 역할 구분"
                      className="w-full px-2 py-1 text-xs font-semibold rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#f99e1a] focus:ring-1 focus:ring-[#f99e1a]"
                      value={groupEdit.addForm.groupName}
                      onChange={(e) =>
                        groupEdit.updateAddForm({ groupName: e.target.value })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveInlineGroup();
                        if (e.key === "Escape") groupEdit.cancelAdd();
                      }}
                    />
                  </td>
                  <td className="px-3 py-2 text-center text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                    0건
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <select
                      className="px-1.5 py-1 text-xs rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#f99e1a]"
                      value={groupEdit.addForm.isUse ? "Y" : "N"}
                      onChange={(e) =>
                        groupEdit.updateAddForm({ isUse: e.target.value === "Y" })
                      }
                    >
                      <option value="Y">사용</option>
                      <option value="N">미사용</option>
                    </select>
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="text"
                      placeholder="설명 / 비고 입력..."
                      className="w-full px-2 py-1 text-xs rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#f99e1a]"
                      value={groupEdit.addForm.remarks}
                      onChange={(e) =>
                        groupEdit.updateAddForm({ remarks: e.target.value })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveInlineGroup();
                        if (e.key === "Escape") groupEdit.cancelAdd();
                      }}
                    />
                  </td>
                </tr>
              ) : null
            }
            renderRow={(g) => {
              if (!groupEdit.isEditing(g.groupCode)) return null;
              const codeCount = groupCodeCountMap[g.groupCode] || 0;
              return (
                <tr
                  key={g.groupCode}
                  className="bg-amber-500/10 dark:bg-amber-500/15 animate-in fade-in duration-150"
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
                      value={groupEdit.editForm.groupName}
                      onChange={(e) =>
                        groupEdit.updateEditForm({ groupName: e.target.value })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveInlineEditGroup();
                        if (e.key === "Escape") groupEdit.cancelEdit();
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
                      value={groupEdit.editForm.isUse ? "Y" : "N"}
                      onChange={(e) =>
                        groupEdit.updateEditForm({ isUse: e.target.value === "Y" })
                      }
                    >
                      <option value="Y">사용</option>
                      <option value="N">미사용</option>
                    </select>
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="text"
                      placeholder="설명 / 비고"
                      className="w-full px-2 py-1 text-xs rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#f99e1a]"
                      value={groupEdit.editForm.remarks}
                      onChange={(e) =>
                        groupEdit.updateEditForm({ remarks: e.target.value })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveInlineEditGroup();
                        if (e.key === "Escape") groupEdit.cancelEdit();
                      }}
                    />
                  </td>
                </tr>
              );
            }}
          />
        </AdminCard>
      </div>

      {/* ========================================================================= */}
      {/* [하단 그리드 (50%)]: 선택된 코드그룹의 세부 코드 관리 그리드 */}
      {/* ========================================================================= */}
      <div className="flex-1 min-h-[300px] lg:min-h-0 flex flex-col">
        <AdminCard
          title="세부 코드 관리"
          countBadge={
            currentSelectedGroup
              ? `등록 ${filteredCodes.length}건`
              : "그룹 미선택"
          }
          className="h-full flex flex-col !p-4 md:!p-5"
          actions={
            <AdminGridHeaderActions
              isBusy={codeEdit.isBusy}
              hasSelection={!!currentSelectedCode}
              onAdd={handleStartAddCode}
              onEdit={() => currentSelectedCode && handleStartEditCode(currentSelectedCode)}
              onDelete={() => currentSelectedCode && handleDeleteCode(currentSelectedCode)}
              onCancel={() => (codeEdit.isAdding ? codeEdit.cancelAdd() : codeEdit.cancelEdit())}
              onSave={() => (codeEdit.isAdding ? handleSaveInlineCode() : handleSaveInlineEditCode())}
              addLabel="코드 등록"
            />
          }
        >
          {/* 하단 툴바: 검색 영역 */}
          <div className="flex items-center justify-between gap-3 mb-2.5 shrink-0">
            <div className="w-full max-w-xs sm:max-w-sm">
              <AdminSearchInput
                placeholder="코드 ID 또는 코드명 검색..."
                value={codeSearch}
                onChange={setCodeSearch}
              />
            </div>

            <div className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:block">
              {codeEdit.editingId
                ? "행 정보를 수정한 후 저장 또는 Enter를 누르세요."
                : codeEdit.isAdding
                ? "신규 행에 정보를 입력 후 저장 또는 Enter를 누르세요."
                : "행 클릭 시 선택되어 수정/삭제할 수 있습니다."}
            </div>
          </div>

          {/* 세부코드 테이블 그리드 (공통 AdminTable 적용) */}
          <AdminTable<CodeItem>
            columns={codeColumns}
            data={filteredCodes}
            keyField="code"
            selectedId={selectedDetailCode}
            onRowClick={(row) => setSelectedDetailCode(row.code)}
            isLoading={isCodesLoading}
            emptyIcon={!selectedGroupCode ? "👆" : "⚙️"}
            emptyTitle={
              !selectedGroupCode
                ? "상단 그리드에서 코드 그룹을 먼저 선택해주세요."
                : "등록된 세부 코드가 없습니다."
            }
            emptyDescription={
              !selectedGroupCode
                ? undefined
                : "우측 상단의 '+ 코드 등록' 버튼을 눌러 새로운 코드를 등록해주세요."
            }
            topRow={
              codeEdit.isAdding ? (
                <tr className="bg-amber-500/10 dark:bg-amber-500/15 animate-in fade-in duration-150">
                  <td className="px-2 py-2 text-center whitespace-nowrap">
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-extrabold bg-[#f99e1a] text-slate-950 shadow-2xs whitespace-nowrap leading-none tracking-tight">
                      NEW
                    </span>
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="text"
                      autoFocus
                      placeholder="예: ROLE_DPS"
                      className="w-full px-2 py-1 text-xs font-mono font-bold uppercase rounded bg-white dark:bg-slate-900 border border-[#f99e1a] text-[#f99e1a] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f99e1a]/30 shadow-2xs"
                      value={codeEdit.addForm.code}
                      onChange={(e) =>
                        codeEdit.updateAddForm({ code: e.target.value.toUpperCase() })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveInlineCode();
                        if (e.key === "Escape") codeEdit.cancelAdd();
                      }}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="text"
                      placeholder="예: 딜러 (공격군)"
                      className="w-full px-2 py-1 text-xs font-semibold rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#f99e1a] focus:ring-1 focus:ring-[#f99e1a]"
                      value={codeEdit.addForm.name}
                      onChange={(e) =>
                        codeEdit.updateAddForm({ name: e.target.value })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveInlineCode();
                        if (e.key === "Escape") codeEdit.cancelAdd();
                      }}
                    />
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <select
                      className="px-1.5 py-1 text-xs rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#f99e1a]"
                      value={codeEdit.addForm.isUse ? "Y" : "N"}
                      onChange={(e) =>
                        codeEdit.updateAddForm({ isUse: e.target.value === "Y" })
                      }
                    >
                      <option value="Y">사용</option>
                      <option value="N">미사용</option>
                    </select>
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="text"
                      placeholder="코드 설명 및 비고 입력..."
                      className="w-full px-2 py-1 text-xs rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#f99e1a]"
                      value={codeEdit.addForm.remarks}
                      onChange={(e) =>
                        codeEdit.updateAddForm({ remarks: e.target.value })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveInlineCode();
                        if (e.key === "Escape") codeEdit.cancelAdd();
                      }}
                    />
                  </td>
                </tr>
              ) : null
            }
            renderRow={(c) => {
              if (!codeEdit.isEditing(c.code)) return null;
              return (
                <tr
                  key={c.code}
                  className="bg-amber-500/10 dark:bg-amber-500/15 animate-in fade-in duration-150"
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
                      placeholder="코드명"
                      className="w-full px-2 py-1 text-xs font-semibold rounded bg-white dark:bg-slate-900 border border-[#f99e1a] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#f99e1a]"
                      value={codeEdit.editForm.name}
                      onChange={(e) =>
                        codeEdit.updateEditForm({ name: e.target.value })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveInlineEditCode();
                        if (e.key === "Escape") codeEdit.cancelEdit();
                      }}
                    />
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <select
                      className="px-1.5 py-1 text-xs rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#f99e1a]"
                      value={codeEdit.editForm.isUse ? "Y" : "N"}
                      onChange={(e) =>
                        codeEdit.updateEditForm({ isUse: e.target.value === "Y" })
                      }
                    >
                      <option value="Y">사용</option>
                      <option value="N">미사용</option>
                    </select>
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="text"
                      placeholder="코드 설명 / 비고..."
                      className="w-full px-2 py-1 text-xs rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#f99e1a]"
                      value={codeEdit.editForm.remarks}
                      onChange={(e) =>
                        codeEdit.updateEditForm({ remarks: e.target.value })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveInlineEditCode();
                        if (e.key === "Escape") codeEdit.cancelEdit();
                      }}
                    />
                  </td>
                </tr>
              );
            }}
          />
        </AdminCard>
      </div>
    </section>
  );
}
