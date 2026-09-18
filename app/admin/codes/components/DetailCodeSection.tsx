// app/admin/codes/components/DetailCodeSection.tsx
/**
 * [세부 공통코드 관리 그리드 섹션 컴포넌트]
 * - 하단 50% 영역 전담
 * - 온디맨드 인메모리 캐시(useRef<Map>) 적용 (반복 전환 시 0ms 즉시 렌더링)
 * - 세부 코드 CRUD, 검색(useDeferredValue), 식별자(PK) 자동 마스킹
 */
"use client";

import React, {
  useState,
  useMemo,
  useRef,
  useCallback,
  useEffect,
  useDeferredValue,
} from "react";
import { useAdmin } from "@/lib/context/AdminContext";
import { CodeItem } from "@/lib/types/admin";
import AdminCard from "@/components/admin/AdminCard";
import AdminGridHeaderActions from "@/components/admin/AdminGridHeaderActions";
import AdminSearchInput from "@/components/admin/AdminSearchInput";
import AdminTable, { AdminTableColumn } from "@/components/admin/AdminTable";
import { useInlineGridEdit } from "@/lib/hooks/useInlineGridEdit";

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

interface DetailCodeSectionProps {
  selectedGroupCode: string;
  selectedGroupName?: string;
}

export default function DetailCodeSection({
  selectedGroupCode,
  selectedGroupName,
}: DetailCodeSectionProps) {
  const { showFeedback } = useAdmin();

  // 1. 인메모리 캐시: groupCode -> CodeItem[]
  const cacheRef = useRef<Map<string, CodeItem[]>>(new Map());

  // 2. 상태
  const [detailCodes, setDetailCodes] = useState<CodeItem[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
  const [selectedDetailCode, setSelectedDetailCode] = useState<string | null>(
    null
  );

  // 3. 검색 상태 및 지연 평가(Deferred Value)
  const [codeSearch, setCodeSearch] = useState("");
  const deferredCodeSearch = useDeferredValue(codeSearch);

  // 4. 인라인 그리드 편집 상태 훅
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

  // 세부 코드 비동기 조회 (인메모리 캐시 우선 참조)
  const fetchDetailCodes = useCallback(
    async (groupCode: string, forceRefresh = false) => {
      if (!groupCode) {
        setDetailCodes([]);
        setIsDetailLoading(false);
        return;
      }

      // 캐시가 있고 강제 갱신이 아니면 0ms 즉시 반환
      if (!forceRefresh && cacheRef.current.has(groupCode)) {
        setDetailCodes(cacheRef.current.get(groupCode)!);
        setIsDetailLoading(false);
        return;
      }

      try {
        setIsDetailLoading(true);
        const res = await fetch(
          `/api/codes?groupCode=${encodeURIComponent(groupCode)}`
        );
        const json = await res.json();

        if (json.success && Array.isArray(json.data)) {
          cacheRef.current.set(groupCode, json.data);
          setDetailCodes(json.data);
        } else {
          setDetailCodes([]);
        }
      } catch (err) {
        console.error(`세부 코드 [${groupCode}] 조회 실패:`, err);
        setDetailCodes([]);
      } finally {
        setIsDetailLoading(false);
      }
    },
    []
  );

  // 상위 선택 그룹 변경 시 데이터 로드 및 선택 상태 초기화
  useEffect(() => {
    setSelectedDetailCode(null);
    codeEdit.reset();
    setCodeSearch("");

    if (selectedGroupCode) {
      fetchDetailCodes(selectedGroupCode);
    } else {
      setDetailCodes([]);
    }
  }, [selectedGroupCode, fetchDetailCodes]);

  // 필터링된 세부 코드 목록
  const filteredCodes = useMemo(() => {
    if (!selectedGroupCode) return [];
    return detailCodes
      .filter((c) => {
        const query = deferredCodeSearch.toLowerCase().trim();
        if (!query) return true;
        const remarksVal = c.remarks || "";
        return (
          c.code.toLowerCase().includes(query) ||
          c.name.toLowerCase().includes(query) ||
          remarksVal.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [detailCodes, selectedGroupCode, deferredCodeSearch]);

  // 현재 선택된 세부 코드 객체
  const currentSelectedCode = useMemo(() => {
    if (!selectedDetailCode) return null;
    return filteredCodes.find((c) => c.code === selectedDetailCode) || null;
  }, [filteredCodes, selectedDetailCode]);

  // 테이블 컬럼 정의
  const codeColumns: AdminTableColumn<CodeItem>[] = useMemo(
    () => [
      {
        key: "index",
        header: "순번",
        width: "w-14 min-w-[56px]",
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
        width: "w-44",
        render: (row) => (
          <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
            {row.code}
          </span>
        ),
      },
      {
        key: "name",
        header: "코드명",
        width: "w-60",
        render: (row) => (
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {row.name}
          </span>
        ),
      },
      {
        key: "sortOrder",
        header: "순서",
        width: "w-20 min-w-[70px]",
        align: "center",
        render: (row) => (
          <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
            {row.sortOrder}
          </span>
        ),
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
        header: "코드 설명",
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
    []
  );

  // 세부 코드 추가 시작
  const handleStartAddCode = () => {
    if (!selectedGroupCode) {
      showFeedback("먼저 상단 그리드에서 코드 그룹을 선택해주세요.");
      return;
    }
    const maxSort =
      filteredCodes.length > 0
        ? Math.max(...filteredCodes.map((c) => c.sortOrder || 0))
        : 0;
    codeEdit.startAdd({
      code: "",
      name: "",
      sortOrder: maxSort + 1,
      isUse: true,
      remarks: "",
    });
  };

  // 세부 코드 저장 (DB POST)
  const handleSaveInlineCode = async () => {
    if (!selectedGroupCode) return;
    const code = codeEdit.addForm.code.trim().toUpperCase();
    const name = codeEdit.addForm.name.trim();

    if (!code || !name) {
      showFeedback("코드 ID와 코드명을 모두 입력해주세요.");
      return;
    }

    const CODE_REGEX = /^[A-Z0-9_]+$/;
    if (!CODE_REGEX.test(code)) {
      showFeedback(
        "세부 코드 ID는 영문 대문자, 숫자, 언더스코어(_)만 사용할 수 있습니다."
      );
      return;
    }

    const isDuplicate = detailCodes.some((c) => c.code === code);
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

      // 강제 갱신으로 캐시 갱신
      await fetchDetailCodes(selectedGroupCode, true);
      setSelectedDetailCode(code);
      codeEdit.cancelAdd();
      showFeedback(`신규 코드 [${code}]이(가) DB에 등록되었습니다.`);
    } catch (e: any) {
      showFeedback("코드 등록 중 네트워크 오류가 발생했습니다.");
    }
  };

  // 코드 수정 시작
  const handleStartEditCode = (codeItem: CodeItem) => {
    codeEdit.startEdit(codeItem.code, {
      name: codeItem.name,
      sortOrder: codeItem.sortOrder,
      isUse: codeItem.isUse,
      remarks: codeItem.remarks || "",
    });
  };

  // 코드 수정 저장 (DB PUT)
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

      // 강제 갱신으로 캐시 갱신
      await fetchDetailCodes(selectedGroupCode, true);
      showFeedback(`코드 [${codeEdit.editingId}] 정보가 수정되었습니다.`);
      codeEdit.cancelEdit();
    } catch (e: any) {
      showFeedback("코드 수정 중 네트워크 오류가 발생했습니다.");
    }
  };

  // 코드 삭제 (DB DELETE)
  const handleDeleteCode = async (codeItem: CodeItem) => {
    if (
      !window.confirm(
        `[${codeItem.name}(${codeItem.code})] 코드를 삭제하시겠습니까?`
      )
    ) {
      return;
    }

    try {
      const groupCode = codeItem.groupCode || selectedGroupCode;
      const res = await fetch(
        `/api/codes?groupCode=${encodeURIComponent(
          groupCode
        )}&code=${encodeURIComponent(codeItem.code)}`,
        { method: "DELETE" }
      );

      const json = await res.json();
      if (!json.success) {
        showFeedback(json.message || "코드 삭제에 실패했습니다.");
        return;
      }

      // 강제 갱신으로 캐시 갱신
      await fetchDetailCodes(selectedGroupCode, true);
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
    <div className="flex-1 min-h-[300px] lg:min-h-0 flex flex-col">
      <AdminCard
        title="세부 코드 관리"
        countBadge={
          selectedGroupCode
            ? `${selectedGroupName ? `[${selectedGroupName}] ` : ""}등록 ${
                filteredCodes.length
              }건`
            : "그룹 미선택"
        }
        className="h-full flex flex-col !p-4 md:!p-5"
        actions={
          <AdminGridHeaderActions
            isBusy={codeEdit.isBusy}
            hasSelection={!!currentSelectedCode}
            onAdd={handleStartAddCode}
            onEdit={() =>
              currentSelectedCode && handleStartEditCode(currentSelectedCode)
            }
            onDelete={() =>
              currentSelectedCode && handleDeleteCode(currentSelectedCode)
            }
            onCancel={() =>
              codeEdit.isAdding ? codeEdit.cancelAdd() : codeEdit.cancelEdit()
            }
            onSave={() =>
              codeEdit.isAdding
                ? handleSaveInlineCode()
                : handleSaveInlineEditCode()
            }
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
              disabled={!selectedGroupCode}
            />
          </div>

          <div className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:block">
            {codeEdit.editingId
              ? "행 정보를 수정한 후 저장 또는 Enter를 누르세요. (식별자 코드 ID는 수정 불가)"
              : codeEdit.isAdding
              ? "신규 행에 정보를 입력 후 저장 또는 Enter를 누르세요."
              : selectedGroupCode
              ? "행 클릭 시 선택되어 수정/삭제할 수 있습니다."
              : "상단 그리드에서 코드 그룹을 먼저 선택해주세요."}
          </div>
        </div>

        {/* 세부코드 테이블 그리드 */}
        <AdminTable<CodeItem>
          columns={codeColumns}
          data={filteredCodes}
          keyField="code"
          selectedId={selectedDetailCode}
          onRowClick={(row) => setSelectedDetailCode(row.code)}
          isLoading={isDetailLoading}
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
                      codeEdit.updateAddForm({
                        code: e.target.value
                          .toUpperCase()
                          .replace(/[^A-Z0-9_]/g, ""),
                      })
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
                  <input
                    type="number"
                    min="0"
                    className="w-16 px-1.5 py-1 text-xs text-center font-mono font-bold rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#f99e1a]"
                    value={codeEdit.addForm.sortOrder}
                    onChange={(e) =>
                      codeEdit.updateAddForm({
                        sortOrder: Number(e.target.value) || 0,
                      })
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
                  <div
                    className="flex items-center gap-1.5"
                    title="식별자 불변 원칙: 세부 코드 ID는 수정할 수 없습니다."
                  >
                    <span>{c.code}</span>
                    <span className="text-[10px] px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-sans font-normal">
                      고정
                    </span>
                  </div>
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
                  <input
                    type="number"
                    min="0"
                    className="w-16 px-1.5 py-1 text-xs text-center font-mono font-bold rounded bg-white dark:bg-slate-900 border border-[#f99e1a] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#f99e1a]"
                    value={codeEdit.editForm.sortOrder}
                    onChange={(e) =>
                      codeEdit.updateEditForm({
                        sortOrder: Number(e.target.value) || 0,
                      })
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
  );
}
