// components/admin/AdminKpiCard.tsx
import React from "react";
import Link from "next/link";

export type KpiColor = "blue" | "purple" | "emerald" | "amber" | "cyan" | "rose";

interface AdminKpiCardProps {
  label: string;
  value: React.ReactNode;
  unit?: string;
  meta: string;
  color: KpiColor;
  icon: React.ReactNode;
  actionText?: string;
  href?: string;
  onClick?: () => void;
  title?: string;
}

const COLOR_MAP: Record<
  KpiColor,
  {
    border: string;
    iconBg: string;
    iconText: string;
    actionText: string;
    valueText?: string;
  }
> = {
  blue: {
    border: "border-l-blue-500",
    iconBg: "bg-blue-50 dark:bg-blue-950/50",
    iconText: "text-blue-600 dark:text-blue-400",
    actionText: "text-blue-600 dark:text-blue-400",
  },
  purple: {
    border: "border-l-purple-500",
    iconBg: "bg-purple-50 dark:bg-purple-950/50",
    iconText: "text-purple-600 dark:text-purple-400",
    actionText: "text-purple-600 dark:text-purple-400",
  },
  emerald: {
    border: "border-l-emerald-500",
    iconBg: "bg-emerald-50 dark:bg-emerald-950/50",
    iconText: "text-emerald-600 dark:text-emerald-400",
    actionText: "text-emerald-600 dark:text-emerald-400",
  },
  amber: {
    border: "border-l-amber-500",
    iconBg: "bg-amber-50 dark:bg-amber-950/50",
    iconText: "text-amber-600 dark:text-amber-400",
    actionText: "text-amber-600 dark:text-amber-400",
  },
  cyan: {
    border: "border-l-cyan-500",
    iconBg: "bg-cyan-50 dark:bg-cyan-950/50",
    iconText: "text-cyan-600 dark:text-cyan-400",
    actionText: "text-cyan-600 dark:text-cyan-400",
  },
  rose: {
    border: "border-l-rose-500",
    iconBg: "bg-rose-50 dark:bg-rose-950/50",
    iconText: "text-rose-600 dark:text-rose-400",
    actionText: "text-rose-600 dark:text-rose-400",
    valueText: "text-rose-600 dark:text-rose-400",
  },
};

const BASE_CARD_CLASSES =
  "group relative overflow-hidden bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border-l-4 flex flex-col justify-between";

export default function AdminKpiCard({
  label,
  value,
  unit,
  meta,
  color,
  icon,
  actionText = "→",
  href,
  onClick,
  title,
}: AdminKpiCardProps) {
  const theme = COLOR_MAP[color];
  const cardClassName = `${BASE_CARD_CLASSES} ${theme.border} ${
    onClick ? "cursor-pointer" : ""
  }`;

  const content = (
    <>
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
            {label}
          </span>
          <div
            className={`w-7 h-7 rounded-lg ${theme.iconBg} ${theme.iconText} flex items-center justify-center shrink-0`}
          >
            {icon}
          </div>
        </div>
        <div
          className={`text-2xl font-black tracking-tight mb-2.5 ${
            theme.valueText || "text-slate-900 dark:text-white"
          }`}
        >
          {value}
          {unit && <span className="text-sm font-semibold ml-0.5">{unit}</span>}
        </div>
      </div>
      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <span className="truncate">{meta}</span>
        <span
          className={`${theme.actionText} font-semibold group-hover:translate-x-0.5 transition-transform ml-1`}
        >
          {actionText}
        </span>
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cardClassName} title={title}>
        {content}
      </Link>
    );
  }

  return (
    <div onClick={onClick} className={cardClassName} title={title} role="button">
      {content}
    </div>
  );
}
