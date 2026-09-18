// components/admin/AdminFormField.tsx
/**
 * [관리자 공통 폼 필드 레이아웃 래퍼 컴포넌트]
 * - 입력 필드 상단의 라벨, 필수 입력 표시(*), 우측 부가 컨트롤, 하단 안내 문구(💡) 및 에러 메시지 규격을 통일
 */
import React from "react";

interface AdminFormFieldProps {
  /** 필드 레이블 */
  label: React.ReactNode;
  /** 필수 입력 여부 (빨간색 * 표시) */
  required?: boolean;
  /** 레이블 우측 추가 요소 (예: 글자 수, 링크 버튼 등) */
  labelRight?: React.ReactNode;
  /** 하단 안내 팁 또는 도움말 문구 */
  helperText?: React.ReactNode;
  /** 유효성 검증 실패 에러 메시지 */
  error?: string;
  /** 폼 컨트롤 (input, select, textarea 등) */
  children: React.ReactNode;
  /** 래퍼 추가 스타일 클래스 */
  className?: string;
}

export default function AdminFormField({
  label,
  required = false,
  labelRight,
  helperText,
  error,
  children,
  className = "",
}: AdminFormFieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* 레이블 라인 */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label}
          {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
        </label>
        {labelRight && <div className="text-[11px] text-slate-400">{labelRight}</div>}
      </div>

      {/* 입력 컨트롤 본체 */}
      <div>{children}</div>

      {/* 에러 메시지 */}
      {error && (
        <p className="text-[11px] font-medium text-rose-500 dark:text-rose-400 flex items-center gap-1 mt-1">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </p>
      )}

      {/* 안내 도움말 */}
      {!error && helperText && (
        <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
          {typeof helperText === "string" && !helperText.startsWith("💡") ? (
            <p className="flex items-center gap-1">
              <span className="text-slate-400 shrink-0">💡</span>
              <span>{helperText}</span>
            </p>
          ) : (
            helperText
          )}
        </div>
      )}
    </div>
  );
}
