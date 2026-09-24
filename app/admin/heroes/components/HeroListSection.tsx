// File: app/admin/heroes/components/HeroListSection.tsx
// Page/Component: HeroListSection
// Purpose: 영웅 목록의 검색·필터와 선택 가능한 테이블 UI를 제공한다.
"use client";

import { useMemo } from "react";
import AdminBadge from "@/components/admin/AdminBadge";
import AdminCard from "@/components/admin/AdminCard";
import AdminFilterPanel from "@/components/admin/AdminFilterPanel";
import AdminFilterTabs from "@/components/admin/AdminFilterTabs";
import AdminSearchInput from "@/components/admin/AdminSearchInput";
import AdminTable, {
  type AdminTableColumn,
} from "@/components/admin/AdminTable";
import type { CodeItem } from "@/lib/types/codes";
import type { HeroItem, HeroRole } from "@/lib/types/heroes";

interface HeroListSectionProps {
  heroes: HeroItem[];
  heroRoles: CodeItem[];
  heroRoleNameByCode: Map<string, string>;
  isFilterActive: boolean;
  isLoading: boolean;
  roleFilter: "ALL" | HeroRole;
  search: string;
  selectedHeroId: string | null;
  usageFilter: string;
  onResetFilters: () => void;
  onSelectHero: (hero: HeroItem) => void;
  setRoleFilter: (value: "ALL" | HeroRole) => void;
  setSearch: (value: string) => void;
  setUsageFilter: (value: string) => void;
}

// 영웅 목록의 조회 조건과 선택 상태를 화면에 표시한다.
export default function HeroListSection({
  heroes,
  heroRoles,
  heroRoleNameByCode,
  isFilterActive,
  isLoading,
  roleFilter,
  search,
  selectedHeroId,
  usageFilter,
  onResetFilters,
  onSelectHero,
  setRoleFilter,
  setSearch,
  setUsageFilter,
}: HeroListSectionProps) {
  const columns = useMemo<AdminTableColumn<HeroItem>[]>(
    () => [
      {
        key: "nameKr",
        header: "영웅 이름",
        width: "min-w-[190px]",
        render: (hero) => (
          <div className="flex items-center gap-2.5">
            {hero.imageUrl ? (
              <img
                src={hero.imageUrl}
                alt=""
                className="h-10 w-10 rounded-full border border-slate-200 object-cover dark:border-slate-700"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800" />
            )}
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">
                {hero.nameKr}
              </p>
              <p className="mt-0.5 text-[10px] font-mono text-slate-400">
                {hero.nameEn}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: "role",
        header: "역할군",
        width: "w-24",
        render: (hero) => (
          <AdminBadge variant="neutral">
            {heroRoleNameByCode.get(hero.role) || hero.role}
          </AdminBadge>
        ),
      },
      {
        key: "desc",
        header: "설명",
        width: "min-w-[180px]",
        render: (hero) => <span className="line-clamp-2 text-slate-500 dark:text-slate-400" title={hero.desc || undefined}>{hero.desc || "-"}</span>,
      },
      {
        key: "isPickable",
        header: "사용 여부",
        width: "w-24",
        align: "center",
        render: (hero) => (
          <AdminBadge variant={hero.isPickable ? "success" : "neutral"}>
            {hero.isPickable ? "사용" : "미사용"}
          </AdminBadge>
        ),
      },
    ],
    [heroRoleNameByCode],
  );

  return (
    <div className="xl:col-span-7 h-full min-h-0 flex flex-col">
      <AdminCard
        title="등록된 영웅 목록"
        countBadge={`총 ${heroes.length}명`}
        className="h-full"
        actions={
          <button
            type="button"
            disabled={!isFilterActive}
            onClick={onResetFilters}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
            title="검색 조건 초기화"
          >
            조건 초기화
          </button>
        }
      >
        <AdminFilterPanel>
          <AdminSearchInput
            label="영웅 이름 검색"
            value={search}
            onChange={setSearch}
            placeholder="예: D.Va, 트레이서, Ana"
            containerClassName="lg:col-span-3"
          />
          <AdminFilterTabs
            label="사용 여부"
            tabs={[
              { code: "ALL", name: "전체" },
              { code: "USE", name: "사용" },
              { code: "UNUSED", name: "미사용" },
            ]}
            activeTab={usageFilter}
            onChange={setUsageFilter}
            containerClassName="lg:col-span-3"
          />
          <AdminFilterTabs
            label="역할군"
            tabs={[{ code: "ALL", name: "전체" }, ...heroRoles]}
            activeTab={roleFilter}
            onChange={(value) => setRoleFilter(value as "ALL" | HeroRole)}
            containerClassName="lg:col-span-6"
          />
        </AdminFilterPanel>
        <AdminTable
          columns={columns}
          data={heroes}
          selectedId={selectedHeroId}
          onRowClick={onSelectHero}
          isLoading={isLoading}
          emptyTitle="등록된 영웅이 없습니다."
          emptyDescription="우측의 신규 등록 버튼으로 영웅을 추가해주세요."
        />
      </AdminCard>
    </div>
  );
}
