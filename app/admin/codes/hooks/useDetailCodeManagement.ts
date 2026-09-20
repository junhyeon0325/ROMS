// File: app/admin/codes/hooks/useDetailCodeManagement.ts
// Page/Component: useDetailCodeManagement
// Purpose: 선택된 코드 그룹의 상세 코드 조회와 CRUD 요청, 캐시, 로딩·오류·알림 처리를 관리한다.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { deleteCode, fetchCodes, saveCode } from "@/lib/codes/codeClient";
import { useAdminCodes } from "@/lib/context/AdminFeatureContexts";
import { useAdminMutation } from "@/lib/hooks/useAdminMutation";
import type { CodeItem } from "@/lib/types/codes";

type SuccessHandler = () => void | Promise<void>;

// 상세 코드 API 요청과 선택 그룹별 인메모리 캐시를 연결한다.
export function useDetailCodeManagement(
  selectedGroupCode: string,
  deletedGroupCode?: string,
) {
  const { items: codeGroups } = useAdminCodes();
  const { execute: mutateDetail, isPending: isSaving } = useAdminMutation();
  const cacheRef = useRef<Map<string, CodeItem[]>>(new Map());
  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);
  const [detailCodes, setDetailCodes] = useState<CodeItem[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 언마운트 뒤의 비동기 응답이 상태를 변경하지 않도록 보호한다.
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // 캐시를 우선 사용하되 강제 갱신 요청에서는 기존 API 형식으로 다시 조회한다.
  const refreshDetailCodes = useCallback(async (groupCode: string, forceRefresh = false) => {
    if (!isMountedRef.current) return;
    const requestId = ++requestIdRef.current;
    if (!groupCode) {
      setError(null);
      setDetailCodes([]);
      setIsDetailLoading(false);
      return;
    }
    if (!forceRefresh && cacheRef.current.has(groupCode)) {
      setError(null);
      setDetailCodes(cacheRef.current.get(groupCode)!);
      setIsDetailLoading(false);
      return;
    }
    try {
      setError(null);
      setIsDetailLoading(true);
      const json = await fetchCodes(groupCode);
      if (!isMountedRef.current || requestId !== requestIdRef.current) return;
      if (json.success && Array.isArray(json.data)) {
        cacheRef.current.set(groupCode, json.data);
        setDetailCodes(json.data);
      } else {
        const cause = new Error(json.message || "세부 코드를 불러오지 못했습니다.");
        setError(cause);
        setDetailCodes([]);
      }
    } catch (cause) {
      if (!isMountedRef.current || requestId !== requestIdRef.current) return;
      setError(cause instanceof Error ? cause : new Error("세부 코드를 불러오지 못했습니다."));
      setDetailCodes([]);
    } finally {
      if (isMountedRef.current && requestId === requestIdRef.current) setIsDetailLoading(false);
    }
  }, []);

  // 선택 그룹이 바뀔 때 해당 그룹의 상세 코드만 조회한다.
  useEffect(() => {
    void refreshDetailCodes(selectedGroupCode);
  }, [refreshDetailCodes, selectedGroupCode]);

  // 삭제된 그룹과 더 이상 존재하지 않는 그룹의 캐시를 정리한다.
  useEffect(() => {
    if (deletedGroupCode) cacheRef.current.delete(deletedGroupCode);
    const currentGroupCodes = new Set(codeGroups.map((group) => group.groupCode));
    for (const cachedGroupCode of cacheRef.current.keys()) {
      if (!currentGroupCodes.has(cachedGroupCode)) cacheRef.current.delete(cachedGroupCode);
    }
  }, [codeGroups, deletedGroupCode]);

  // 생성 또는 수정 요청 후 목록을 갱신하고 기존 성공·실패 알림을 표시한다.
  const saveDetailCode = useCallback(
    async (payload: CodeItem, isNew: boolean, onSuccess: SuccessHandler) => {
      setError(null);
      await mutateDetail(() => saveCode(payload, isNew), {
        successMessage: isNew
          ? `신규 코드 [${payload.code}]이(가) DB에 등록되었습니다.`
          : `코드 [${payload.code}] 정보가 수정되었습니다.`,
        errorMessage: isNew ? "코드 등록에 실패했습니다." : "코드 수정에 실패했습니다.",
        onSuccess: async () => {
          await refreshDetailCodes(payload.groupCode, true);
          if (isMountedRef.current) await onSuccess();
        },
        onError: (cause) => {
          if (isMountedRef.current) setError(cause instanceof Error ? cause : new Error("코드 저장에 실패했습니다."));
        },
      });
    },
    [mutateDetail, refreshDetailCodes],
  );

  // 삭제 요청 후 해당 그룹의 목록을 갱신하고 기존 성공·실패 알림을 표시한다.
  const removeDetailCode = useCallback(
    async (groupCode: string, code: string, onSuccess: SuccessHandler) => {
      setError(null);
      await mutateDetail(() => deleteCode(groupCode, code), {
        successMessage: `코드 [${code}]이(가) 삭제되었습니다.`,
        errorMessage: "코드 삭제에 실패했습니다.",
        onSuccess: async () => {
          await refreshDetailCodes(groupCode, true);
          if (isMountedRef.current) await onSuccess();
        },
        onError: (cause) => {
          if (isMountedRef.current) setError(cause instanceof Error ? cause : new Error("코드 삭제에 실패했습니다."));
        },
      });
    },
    [mutateDetail, refreshDetailCodes],
  );

  return { detailCodes, error, isDetailLoading, isSaving, removeDetailCode, saveDetailCode };
}
