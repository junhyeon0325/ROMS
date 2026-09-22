// File: app/admin/codes/components/codeTableColumns.tsx
// Page/Component: 코드 관리 테이블 컬럼
// Purpose: 코드 그룹과 상세 코드 목록의 공통 표시 컬럼 정의를 제공한다.
import AdminBadge from "@/components/admin/AdminBadge";
import type { AdminTableColumn } from "@/components/admin/AdminTable";
import type { CodeGroupItem, CodeItem } from "@/lib/types/codes";

// 코드 그룹 목록 컬럼을 생성한다.
export function createGroupColumns(): AdminTableColumn<CodeGroupItem>[] {
  return [
    { key: "index", header: "순번", width: "w-14 min-w-[56px]", align: "center", render: (_row, idx) => <span className="text-slate-400 dark:text-slate-500 font-mono whitespace-nowrap">{idx + 1}</span> },
    { key: "groupCode", header: "그룹 코드", width: "w-44", render: (row) => <span className="font-mono font-bold text-[#f99e1a] dark:text-amber-400">{row.groupCode}</span> },
    { key: "groupName", header: "그룹명", width: "w-52", render: (row) => <span className="font-semibold text-slate-900 dark:text-slate-100">{row.groupName}</span> },
    { key: "sortOrder", header: "순서", width: "w-20 min-w-[70px]", align: "center", render: (row) => <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{row.sortOrder}</span> },
    { key: "isUse", header: "사용 여부", width: "w-24", render: (row) => <AdminBadge status={row.isUse} /> },
    { key: "remarks", header: "설명 / 비고", render: (row) => <span className="text-slate-500 dark:text-slate-400 truncate max-w-xs block" title={row.remarks}>{row.remarks || "-"}</span> },
  ];
}

// 상세 코드 목록 컬럼을 생성한다.
export function createCodeColumns(): AdminTableColumn<CodeItem>[] {
  return [
    { key: "index", header: "순번", width: "w-14 min-w-[56px]", align: "center", render: (_row, idx) => <span className="text-slate-400 dark:text-slate-500 font-mono whitespace-nowrap">{idx + 1}</span> },
    { key: "code", header: "코드 ID", width: "w-36", render: (row) => <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{row.code}</span> },
    { key: "name", header: "코드명", width: "w-48", render: (row) => <span className="font-semibold text-slate-900 dark:text-slate-100">{row.name}</span> },
    { key: "sortOrder", header: "순서", width: "w-20 min-w-[70px]", align: "center", render: (row) => <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{row.sortOrder}</span> },
    { key: "isUse", header: "사용 여부", width: "w-24", render: (row) => <AdminBadge status={row.isUse} /> },
    { key: "remarks", header: "코드 설명", render: (row) => <span className="text-slate-500 dark:text-slate-400 truncate max-w-xs block" title={row.remarks}>{row.remarks || "-"}</span> },
  ];
}
