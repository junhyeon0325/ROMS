// components/admin/AdminStatusRadio.tsx
/**
 * [관리자 공통 상태 선택 라디오 버튼 컴포넌트]
 * - 등록/수정 폼에서 "사용 (활성)" / "미사용 (비활성)" 또는 불리언 상태를 선택하는 2단 버튼 그룹
 * - 미사용 상태 전환 시 경고/안내 가이드 문구를 자동으로 서포트합니다.
 */
import React from "react";

interface AdminStatusRadioProps {
  /** 현재 선택된 값 (true: 활성, false: 비활성) */
  value: boolean;
  /** 값 변경 핸들러 */
  onChange: (nextValue: boolean) => void;
  /** 라디오 input 고유 name 속성 (접근성/그룹화용) */
  name?: string;
  /** 필드 상단 레이블 (생략 시 미노출) */
  label?: string;
  /** 활성 상태 버튼 라벨 (기본값: "사용 (활성)") */
  activeLabel?: string;
  /** 비활성 상태 버튼 라벨 (기본값: "미사용 (비활성)") */
  inactiveLabel?: string;
  /** 비활성 선택 시 하단에 노출될 안내 팁 문구 */
  inactiveDescription?: string;
  /** 활성 선택 시 하단에 노출될 안내 팁 문구 */
  activeDescription?: string;
  /** 비활성화 여부 */
  disabled?: boolean;
}

export default function AdminStatusRadio({
  value,
  onChange,
  name = "isUseRadio",
  label,
  activeLabel = "사용 (활성)",
  inactiveLabel = "미사용 (비활성)",
  inactiveDescription,
  activeDescription,
  disabled = false,
}: AdminStatusRadioProps) {
  return (
    <div>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
        </label>
      )}

      <div className="flex gap-2">
        {/* 활성 (사용) 버튼 */}
        <label
          className={`flex-1 text-center py-2 text-xs font-semibold rounded-xl border transition-all select-none ${
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          } ${
            value
              ? "bg-emerald-500 text-white font-bold border-emerald-500 shadow-2xs"
              : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <input
            type="radio"
            name={name}
            className="hidden"
            checked={value}
            disabled={disabled}
            onChange={() => onChange(true)}
          />
          {activeLabel}
        </label>

        {/* 비활성 (미사용) 버튼 */}
        <label
          className={`flex-1 text-center py-2 text-xs font-semibold rounded-xl border transition-all select-none ${
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          } ${
            !value
              ? "bg-slate-600 text-white font-bold border-slate-600 shadow-2xs"
              : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <input
            type="radio"
            name={name}
            className="hidden"
            checked={!value}
            disabled={disabled}
            onChange={() => onChange(false)}
          />
          {inactiveLabel}
        </label>
      </div>

      {/* 안내 팁 메시지 */}
      {!value && inactiveDescription && (
        <p className="mt-1.5 text-[11px] text-amber-600 dark:text-amber-400 leading-relaxed">
          💡 {inactiveDescription}
        </p>
      )}
      {value && activeDescription && (
        <p className="mt-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 leading-relaxed">
          💡 {activeDescription}
        </p>
      )}
    </div>
  );
}
