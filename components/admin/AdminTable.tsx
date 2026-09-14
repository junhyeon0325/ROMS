// components/admin/AdminTable.tsx
/**
 * [관리자 공통 데이터 테이블 컴포넌트]
 * - 어드민 페이지 전반에서 재사용 가능한 제네릭 기반의 데이터 그리드/테이블 UI
 * - 스티키 헤더, 행 선택 하이라이트, 커스텀 셀 렌더러, 빈 데이터 안내, 로딩 상태를 기본 지원합니다.
 */
"use client";

import React from "react";
import AdminEmptyState from "./AdminEmptyState";

export interface AdminTableColumn<T> {
  /** 컬럼 식별 고유 키 */
  key: string;
  /** 헤더 텍스트 또는 React 노드 */
  header: React.ReactNode;
  /** 열 너비 스타일 (예: 'w-28', 'w-16 min-w-[64px]') */
  width?: string;
  /** 텍스트 정렬 (기본값: 'left') */
  align?: "left" | "center" | "right";
  /** 헤더 th 전용 추가 클래스 */
  headerClassName?: string;
  /** 바디 td 전용 추가 클래스 */
  cellClassName?: string;
  /** 커스텀 셀 렌더러 함수 */
  render?: (row: T, index: number) => React.ReactNode;
  /** 기본 프로퍼티 접근자 (render 미지정 시 사용) */
  accessor?: (row: T) => React.ReactNode;
}

export interface AdminTableProps<T> {
  /** 컬럼 정의 배열 */
  columns: AdminTableColumn<T>[];
  /** 표시할 데이터 배열 */
  data: T[];
  /** 각 행의 고유 ID 키 또는 키 추출 함수 (기본값: 'id') */
  keyField?: keyof T | ((row: T) => string);
  /** 현재 선택된 행의 ID */
  selectedId?: string | null;
  /** 행 클릭 이벤트 핸들러 */
  onRowClick?: (row: T, index: number) => void;
  /** 데이터가 없을 때 표시할 타이틀 (기본값: '조회된 데이터가 없습니다.') */
  emptyTitle?: string;
  /** 데이터가 없을 때 표시할 서브 설명 */
  emptyDescription?: string;
  /** 데이터가 없을 때 표시할 아이콘 (기본값: '📁') */
  emptyIcon?: React.ReactNode;
  /** 빈 상태 전용 커스텀 렌더러 (지정 시 emptyTitle 등 대신 이 슬롯 렌더링) */
  renderEmpty?: () => React.ReactNode;
  /** 데이터 로딩 중 여부 */
  isLoading?: boolean;
  /** 최외곽 스크롤 컨테이너 추가 클래스 */
  containerClassName?: string;
  /** table 태그 추가 클래스 */
  tableClassName?: string;
  /** 각 tr 태그에 동적 클래스를 부여하는 함수 */
  rowClassName?: (row: T, isSelected: boolean, index: number) => string;
}

export default function AdminTable<T extends Record<string, any>>({
  columns,
  data,
  keyField = "id" as keyof T,
  selectedId,
  onRowClick,
  emptyTitle = "조회된 데이터가 없습니다.",
  emptyDescription,
  emptyIcon = "📁",
  renderEmpty,
  isLoading = false,
  containerClassName = "",
  tableClassName = "",
  rowClassName,
}: AdminTableProps<T>) {
  // 행 고유 키 추출
  const getRowKey = (row: T, index: number): string => {
    if (typeof keyField === "function") {
      return keyField(row);
    }
    const val = row[keyField];
    return val !== undefined && val !== null ? String(val) : String(index);
  };

  // 정렬 클래스 헬퍼
  const getAlignClass = (align?: "left" | "center" | "right") => {
    if (align === "center") return "text-center";
    if (align === "right") return "text-right";
    return "text-left";
  };

  return (
    <div
      className={`flex-1 min-h-0 overflow-y-auto overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 custom-scrollbar relative ${containerClassName}`}
    >
      <table
        className={`w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-800 ${tableClassName}`}
      >
        {/* 헤더 (Sticky 고정) */}
        <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-[#151c2e] shadow-2xs">
          <tr className="text-slate-600 dark:text-slate-300 font-semibold">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-3.5 py-2.5 bg-slate-100 dark:bg-[#151c2e] ${col.width || ""} ${getAlignClass(
                  col.align
                )} ${col.headerClassName || ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        {/* 바디 */}
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-[#111726]">
          {isLoading ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-3.5 py-16 text-center text-slate-400 dark:text-slate-500"
              >
                <div className="flex flex-col items-center justify-center gap-2.5">
                  <div className="w-6 h-6 border-2 border-[#f99e1a] border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    데이터를 불러오는 중입니다...
                  </span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            renderEmpty ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3.5 py-16 text-center text-slate-400 dark:text-slate-500"
                >
                  {renderEmpty()}
                </td>
              </tr>
            ) : (
              <AdminEmptyState
                colSpan={columns.length}
                icon={emptyIcon}
                title={emptyTitle}
                description={emptyDescription}
                className="py-12"
              />
            )
          ) : (
            data.map((row, index) => {
              const rowKey = getRowKey(row, index);
              const isSelected =
                selectedId !== undefined && selectedId !== null && selectedId === rowKey;

              const customRowClass = rowClassName
                ? rowClassName(row, isSelected, index)
                : "";

              return (
                <tr
                  key={rowKey}
                  onClick={() => onRowClick?.(row, index)}
                  className={`transition-colors ${
                    onRowClick ? "cursor-pointer" : ""
                  } ${
                    isSelected
                      ? "bg-amber-500/10 dark:bg-amber-500/15 font-medium"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  } ${customRowClass}`}
                >
                  {columns.map((col) => {
                    const cellContent = col.render
                      ? col.render(row, index)
                      : col.accessor
                      ? col.accessor(row)
                      : (row as any)[col.key];

                    return (
                      <td
                        key={col.key}
                        className={`px-3.5 py-3 ${getAlignClass(col.align)} ${
                          col.cellClassName || ""
                        }`}
                      >
                        {cellContent}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
