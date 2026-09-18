// components/layout/AdminHeader.tsx
/**
 * [관리자 헤더 컴포넌트]
 * - 관리자 화면 상단에 고정되는 헤더 바
 * - 현재 접속 메뉴 경로(Breadcrumb) 안내, 사용자 사이트 바로가기 및 전역 알림(토스트) 표시
 */
"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useAdmin } from "@/lib/context/AdminContext";
import { ADMIN_NAV_ITEMS } from "@/lib/constants/navigation";

export default function AdminHeader() {
  const pathname = usePathname();
  const { toastMessage } = useAdmin();

  // 브레드크럼 매핑 계산
  const getBreadcrumbs = () => {
    if (pathname === "/admin") {
      return ["ROMS 시스템 관리", "대시보드"];
    }

    // ADMIN_NAV_ITEMS 트리 기반 매핑
    for (const group of ADMIN_NAV_ITEMS) {
      if (group.children) {
        for (const sub of group.children) {
          if (sub.href === pathname) {
            return [group.label, sub.label];
          }
        }
      } else if (group.href === pathname) {
        return [group.label];
      }
    }

    // 기본 fallback 매핑
    if (pathname.startsWith("/admin/tournaments/structure")) {
      return ["대회 관리", "대회 구성 관리"];
    }
    if (pathname.startsWith("/admin/tournaments")) {
      return ["대회 관리", "대회 등록"];
    }
    return ["ROMS 시스템 관리", "관리자 화면"];
  };

  const breadcrumbs = getBreadcrumbs();

  // 현재 페이지의 제목과 설명 매핑
  const getPageInfo = () => {
    if (pathname === "/admin") {
      return {
        title: "대시보드",
        description: "ROMS 시스템 통합 현황 및 실시간 관제 지표",
      };
    }

    for (const group of ADMIN_NAV_ITEMS) {
      if (group.children) {
        for (const sub of group.children) {
          if (sub.href === pathname) {
            return {
              title: sub.label,
              description: sub.description || "",
            };
          }
        }
      } else if (group.href === pathname) {
        return {
          title: group.label,
          description: group.description || "",
        };
      }
    }

    if (pathname.startsWith("/admin/tournaments/structure")) {
      return {
        title: "대회 구성 관리",
        description: "대회별 참가 스트리머의 역할(팀장·선수·감독)을 배정하고, 조 편성(Group Stage), 세트 및 대진 규칙을 구성합니다.",
      };
    }
    if (pathname.startsWith("/admin/tournaments")) {
      return {
        title: "대회 등록",
        description: "시즌 및 정규 리그 대회 정보를 등록하고 진행 상태와 상금 규모를 관리할 수 있습니다.",
      };
    }

    return {
      title: "ROMS 시스템 관리",
      description: "ROMS 관리자 시스템 페이지",
    };
  };

  const pageInfo = getPageInfo();

  return (
    <>
      <header className="h-16 px-6 md:px-8 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#111726]/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between gap-4">
        {/* 페이지 제목 및 설명 (기존 메뉴 검색 위치) */}
        <div className="flex flex-col justify-center min-w-0 pr-4">
          <h1 className="text-sm md:text-base font-bold text-slate-900 dark:text-white tracking-tight leading-none truncate">
            {pageInfo.title}
          </h1>
          {pageInfo.description && (
            <p className="text-[11px] md:text-xs text-slate-500 dark:text-slate-400 truncate max-w-md lg:max-w-xl xl:max-w-2xl mt-1 leading-none">
              {pageInfo.description}
            </p>
          )}
        </div>

        {/* 우측 사이드 브레드크럼 */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-medium shrink-0">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-slate-300 dark:text-slate-600 font-mono text-[10px]">&gt;</span>}
              <span
                className={
                  idx === breadcrumbs.length - 1
                    ? "font-semibold text-slate-800 dark:text-slate-200"
                    : "text-slate-500 dark:text-slate-400"
                }
              >
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </div>
      </header>

      {/* 전역 토스트 피드백 알림 */}
      {toastMessage && (
        <div className="fixed top-6 right-8 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-5 py-3 rounded-xl text-xs font-bold shadow-2xl z-[60] transition-all border border-slate-700 dark:border-slate-300 flex items-center gap-2 animate-bounce">
          <span className="text-emerald-400 dark:text-emerald-600 font-black">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
}

