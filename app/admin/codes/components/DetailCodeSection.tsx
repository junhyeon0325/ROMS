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
  useEffect,
  useDeferredValue,
} from "react";
import { useAdminFeedback } from "@/lib/context/AdminFeatureContexts";
import type { CodeItem } from "@/lib/types/codes";
import AdminCard from "@/components/admin/AdminCard";
import AdminGridHeaderActions from "@/components/admin/AdminGridHeaderActions";
import AdminSearchInput from "@/components/admin/AdminSearchInput";
import { useInlineGridEdit } from "@/lib/hooks/useInlineGridEdit";
import { INITIAL_CODE_ADD_FORM, INITIAL_CODE_EDIT_FORM, type CodeAddForm, type CodeEditForm } from "./codeFormState";
import { useDetailCodeManagement } from "../hooks/useDetailCodeManagement";
import DetailCodeTable from "./DetailCodeTable";

// 세부코드 폼 인터페이스
interface DetailCodeSectionProps {
  selectedGroupCode: string;
  selectedGroupName?: string;
  deletedGroupCode?: string;
}

export default function DetailCodeSection({
  selectedGroupCode,
  selectedGroupName,
  deletedGroupCode,
}: DetailCodeSectionProps) {
  const { showFeedback } = useAdminFeedback();
  const { detailCodes, error: detailCodesError, isDetailLoading, isSaving, removeDetailCode, saveDetailCode } = useDetailCodeManagement(selectedGroupCode, deletedGroupCode);
  const notifiedDetailErrorRef = useRef<Error | null>(null);
  const [selectedDetailCode, setSelectedDetailCode] = useState<string | null>(
    null
  );

  // 3. 검색 상태 및 지연 평가(Deferred Value)
  const [codeSearch, setCodeSearch] = useState("");
  const deferredCodeSearch = useDeferredValue(codeSearch);

  // 4. 인라인 그리드 편집 상태 훅
  const codeEdit = useInlineGridEdit<CodeAddForm, CodeEditForm>(
    INITIAL_CODE_ADD_FORM,
    INITIAL_CODE_EDIT_FORM,
  );
  const { reset: resetCodeEdit } = codeEdit;

  // 상위 선택 그룹 변경 시 UI 선택·편집·검색 상태를 초기화한다.
  useEffect(() => {
    setSelectedDetailCode(null);
    resetCodeEdit();
    setCodeSearch("");
  }, [resetCodeEdit, selectedGroupCode]);

  // 상세 코드 조회 오류를 동일 Error 객체당 한 번만 기존 알림으로 전달한다.
  useEffect(() => {
    if (!detailCodesError) {
      notifiedDetailErrorRef.current = null;
      return;
    }
    if (notifiedDetailErrorRef.current === detailCodesError) return;
    notifiedDetailErrorRef.current = detailCodesError;
    showFeedback(detailCodesError.message || "세부 코드를 불러오지 못했습니다.");
  }, [detailCodesError, showFeedback]);

  // 필터링된 세부 코드 목록
  const filteredCodes = useMemo(() => {
    return detailCodes
      .filter((c) => {
        const query = deferredCodeSearch.toLowerCase().trim();
        if (!query) return true;
        return (
          c.code.toLowerCase().includes(query) ||
          c.name.toLowerCase().includes(query) ||
          (c.remarks && c.remarks.toLowerCase().includes(query))
        );
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [detailCodes, deferredCodeSearch]);

  // 현재 선택된 세부 코드 항목
  const currentSelectedCode = useMemo(() => {
    return detailCodes.find((c) => c.code === selectedDetailCode) || null;
  }, [detailCodes, selectedDetailCode]);

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

  // 세부 코드 인라인 저장 (DB POST - useAdminMutation 적용)
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

    await saveDetailCode(
      { groupCode: selectedGroupCode, code, name, sortOrder: Number(codeEdit.addForm.sortOrder) || 1, isUse: codeEdit.addForm.isUse, remarks: codeEdit.addForm.remarks.trim() },
      true,
      () => {
        setSelectedDetailCode(code);
        codeEdit.cancelAdd();
      },
    );
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

  // 코드 수정 저장 (DB PUT - useAdminMutation 적용)
  const handleSaveInlineEditCode = async () => {
    if (!codeEdit.editingId || !selectedGroupCode) return;
    const name = codeEdit.editForm.name.trim();

    if (!name) {
      showFeedback("코드명을 입력해주세요.");
      return;
    }

    const editingCode = codeEdit.editingId;

    await saveDetailCode(
      { groupCode: selectedGroupCode, code: editingCode, name, sortOrder: Number(codeEdit.editForm.sortOrder) || 1, isUse: codeEdit.editForm.isUse, remarks: codeEdit.editForm.remarks.trim() },
      false,
      () => codeEdit.cancelEdit(),
    );
  };

  // 코드 삭제 (DB DELETE - useAdminMutation 적용)
  const handleDeleteCode = async (codeItem: CodeItem) => {
    if (
      !window.confirm(
        `[${codeItem.name}(${codeItem.code})] 코드를 삭제하시겠습니까?`
      )
    ) {
      return;
    }

    const groupCode = codeItem.groupCode || selectedGroupCode;

    await removeDetailCode(groupCode, codeItem.code, () => {
      if (selectedDetailCode === codeItem.code) {
        setSelectedDetailCode(null);
      }
      codeEdit.reset();
    });
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
            saveDisabled={isSaving}
            saveLabel={isSaving ? "저장 중..." : "저장"}
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
        <DetailCodeTable
          data={filteredCodes}
          selectedGroupCode={selectedGroupCode}
          selectedCode={selectedDetailCode}
          isLoading={isDetailLoading}
          codeEdit={codeEdit}
          onSelectCode={setSelectedDetailCode}
          onSaveAdd={handleSaveInlineCode}
          onSaveEdit={handleSaveInlineEditCode}
        />
      </AdminCard>
    </div>
  );
}
