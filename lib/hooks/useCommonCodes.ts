// lib/hooks/useCommonCodes.ts
/**
 * [공통코드 조회 커스텀 훅]
 * - 지정된 공통코드 그룹(groupCode)의 세부 코드를 API를 통해 동적으로 조회합니다.
 * - 기본적으로 활성화(useYn === 'Y')된 코드를 정렬(sort 오름차순)하여 반환합니다.
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { CodeItem } from "@/lib/types/admin";

interface UseCommonCodesOptions {
  /** 활성화(useYn === 'Y') 코드만 필터링할지 여부 (기본값: true) */
  onlyActive?: boolean;
  /** 자동 조회 여부 (기본값: true) */
  autoFetch?: boolean;
}

export function useCommonCodes(
  groupCode: string,
  options: UseCommonCodesOptions = {}
) {
  const { onlyActive = true, autoFetch = true } = options;

  const [codes, setCodes] = useState<CodeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(groupCode && autoFetch));
  const [error, setError] = useState<string | null>(null);

  const fetchCodes = useCallback(async () => {
    if (!groupCode) {
      setCodes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/codes?group=${encodeURIComponent(groupCode)}`);
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        let items: CodeItem[] = json.data;
        if (onlyActive) {
          items = items.filter((c) => c.isUse);
        }
        items.sort((a, b) => a.sortOrder - b.sortOrder);
        setCodes(items);
      } else {
        setCodes([]);
        setError(json.message || "공통코드 목록 조회에 실패했습니다.");
      }
    } catch (err: any) {
      console.error(`공통코드 [${groupCode}] 조회 중 오류:`, err);
      setError("공통코드 조회 중 통신 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [groupCode, onlyActive]);

  useEffect(() => {
    if (autoFetch) {
      fetchCodes();
    }
  }, [fetchCodes, autoFetch]);

  return {
    codes,
    loading,
    error,
    refetch: fetchCodes,
  };
}
