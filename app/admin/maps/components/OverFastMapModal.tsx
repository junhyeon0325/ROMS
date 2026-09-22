// File: app/admin/maps/components/OverFastMapModal.tsx
// Page/Component: OverFastMapModal
// Purpose: OverFast 외부 맵 검색·선택·일괄 등록 UI를 제공한다.

import { useEffect, useMemo, useState } from "react";
import { getOverFastModeCodes } from "@/lib/constants/maps";
import AdminBadge from "@/components/admin/AdminBadge";
import AdminModal from "@/components/admin/AdminModal";
import AdminSearchInput from "@/components/admin/AdminSearchInput";
import AdminTable, { AdminTableColumn } from "@/components/admin/AdminTable";
import type { ExternalMap } from "@/lib/types/maps";

interface OverFastMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSaving: boolean;
  externalMaps: ExternalMap[];
  isExternalLoading: boolean;
  selectedExternalKeys: string[];
  registeredBySourceKey: Map<string, unknown>;
  modeNameByCode: Map<string, string>;
  onSelectMap: (map: ExternalMap) => void;
  onSave: () => void;
}

// 검색 상태를 페이지와 분리한 OverFast 맵 선택 UI를 표시한다.
export default function OverFastMapModal({
  isOpen,
  onClose,
  isSaving,
  externalMaps,
  isExternalLoading,
  selectedExternalKeys,
  registeredBySourceKey,
  modeNameByCode,
  onSelectMap,
  onSave,
}: OverFastMapModalProps) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (isOpen) setSearch("");
  }, [isOpen]);

  const filteredMaps = useMemo(() => {
    const query = search.trim().toLowerCase();
    return externalMaps.filter(
      (map) =>
        !query ||
        [map.nameEn, map.location, map.countryCode].some((value) =>
          value.toLowerCase().includes(query),
        ),
    );
  }, [externalMaps, search]);

  const selectedMaps = useMemo(
    () =>
      externalMaps.filter((map) => selectedExternalKeys.includes(map.sourceKey)),
    [externalMaps, selectedExternalKeys],
  );

  const externalColumns: AdminTableColumn<ExternalMap>[] = useMemo(
    () => [
      {
        key: "select",
        header: "선택",
        width: "w-16",
        cellClassName: "text-center",
        render: (map) => {
          const isRegistered = registeredBySourceKey.has(map.sourceKey);
          const hasSupportedMode = getOverFastModeCodes(map.gamemodes).some((code) =>
            modeNameByCode.has(code),
          );
          return (
            <input
              type="checkbox"
              checked={selectedExternalKeys.includes(map.sourceKey)}
              disabled={isRegistered || !hasSupportedMode}
              onClick={(event) => event.stopPropagation()}
              onChange={() => onSelectMap(map)}
              className="h-3.5 w-3.5 rounded border-slate-300 text-[#f99e1a] accent-[#f99e1a] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={`${map.nameEn} 선택`}
            />
          );
        },
      },
      {
        key: "nameEn",
        header: "맵",
        width: "min-w-[200px]",
        render: (map) => (
          <div className="flex items-center gap-2.5">
            {map.imageUrl ? (
              <img
                src={map.imageUrl}
                alt=""
                className="h-9 w-14 rounded object-cover border border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div className="h-9 w-14 rounded bg-slate-100 dark:bg-slate-800" />
            )}
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">
                {map.nameEn}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-400">
                {map.location || "위치 정보 없음"}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: "gamemodes",
        header: "모드",
        width: "w-32",
        render: (map) => (
          <span className="text-[11px] text-slate-500">
            {getOverFastModeCodes(map.gamemodes)
              .map((code) => modeNameByCode.get(code) || code)
              .join(", ") || "-"}
          </span>
        ),
      },
      {
        key: "sourceKey",
        header: "상태",
        width: "w-24",
        cellClassName: "text-left",
        render: (map) => {
          const isRegistered = registeredBySourceKey.has(map.sourceKey);
          const hasSupportedMode = getOverFastModeCodes(map.gamemodes).some((code) =>
            modeNameByCode.has(code),
          );
          return (
            <AdminBadge
              variant={
                isRegistered
                  ? "success"
                  : hasSupportedMode
                    ? "neutral"
                    : "warning"
              }
            >
              {isRegistered
                ? "등록됨"
                : hasSupportedMode
                  ? "미등록"
                  : "모드 미등록"}
            </AdminBadge>
          );
        },
      },
    ],
    [modeNameByCode, onSelectMap, registeredBySourceKey, selectedExternalKeys],
  );

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={() => !isSaving && onClose()}
      title="OverFast 맵 목록 불러오기"
      description="등록할 맵을 여러 개 선택한 뒤 저장하면 즉시 DB에 등록됩니다."
      maxWidth="4xl"
      bodyClassName="p-5 overflow-y-auto flex-1 min-h-0 space-y-4"
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-400">
            {selectedMaps.length
              ? `${selectedMaps.length}건 선택됨`
              : "등록할 맵을 선택해 주세요."}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              취소
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={!selectedMaps.length || isSaving}
              className="rounded-lg bg-[#f99e1a] px-3.5 py-1.5 text-xs font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "저장 중..." : `DB 저장 (${selectedMaps.length}건)`}
            </button>
          </div>
        </div>
      }
    >
      <AdminSearchInput
        label="외부 맵 검색"
        placeholder="영문 맵 이름 또는 지역 검색..."
        value={search}
        onChange={setSearch}
      />
      <div className="h-[420px] shrink-0">
        <AdminTable
          columns={externalColumns}
          data={filteredMaps}
          keyField="sourceKey"
          selectedId={null}
          onRowClick={onSelectMap}
          isLoading={isExternalLoading}
          emptyIcon="🗺️"
          emptyTitle="외부 맵 목록을 불러오는 중입니다."
          emptyDescription="OverFast API 응답을 기다리고 있습니다."
        />
      </div>
    </AdminModal>
  );
}
