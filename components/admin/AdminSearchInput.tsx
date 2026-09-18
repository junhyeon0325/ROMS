// components/admin/AdminSearchInput.tsx
/**
 * [관리자 공통 검색 인풋 컴포넌트]
 * - 상단 라벨, 값 입력 시 노출되는 '지우기' 버튼, 우측 아이콘이 통합된 표준 검색 인풋
 * - 4분할 검색 바 및 그리드 상단 툴바에서 일관된 스타일 제공
 */
"use client";

import React from "react";

export interface AdminSearchInputProps {
  /** 인풋 상단 라벨 문구 (선택 사항) */
  label?: string;
  /** 현재 입력값 */
  value: string;
  /** 입력 변경 시 핸들러 */
  onChange: (value: string) => void;
  /** 입력 힌트 placeholder */
  placeholder?: string;
  /** 값 초기화 핸들러 (미지정 시 onChange("") 호출) */
  onClear?: () => void;
  /** 우측 아이콘 (미지정 시 기본 돋보기 아이콘 렌더링) */
  icon?: React.ReactNode;
  /** 전체 감싸는 컨테이너 클래스 */
  containerClassName?: string;
  /** input 요소 추가 클래스 */
  inputClassName?: string;
  /** 자동 포커스 여부 */
  autoFocus?: boolean;
  /** 비활성화 여부 */
  disabled?: boolean;
}

export default function AdminSearchInput({
  label,
  value,
  onChange,
  placeholder = "검색어를 입력하세요...",
  onClear,
  icon,
  containerClassName = "",
  inputClassName = "",
  autoFocus = false,
  disabled = false,
}: AdminSearchInputProps) {
  const handleClear = () => {
    if (disabled) return;
    if (onClear) {
      onClear();
    } else {
      onChange("");
    }
  };

  return (
    <div className={containerClassName}>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {label}
          </label>
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              지우기
            </button>
          )}
        </div>
      )}
      <div className="relative">
        <input
          type="text"
          autoFocus={autoFocus}
          disabled={disabled}
          className={`w-full pl-3 pr-8 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f99e1a]/20 focus:border-[#f99e1a] transition-all ${
            disabled ? "opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800/60" : ""
          } ${inputClassName}`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center">
          {icon ? (
            icon
          ) : (
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
