// File: app/admin/maps/components/MapListSection.tsx
// Page/Component: MapListSection
// Purpose: 맵 관리 페이지에서 등록 맵 검색·필터·선택 UI를 제공한다.

import { useMemo, useState } from "react";
import { CodeItem, MapItem } from "@/lib/types/admin";
import AdminBadge from "@/components/admin/AdminBadge";
import AdminCard from "@/components/admin/AdminCard";
import AdminFilterPanel from "@/components/admin/AdminFilterPanel";
import AdminFilterTabs from "@/components/admin/AdminFilterTabs";
import AdminSearchInput from "@/components/admin/AdminSearchInput";
import AdminTable, { AdminTableColumn } from "@/components/admin/AdminTable";

interface MapListSectionProps {
  maps: MapItem[];
  mapModes: CodeItem[];
  modeNameByCode: Map<string, string>;
  selectedMapId: string | null;
  isLoading: boolean;
  onSelectMap: (map: MapItem) => void;
}

// 등록 맵 목록을 표시하고 목록 전용 필터 상태를 해당 영역 안에서 관리한다.
export default function MapListSection({
  maps,
  mapModes,
  modeNameByCode,
  selectedMapId,
  isLoading,
  onSelectMap,
}: MapListSectionProps) {
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState("ALL");
  const [poolFilter, setPoolFilter] = useState("ALL");

  const modeTabs = useMemo(
    () => [
      { code: "ALL", name: "전체" },
      ...mapModes.map((mode) => ({ code: mode.code, name: mode.name })),
    ],
    [mapModes],
  );

  const filteredMaps = useMemo(() => {
    const query = search.trim().toLowerCase();
    return maps.filter((map) => {
      const matchesText =
        !query ||
        [map.nameKr, map.nameEn, map.location].some((value) =>
          value.toLowerCase().includes(query),
        );
      const matchesMode = modeFilter === "ALL" || map.mode === modeFilter;
      const matchesPool =
        poolFilter === "ALL" ||
        (poolFilter === "ACTIVE" ? map.isActive : !map.isActive);
      return matchesText && matchesMode && matchesPool;
    });
  }, [maps, modeFilter, poolFilter, search]);

  const mapColumns: AdminTableColumn<MapItem>[] = useMemo(
    () => [
      {
        key: "nameKr",
        header: "맵 이름",
        width: "min-w-[170px]",
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
                {map.nameKr}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-400">{map.nameEn}</p>
            </div>
          </div>
        ),
      },
      {
        key: "mode",
        header: "맵 모드",
        width: "w-28",
        cellClassName: "text-left",
        render: (map) => (
          <AdminBadge variant="warning">
            {modeNameByCode.get(map.mode) || map.mode}
          </AdminBadge>
        ),
      },
      {
        key: "location",
        header: "배경 지역",
        render: (map) => (
          <span className="text-slate-500 dark:text-slate-400">
            {map.location || "-"}
          </span>
        ),
      },
      {
        key: "isActive",
        header: "사용 여부",
        width: "w-24",
        cellClassName: "text-left",
        render: (map) => <AdminBadge status={map.isActive} />,
      },
    ],
    [modeNameByCode],
  );

  // 모든 목록 필터를 초기화해 전체 맵 목록으로 돌아간다.
  const handleResetFilters = () => {
    setSearch("");
    setModeFilter("ALL");
    setPoolFilter("ALL");
  };

  const isFilterActive = Boolean(search) || modeFilter !== "ALL" || poolFilter !== "ALL";

  return (
    <div className="xl:col-span-7 h-full min-h-0 flex flex-col">
      <AdminCard
        title="등록된 맵 조회"
        countBadge={`총 ${filteredMaps.length}건`}
        className="h-full"
        actions={
          <button
            type="button"
            disabled={!isFilterActive}
            onClick={handleResetFilters}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
            title="검색 조건 초기화"
          >
            <svg
              className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>조건 초기화</span>
          </button>
        }
      >
        <AdminFilterPanel>
            <AdminSearchInput
              label="맵 이름 또는 지역"
              placeholder="맵 이름, 지역 검색..."
              value={search}
              onChange={setSearch}
              containerClassName="lg:col-span-3"
            />
            <AdminFilterTabs
              label="사용 여부"
              tabs={[
                { code: "ALL", name: "전체" },
                { code: "ACTIVE", name: "사용" },
                { code: "INACTIVE", name: "미사용" },
              ]}
              activeTab={poolFilter}
              onChange={setPoolFilter}
              containerClassName="lg:col-span-3"
            />
            <AdminFilterTabs
              label="맵 모드"
              tabs={modeTabs}
              activeTab={modeFilter}
              onChange={setModeFilter}
              containerClassName="lg:col-span-6"
            />
        </AdminFilterPanel>
        <AdminTable
          columns={mapColumns}
          data={filteredMaps}
          keyField="id"
          selectedId={selectedMapId}
          onRowClick={onSelectMap}
          isLoading={isLoading}
          emptyIcon="🗺️"
          emptyTitle="등록된 맵이 없습니다."
          emptyDescription="오른쪽에서 OverFast 목록을 불러오거나 새로 등록해 주세요."
        />
      </AdminCard>
    </div>
  );
}
