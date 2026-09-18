// lib/hooks/useAdminMutation.ts
/**
 * [관리자 비동기 CUD 작업 전담 커스텀 훅]
 * - 등록(Create), 수정(Update), 삭제(Delete) 등 비동기 API 통신 시
 *   중복 실행 차단(isPending), 성공/실패 토스트 피드백(showFeedback), 예외 처리를 표준화합니다.
 */
"use client";

import { useState, useCallback } from "react";
import { useAdmin } from "@/lib/context/AdminContext";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface MutationOptions<T = any> {
  /** 작업 성공 시 노출할 토스트 피드백 메시지 (또는 데이터를 인자로 받는 동적 생성 함수) */
  successMessage?: string | ((data?: T) => string);
  /** 작업 실패 시 기본으로 노출할 에러 메시지 (서버의 message가 우선 적용됨) */
  errorMessage?: string;
  /** 성공 시 실행할 후속 콜백 (데이터 갱신, 폼 초기화 등) */
  onSuccess?: (data?: T) => void | Promise<void>;
  /** 실패 시 실행할 에러 콜백 */
  onError?: (err: any) => void;
  /** 성공 토스트 노출 여부 (기본값: true) */
  showSuccessFeedback?: boolean;
  /** 실패 토스트 노출 여부 (기본값: true) */
  showErrorFeedback?: boolean;
}

export function useAdminMutation() {
  const { showFeedback } = useAdmin();
  const [isPending, setIsPending] = useState(false);

  /**
   * 비동기 mutation 액션을 안전하게 실행합니다.
   * @param asyncAction ApiResponse 형태를 반환하는 비동기 함수
   * @param options 피드백 메시지 및 성공/실패 콜백 옵션
   * @returns 작업 성공 여부 (boolean)
   */
  const execute = useCallback(
    async <T = any>(
      asyncAction: () => Promise<ApiResponse<T>>,
      options?: MutationOptions<T>
    ): Promise<boolean> => {
      if (isPending) return false;

      const {
        successMessage,
        errorMessage = "요청 처리에 실패했습니다.",
        onSuccess,
        onError,
        showSuccessFeedback = true,
        showErrorFeedback = true,
      } = options || {};

      setIsPending(true);

      try {
        const result = await asyncAction();

        if (result && result.success) {
          // 1. 성공 토스트 출력
          if (showSuccessFeedback && successMessage) {
            const msg =
              typeof successMessage === "function"
                ? successMessage(result.data)
                : successMessage;
            if (msg) showFeedback(msg);
          }

          // 2. 성공 후속 처리 콜백
          if (onSuccess) {
            await onSuccess(result.data);
          }

          return true;
        } else {
          // 서버 측 실패 응답
          const errorMsg = result?.message || errorMessage;
          if (showErrorFeedback) {
            showFeedback(errorMsg);
          }
          if (onError) {
            onError(new Error(errorMsg));
          }
          return false;
        }
      } catch (err: any) {
        // 네트워크 또는 런타임 예외
        const networkErrorMsg =
          errorMessage || "통신 중 네트워크 오류가 발생했습니다.";
        if (showErrorFeedback) {
          showFeedback(networkErrorMsg);
        }
        if (onError) {
          onError(err);
        }
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [isPending, showFeedback]
  );

  return {
    execute,
    isPending,
  };
}
