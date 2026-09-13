// lib/hooks/useInlineGridEdit.ts
/**
 * [인라인 그리드 행 추가 및 수정 상태 관리 커스텀 훅]
 * - 모달 대신 그리드 최상단 또는 행 자체를 입력/수정 폼으로 전환하는 인라인 편집 상태 머신
 * - 추가 모드(isAdding), 수정 대상 행 ID(editingId), 각각의 폼 상태를 표준화된 인터페이스로 캡슐화합니다.
 */
"use client";

import { useState, useCallback } from "react";

export interface UseInlineGridEditReturn<TAdd, TEdit> {
  /** 신규 행 추가 모드 여부 */
  isAdding: boolean;
  /** 신규 행 추가 폼 데이터 */
  addForm: TAdd;
  /** 신규 행 폼 상태 setter */
  setAddForm: React.Dispatch<React.SetStateAction<TAdd>>;
  /** 현재 수정 중인 행의 고유 ID (없을 경우 null) */
  editingId: string | null;
  /** 수정 폼 데이터 */
  editForm: TEdit;
  /** 수정 폼 상태 setter */
  setEditForm: React.Dispatch<React.SetStateAction<TEdit>>;
  /** 추가 또는 수정 작업이 진행 중인지 여부 */
  isBusy: boolean;
  /** 특정 행이 현재 수정 모드인지 판별하는 헬퍼 함수 */
  isEditing: (id: string) => boolean;
  /** 신규 행 추가 모드 시작 */
  startAdd: (customInitial?: Partial<TAdd>) => void;
  /** 신규 행 추가 취소 */
  cancelAdd: () => void;
  /** 특정 행 수정 모드 시작 */
  startEdit: (id: string, initialValues: TEdit) => void;
  /** 수정 취소 */
  cancelEdit: () => void;
  /** 모든 편집/추가 상태 초기화 */
  reset: () => void;
  /** 신규 폼 부분 업데이트 헬퍼 */
  updateAddForm: (patch: Partial<TAdd> | ((prev: TAdd) => TAdd)) => void;
  /** 수정 폼 부분 업데이트 헬퍼 */
  updateEditForm: (patch: Partial<TEdit> | ((prev: TEdit) => TEdit)) => void;
}

export function useInlineGridEdit<TAdd, TEdit = TAdd>(
  defaultAddForm: TAdd,
  defaultEditForm: TEdit
): UseInlineGridEditReturn<TAdd, TEdit> {
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState<TAdd>(defaultAddForm);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<TEdit>(defaultEditForm);

  // 추가 모드 시작
  const startAdd = useCallback(
    (customInitial?: Partial<TAdd>) => {
      setEditingId(null);
      setIsAdding(true);
      setAddForm({
        ...defaultAddForm,
        ...(customInitial || {}),
      });
    },
    [defaultAddForm]
  );

  // 추가 모드 취소
  const cancelAdd = useCallback(() => {
    setIsAdding(false);
    setAddForm(defaultAddForm);
  }, [defaultAddForm]);

  // 수정 모드 시작
  const startEdit = useCallback((id: string, initialValues: TEdit) => {
    setIsAdding(false);
    setEditingId(id);
    setEditForm(initialValues);
  }, []);

  // 수정 모드 취소
  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditForm(defaultEditForm);
  }, [defaultEditForm]);

  // 전체 초기화
  const reset = useCallback(() => {
    setIsAdding(false);
    setEditingId(null);
    setAddForm(defaultAddForm);
    setEditForm(defaultEditForm);
  }, [defaultAddForm, defaultEditForm]);

  // 편의 헬퍼: 부분 업데이트
  const updateAddForm = useCallback(
    (patch: Partial<TAdd> | ((prev: TAdd) => TAdd)) => {
      setAddForm((prev) =>
        typeof patch === "function" ? patch(prev) : { ...prev, ...patch }
      );
    },
    []
  );

  const updateEditForm = useCallback(
    (patch: Partial<TEdit> | ((prev: TEdit) => TEdit)) => {
      setEditForm((prev) =>
        typeof patch === "function" ? patch(prev) : { ...prev, ...patch }
      );
    },
    []
  );

  return {
    isAdding,
    addForm,
    setAddForm,
    editingId,
    editForm,
    setEditForm,
    isBusy: isAdding || editingId !== null,
    isEditing: (id: string) => editingId === id,
    startAdd,
    cancelAdd,
    startEdit,
    cancelEdit,
    reset,
    updateAddForm,
    updateEditForm,
  };
}
