// File: lib/hooks/useCommonCodes.ts
// Page/Component: useCommonCodes
// Purpose: 요청한 한 개 공통코드 그룹을 화면 간 캐시와 진행 중 요청 공유로 조회한다.
"use client";

import { useEffect, useState } from "react";
import type { CodeItem } from "@/lib/types/codes";

const codeCache = new Map<string, CodeItem[]>();
const pendingRequests = new Map<string, Promise<CodeItem[]>>();

// 필요한 그룹만 조회하고 이미 시작했거나 완료된 조회는 재사용한다.
async function fetchCommonCodes(groupCode: string) {
  const cached = codeCache.get(groupCode);
  if (cached) return cached;
  const pending = pendingRequests.get(groupCode);
  if (pending) return pending;

  const request = fetch(`/api/codes?groupCode=${encodeURIComponent(groupCode)}`)
    .then(async (response) => {
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.success || !Array.isArray(json.data)) {
        throw new Error(json?.message || `${groupCode} 공통코드 조회에 실패했습니다.`);
      }
      const codes = json.data.filter((code: CodeItem) => code.isUse);
      codeCache.set(groupCode, codes);
      return codes;
    })
    .finally(() => pendingRequests.delete(groupCode));
  pendingRequests.set(groupCode, request);
  return request;
}

// 활성 공통코드만 반환하며 같은 그룹은 페이지 전환 뒤에도 다시 요청하지 않는다.
export function useCommonCodes(groupCode: string) {
  const [codes, setCodes] = useState<CodeItem[]>(() => codeCache.get(groupCode) || []);
  const [isLoading, setIsLoading] = useState(() => !codeCache.has(groupCode));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setCodes(codeCache.get(groupCode) || []);
    setIsLoading(!codeCache.has(groupCode));
    setError(null);
    void fetchCommonCodes(groupCode).then(
      (items) => isMounted && setCodes(items),
      (cause: unknown) => isMounted && setError(cause instanceof Error ? cause.message : "공통코드 조회에 실패했습니다."),
    ).finally(() => isMounted && setIsLoading(false));
    return () => { isMounted = false; };
  }, [groupCode]);

  return { codes, isLoading, error };
}
