// components/admin/AdminCard.tsx
import React from "react";

interface AdminCardProps {
  title?: React.ReactNode;
  countBadge?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export default function AdminCard({
  title,
  countBadge,
  actions,
  children,
  className = "",
}: AdminCardProps) {
  return (
    <div
      className={`bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm ${className}`}
    >
      {(title || countBadge || actions) && (
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {title && (
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                {title}
              </div>
            )}
            {countBadge && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {countBadge}
              </span>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
