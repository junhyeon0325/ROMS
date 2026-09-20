// File: app/admin/codes/hooks/useCodeGroupManagement.ts
// Page/Component: useCodeGroupManagement
// Purpose: 코드 그룹 목록 조회와 생성·수정·삭제 요청의 로딩, 오류, 알림 처리를 한곳에서 관리한다.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { deleteCodeGroup, saveCodeGroup } from "@/lib/codes/codeClient";
import { useAdminCodes, useAdminFeedback } from "@/lib/context/AdminFeatureContexts";
import { useAdminMutation } from "@/lib/hooks/useAdminMutation";
import type { CodeGroupItem } from "@/lib/types/codes";

type SuccessHandler = () => void | Promise<void>;
type CodeGroupPayload = Omit<CodeGroupItem, "createdAt">;

// 코드 그룹 API 요청과 기존 관리자 알림을 연결한다.
export function useCodeGroupManagement() {
  const { items: codeGroups, refresh, isLoading: isCodesLoading, error: contextError } = useAdminCodes();
  const { showFeedback } = useAdminFeedback();
  const { execute: mutateGroup, isPending: isSaving } = useAdminMutation();
  const [error, setError] = useState<Error | null>(null);
  const notifiedErrorRef = useRef<Error | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // Context가 전달한 그룹 목록 조회 오류를 한 번만 사용자 알림으로 표시한다.
  useEffect(() => {
    if (!contextError) {
      notifiedErrorRef.current = null;
      setError(null);
      return;
    }
    setError(contextError);
    if (notifiedErrorRef.current === contextError) return;
    notifiedErrorRef.current = contextError;
    showFeedback(contextError.message || "코드 그룹을 불러오지 못했습니다.");
  }, [contextError, showFeedback]);

  // 목록을 다시 불러올 때 이전 API 오류 상태를 초기화한다.
  const refreshCodeGroups = useCallback(async () => {
    if (!isMountedRef.current) return;
    setError(null);
    try {
      await refresh();
    } catch (cause) {
      if (isMountedRef.current) setError(cause instanceof Error ? cause : new Error("코드 그룹을 불러오지 못했습니다."));
    }
  }, [refresh]);

  // 생성 또는 수정 요청 뒤 목록을 갱신하고 호출자 후속 동작을 수행한다.
  const saveGroup = useCallback(
    async (payload: CodeGroupPayload, isNew: boolean, onSuccess: SuccessHandler) => {
      setError(null);
      await mutateGroup(() => saveCodeGroup(payload, isNew), {
        successMessage: isNew
          ? `신규 그룹 [${payload.groupCode}]이(가) DB에 등록되었습니다.`
          : `그룹 [${payload.groupCode}] 정보가 수정되었습니다.`,
        errorMessage: isNew ? "그룹 등록에 실패했습니다." : "그룹 수정에 실패했습니다.",
        onSuccess: async () => {
          await refreshCodeGroups();
          if (isMountedRef.current) await onSuccess();
        },
        onError: (cause) => {
          if (isMountedRef.current) setError(cause instanceof Error ? cause : new Error("코드 그룹 저장에 실패했습니다."));
        },
      });
    },
    [mutateGroup, refreshCodeGroups],
  );

  // 삭제 요청 뒤 목록을 갱신하고 호출자 후속 동작을 수행한다.
  const removeGroup = useCallback(
    async (groupCode: string, onSuccess: SuccessHandler) => {
      setError(null);
      await mutateGroup(() => deleteCodeGroup(groupCode), {
        successMessage: `그룹 [${groupCode}]이(가) 삭제되었습니다.`,
        errorMessage: "그룹 삭제에 실패했습니다.",
        onSuccess: async () => {
          await refreshCodeGroups();
          if (isMountedRef.current) await onSuccess();
        },
        onError: (cause) => {
          if (isMountedRef.current) setError(cause instanceof Error ? cause : new Error("코드 그룹 삭제에 실패했습니다."));
        },
      });
    },
    [mutateGroup, refreshCodeGroups],
  );

  return { codeGroups, error, isCodesLoading, isSaving, removeGroup, saveGroup };
}
