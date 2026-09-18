// components/admin/AdminBadge.tsx
/**
 * [관리자 공통 상태 및 구분 뱃지 컴포넌트]
 * - 목록 테이블 및 카드 내 상태(사용/미사용, 활성/비활성), 태그, 카테고리 구분을 일관된 디자인 시스템으로 표현
 * - status prop을 통한 자동 사용/미사용 매핑 또는 커스텀 variant 지원
 */
import React from "react";

export type AdminBadgeVariant = "success" | "neutral" | "brand" | "warning" | "danger";

interface AdminBadgeProps {
  /** 불리언 또는 상태 문자열 (true/'ACTIVE': success, false/'INACTIVE': neutral) */
  status?: boolean | "ACTIVE" | "INACTIVE" | string;
  /** 명시적 색상 테마 (status보다 우선 적용) */
  variant?: AdminBadgeVariant;
  /** status가 true일 때 표시할 라벨 (기본값: "사용") */
  activeLabel?: string;
  /** status가 false일 때 표시할 라벨 (기본값: "미사용") */
  inactiveLabel?: string;
  /** 커스텀 텍스트 또는 자식 요소 */
  children?: React.ReactNode;
  /** 크기 옵션 (기본값: "sm") */
  size?: "xs" | "sm" | "md";
  /** 추가 클래스명 */
  className?: string;
}

const VARIANT_STYLES: Record<AdminBadgeVariant, string> = {
  success:
    "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/80",
  neutral:
    "bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700/80",
  brand:
    "bg-[#f99e1a]/10 dark:bg-[#f99e1a]/15 text-[#d97706] dark:text-[#f99e1a] border-[#f99e1a]/30 dark:border-[#f99e1a]/40",
  warning:
    "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/80",
  danger:
    "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/80",
};

const SIZE_STYLES = {
  xs: "text-[9px] px-1.5 py-0.2 rounded font-semibold",
  sm: "text-[10px] px-2 py-0.5 rounded-full font-bold",
  md: "text-xs px-2.5 py-1 rounded-full font-bold",
};

export default function AdminBadge({
  status,
  variant,
  activeLabel = "사용",
  inactiveLabel = "미사용",
  children,
  size = "sm",
  className = "",
}: AdminBadgeProps) {
  // 상태 기반 불리언 판별
  const isActive =
    status === true || status === "ACTIVE" || status === "Y" || status === "active";
  const isInactive =
    status === false || status === "INACTIVE" || status === "N" || status === "inactive";

  // 테마 결정: 명시적 variant > status 불리언 판정 > 기본 neutral
  const resolvedVariant: AdminBadgeVariant =
    variant || (isActive ? "success" : isInactive ? "neutral" : "neutral");

  // 라벨 결정: children > status 기반 라벨
  const resolvedLabel =
    children !== undefined
      ? children
      : isActive
      ? activeLabel
      : isInactive
      ? inactiveLabel
      : String(status ?? "");

  return (
    <span
      className={`inline-flex items-center justify-center border whitespace-nowrap leading-none transition-colors ${
        VARIANT_STYLES[resolvedVariant]
      } ${SIZE_STYLES[size]} ${className}`}
    >
      {resolvedLabel}
    </span>
  );
}
