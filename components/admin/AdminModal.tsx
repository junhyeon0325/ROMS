// components/admin/AdminModal.tsx
/**
 * [관리자 공통 다이얼로그 모달 컴포넌트]
 * - 딤 백드롭, ESC 키보드 이벤트, 팝업 애니메이션, 헤더(타이틀/설명/닫기버튼), 스크롤 락 등을 일관되게 캡슐화
 * - 검색 모달, 등록/수정 팝업, 상세 정보 팝업 등에 공통으로 재사용
 */
"use client";

import React, { useEffect } from "react";

export type AdminModalWidth = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";

interface AdminModalProps {
  /** 모달 열림/닫힘 상태 */
  isOpen: boolean;
  /** 모달 닫기 핸들러 */
  onClose: () => void;
  /** 모달 제목 (문자열 또는 React 노드) */
  title: React.ReactNode;
  /** 모달 부가 설명 문구 (선택) */
  description?: string;
  /** 모달 본문 콘텐츠 */
  children: React.ReactNode;
  /** 모달 하단 액션 영역 (선택) */
  footer?: React.ReactNode;
  /** 모달 최대 가로 너비 (기본값: "lg" = max-w-lg) */
  maxWidth?: AdminModalWidth;
  /** 배경 오버레이 클릭 시 닫기 허용 여부 (기본값: false) */
  closeOnOverlayClick?: boolean;
  /** 모달 본문 래퍼 클래스명 (기본값: "p-5 overflow-y-auto flex-1 min-h-0") */
  bodyClassName?: string;
}

const MAX_WIDTH_CLASSES: Record<AdminModalWidth, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
};

export default function AdminModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = "lg",
  closeOnOverlayClick = false,
  bodyClassName = "p-5 overflow-y-auto flex-1 min-h-0",
}: AdminModalProps) {
  // 1. ESC 키 감지 시 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // 2. 모달 노출 시 바디 스크롤 방지
  useEffect(() => {
    if (!isOpen) return;
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <div
        className={`w-full ${MAX_WIDTH_CLASSES[maxWidth]} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between shrink-0">
          <div>
            <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              {title}
            </div>
            {description && (
              <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="닫기 (Esc)"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 모달 본문 영역 */}
        <div className={bodyClassName}>{children}</div>

        {/* 모달 푸터 (선택) */}
        {footer && (
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-800/40 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
