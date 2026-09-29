// File: app/admin/seasons/maps/page.tsx
// Page/Component: AdminSeasonMapsPage
// Purpose: 선수 등록 화면과 같은 대회 선택 헤더·필터 그리드에서 시즌 맵 구성을 관리한다.
"use client";

import { useEffect, useMemo, useState } from "react";
import AdminCard from "@/components/admin/AdminCard";
import AdminBadge from "@/components/admin/AdminBadge";
import AdminFilterPanel from "@/components/admin/AdminFilterPanel";
import AdminMultiFilterTabs from "@/components/admin/AdminMultiFilterTabs";
import AdminModal from "@/components/admin/AdminModal";
import AdminSearchInput from "@/components/admin/AdminSearchInput";
import SeasonInlineSelect from "@/components/admin/SeasonInlineSelect";
import AdminTable, { type AdminTableColumn } from "@/components/admin/AdminTable";
import { useAdmin } from "@/lib/context/AdminContext";
import { MAP_MODE_GROUP_CODE } from "@/lib/constants/maps";
import { useCommonCodes } from "@/lib/hooks/useCommonCodes";
import type { MapItem } from "@/lib/types/maps";

type ConfiguredMap = Pick<MapItem, "id" | "nameKr" | "nameEn" | "mode" | "location" | "imageUrl"> & { sortOrder: number };
type Result<T> = { success: boolean; data?: T; message?: string };

// 선택 시즌의 활성 맵과 저장 구성을 조회하고 편집 상태를 초기화한다.
export default function AdminSeasonMapsPage() {
  const { seasons, seasonsStatus, showFeedback } = useAdmin();
  const { codes: mapModes, error: mapModesError } = useCommonCodes(MAP_MODE_GROUP_CODE);
  const [seasonId, setSeasonId] = useState("");
  const [maps, setMaps] = useState<MapItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [selectedMapIds, setSelectedMapIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [modeFilter, setModeFilter] = useState<string[]>([]);
  const [addQuery, setAddQuery] = useState("");
  const [addModeFilter, setAddModeFilter] = useState<string[]>([]);
  const [isAddOpen, setAddOpen] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const selectedSeason = seasons.find((season) => season.id === seasonId) ?? null;
  const hasSelectedSeason = Boolean(selectedSeason);
  const selectedConfiguredIds = selectedIds.filter((id) => selectedMapIds.includes(id));
  const availableMaps = useMemo(() => maps.filter((map) => !selectedIds.includes(map.id)), [maps, selectedIds]);
  // 선택된 맵 모드 중 하나에 속하는 구성 맵만 표시한다.
  const filteredConfiguredMaps = useMemo(() => selectedIds.map((id) => maps.find((map) => map.id === id)).filter((map): map is MapItem => !!map).filter((map) => `${map.nameKr} ${map.nameEn} ${map.location}`.toLowerCase().includes(query.trim().toLowerCase()) && (modeFilter.length === 0 || modeFilter.includes(map.mode))), [maps, modeFilter, query, selectedIds]);
  // 추가 창에서도 선택된 맵 모드 중 하나에 속하는 후보 맵만 표시한다.
  const filteredAvailableMaps = useMemo(() => availableMaps.filter((map) => `${map.nameKr} ${map.nameEn} ${map.location}`.toLowerCase().includes(addQuery.trim().toLowerCase()) && (addModeFilter.length === 0 || addModeFilter.includes(map.mode))), [addModeFilter, addQuery, availableMaps]);
  const modeNameByCode = useMemo(() => new Map(mapModes.map((mode) => [mode.code, mode.name])), [mapModes]);
  const modeTabs = useMemo(() => [{ code: "ALL", name: "전체" }, ...mapModes.map((mode) => ({ code: mode.code, name: mode.name }))], [mapModes]);
  const isFilterActive = Boolean(query) || modeFilter.length > 0;
  const isAddFilterActive = Boolean(addQuery) || addModeFilter.length > 0;
  const visibleAvailableIds = filteredAvailableMaps.filter((map) => map.isActive).map((map) => map.id);
  const allVisibleAvailableSelected = visibleAvailableIds.length > 0 && visibleAvailableIds.every((id) => selectedMapIds.includes(id));
  const hasChanges = selectedIds.length !== savedIds.length || selectedIds.some((id, index) => id !== savedIds[index]);

  // 대회를 바로 바꾸고 이전 대회의 검색·선택 상태를 새 대회에 넘기지 않는다.
  const selectSeason = (nextSeasonId: string) => {
    setSeasonId(nextSeasonId);
    setQuery("");
    setSelectedMapIds([]);
  };

  // 대회를 고르기 전에는 전체 맵 목록 요청을 시작하지 않는다.
  useEffect(() => {
    if (!hasSelectedSeason) return;
    let active = true;
    fetch("/api/maps").then((response) => response.json() as Promise<Result<MapItem[]>>).then((result) => {
      if (!active) return;
      if (result.success && result.data) setMaps(result.data);
      else showFeedback(result.message || "맵 목록을 불러오지 못했습니다.");
    }).catch(() => { if (active) showFeedback("맵 목록을 불러오지 못했습니다."); });
    return () => { active = false; };
  }, [hasSelectedSeason, showFeedback]);

  useEffect(() => { if (mapModesError) showFeedback(mapModesError); }, [mapModesError, showFeedback]);

  useEffect(() => {
    if (!seasonId) { setSelectedIds([]); setSavedIds([]); return; }
    let active = true;
    setLoading(true);
    setSelectedIds([]);
    setSavedIds([]);
    setSelectedMapIds([]);
    fetch(`/api/seasons/${encodeURIComponent(seasonId)}/maps`).then((response) => response.json() as Promise<Result<ConfiguredMap[]>>).then((result) => {
      if (!active) return;
      if (result.success && result.data) {
        const ids = result.data.map((map) => map.id);
        setSelectedIds(ids);
        setSavedIds(ids);
      } else showFeedback(result.message || "대회 맵 구성을 불러오지 못했습니다.");
    }).catch(() => { if (active) showFeedback("대회 맵 구성을 불러오지 못했습니다."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [seasonId, showFeedback]);

  // 전달받은 맵 구성을 서버에 저장하고 성공 시 응답을 현재·기준 상태에 반영한다.
  const save = async (mapIds: string[] = selectedIds, successMessage = "대회 맵 구성을 저장했습니다."): Promise<boolean> => {
    if (!seasonId || isSaving) return false;
    setSaving(true);
    try {
      const response = await fetch(`/api/seasons/${encodeURIComponent(seasonId)}/maps`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mapIds }) });
      const result = await response.json() as Result<ConfiguredMap[]>;
      if (!result.success || !result.data) { showFeedback(result.message || "대회 맵 구성을 저장하지 못했습니다."); return false; }
      const ids = result.data.map((map) => map.id);
      setSelectedIds(ids);
      setSavedIds(ids);
      setSelectedMapIds([]);
      showFeedback(successMessage);
      return true;
    } catch { showFeedback("대회 맵 구성을 저장하지 못했습니다."); return false; }
    finally { setSaving(false); }
  };

  // 필터에 보이는 미등록 맵을 한꺼번에 선택하거나 해제한다.
  const toggleVisibleMaps = () => setSelectedMapIds((current) => allVisibleAvailableSelected ? current.filter((id) => !visibleAvailableIds.includes(id)) : [...new Set([...current, ...filteredAvailableMaps.filter((map) => map.isActive).map((map) => map.id)])]);

  // 선택한 활성 맵을 현재 구성에 추가해 즉시 저장하고 성공했을 때만 창을 닫는다.
  const addSelectedMaps = async () => {
    const addedIds = availableMaps.filter((map) => map.isActive && selectedMapIds.includes(map.id)).map((map) => map.id);
    if (!addedIds.length || isSaving) return;
    const saved = await save([...selectedIds, ...addedIds], `${addedIds.length}개 맵을 등록했습니다.`);
    if (!saved) return;
    setAddQuery("");
    setAddModeFilter([]);
    setAddOpen(false);
  };

  // 현재 행 선택을 토글하고 제거 대상에 반영한다.
  const toggleConfiguredMap = (mapId: string) => setSelectedMapIds((current) => current.includes(mapId) ? current.filter((id) => id !== mapId) : [...current, mapId]);
  // 미사용 맵은 표시하되 대회 구성에 추가하지 못하게 한다.
  const toggleAvailableMap = (map: MapItem) => { if (map.isActive) toggleConfiguredMap(map.id); };

  const configuredColumns: AdminTableColumn<MapItem>[] = [
    { key: "select", header: <input type="checkbox" aria-label="대회 맵 전체 선택" checked={filteredConfiguredMaps.length > 0 && filteredConfiguredMaps.every((map) => selectedMapIds.includes(map.id))} onChange={() => setSelectedMapIds((current) => filteredConfiguredMaps.every((map) => current.includes(map.id)) ? current.filter((id) => !filteredConfiguredMaps.some((map) => map.id === id)) : [...new Set([...current, ...filteredConfiguredMaps.map((map) => map.id)])])} className="h-4 w-4 accent-[#f99e1a]" />, width: "w-12", align: "center", render: (map) => <input type="checkbox" aria-label={`${map.nameKr || map.nameEn} 선택`} checked={selectedMapIds.includes(map.id)} onChange={() => toggleConfiguredMap(map.id)} onClick={(event) => event.stopPropagation()} className="h-4 w-4 accent-[#f99e1a]" /> },
    { key: "nameKr", header: "맵 이름", width: "min-w-[170px]", render: (map) => <div className="flex items-center gap-2.5">{map.imageUrl ? <img src={map.imageUrl} alt="" className="h-9 w-14 rounded border border-slate-200 object-cover dark:border-slate-700" /> : <div className="h-9 w-14 rounded bg-slate-100 dark:bg-slate-800" />}<div><p className="font-bold text-slate-900 dark:text-slate-100">{map.nameKr}</p><p className="mt-0.5 text-[10px] text-slate-400">{map.nameEn}</p></div></div> },
    { key: "mode", header: "맵 모드", width: "w-28", render: (map) => <AdminBadge variant="warning">{modeNameByCode.get(map.mode) || map.mode}</AdminBadge> },
    { key: "location", header: "배경 지역", render: (map) => <span className="text-slate-500 dark:text-slate-400">{map.location || "-"}</span> },
    { key: "desc", header: "설명", width: "min-w-[180px]", render: (map) => <span className="line-clamp-2 text-slate-500 dark:text-slate-400" title={map.desc || undefined}>{map.desc || "-"}</span> },
  ];

  const availableColumns: AdminTableColumn<MapItem>[] = [
    { key: "select", header: <input type="checkbox" aria-label="검색 결과 전체 선택" checked={allVisibleAvailableSelected} disabled={!visibleAvailableIds.length} onChange={toggleVisibleMaps} className="h-4 w-4 accent-[#f99e1a] disabled:opacity-40" />, width: "w-12", align: "center", render: (map) => <input type="checkbox" checked={selectedMapIds.includes(map.id)} disabled={!map.isActive} onChange={() => toggleAvailableMap(map)} onClick={(event) => event.stopPropagation()} aria-label={`${map.nameKr || map.nameEn} 선택`} className="h-4 w-4 accent-[#f99e1a] disabled:opacity-40" /> },
    { key: "nameKr", header: "맵 이름", width: "min-w-[170px]", render: (map) => <div className="flex items-center gap-2.5">{map.imageUrl ? <img src={map.imageUrl} alt="" className="h-9 w-14 rounded border border-slate-200 object-cover dark:border-slate-700" /> : <div className="h-9 w-14 rounded bg-slate-100 dark:bg-slate-800" />}<div><p className="font-bold text-slate-900 dark:text-slate-100">{map.nameKr}</p><p className="mt-0.5 text-[10px] text-slate-400">{map.nameEn}</p></div></div> },
    { key: "mode", header: "맵 모드", width: "w-28", render: (map) => <AdminBadge variant="warning">{modeNameByCode.get(map.mode) || map.mode}</AdminBadge> },
    { key: "location", header: "배경 지역", render: (map) => <span className="text-slate-500 dark:text-slate-400">{map.location || "-"}</span> },
    { key: "desc", header: "설명", width: "min-w-[180px]", render: (map) => <span className="line-clamp-2 text-slate-500 dark:text-slate-400" title={map.desc || undefined}>{map.desc || "-"}</span> },
    { key: "isActive", header: "사용 여부", width: "w-24", render: (map) => <AdminBadge status={map.isActive} /> },
  ];

  return (
    <section className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-slate-800/10 p-4 md:p-5">
        <div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f99e1a] text-sm font-bold text-slate-950 shadow-sm">🏆</span><div><div className="flex items-center gap-2"><h2 className="text-sm font-bold text-slate-900 dark:text-white md:text-base">{selectedSeason?.name || "대회 맵 구성"}</h2>{selectedSeason && <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${selectedSeason.status === "진행중" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400" : selectedSeason.status === "개최 예정" ? "bg-amber-100 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800"}`}>{selectedSeason.status}</span>}</div><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{selectedSeason ? `총 상금: ${selectedSeason.prize}` : "대회를 선택해 맵 구성을 조회하세요."}</p></div></div>
        <div className="flex flex-wrap items-center gap-2">{seasonsStatus === "ready" && seasons.length > 0 && <SeasonInlineSelect seasons={seasons} value={seasonId} onChange={selectSeason} disabled={isLoading || isSaving} />}<button type="button" onClick={() => { setSelectedMapIds([]); setAddQuery(""); setAddOpen(true); }} disabled={!availableMaps.length || !seasonId || isLoading || isSaving} className="rounded-lg bg-[#f99e1a] px-4 py-2 text-xs font-bold text-slate-950 disabled:opacity-50">+ 맵 추가</button></div>
      </div>

      <AdminCard className="min-h-0 flex-1" bodyClassName="gap-3">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800"><span className="text-xs text-slate-500">{filteredConfiguredMaps.length} / {selectedIds.length}개 조회 · {selectedConfiguredIds.length}개 선택</span><div className="flex flex-wrap items-center gap-2"><button type="button" disabled={!isFilterActive} onClick={() => { setQuery(""); setModeFilter([]); }} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300">조건 초기화</button><button type="button" disabled={!selectedConfiguredIds.length || isSaving} onClick={() => { setSelectedIds((current) => current.filter((id) => !selectedMapIds.includes(id))); setSelectedMapIds((current) => current.filter((id) => !selectedIds.includes(id))); }} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-rose-900 dark:text-rose-400">선택 맵 제거</button><button type="button" disabled={!hasChanges || isSaving || isLoading || !seasonId} onClick={() => void save()} className="rounded-lg bg-[#f99e1a] px-4 py-2 text-xs font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">{isSaving ? "저장 중..." : `변경 사항 저장${hasChanges ? " *" : ""}`}</button></div></div>
        <AdminFilterPanel>
          <AdminSearchInput label="맵 이름 또는 지역" placeholder="맵 이름, 지역 검색..." value={query} onChange={setQuery} containerClassName="lg:col-span-3" />
          <AdminMultiFilterTabs label="맵 모드" tabs={modeTabs} selectedCodes={modeFilter} onChange={setModeFilter} containerClassName="lg:col-span-9" />
        </AdminFilterPanel>
        <div className="flex min-h-0 flex-1 flex-col"><AdminTable columns={configuredColumns} data={filteredConfiguredMaps} keyField="id" onRowClick={(map) => toggleConfiguredMap(map.id)} rowClassName={(map) => selectedMapIds.includes(map.id) ? "bg-amber-500/10 dark:bg-amber-500/15" : ""} isLoading={isLoading} containerClassName="min-h-[260px]" emptyTitle="구성된 맵이 없습니다." emptyDescription="상단의 맵 추가 버튼으로 사용할 맵을 선택하세요." /></div>
      </AdminCard>

      <AdminModal isOpen={isAddOpen} onClose={() => { if (!isSaving) { setAddOpen(false); setSelectedMapIds([]); } }} title="맵 추가" description="DB에 등록된 활성 맵을 선택해 대회 구성에 바로 저장하세요." maxWidth="4xl" bodyClassName="flex min-h-0 flex-1 flex-col overflow-y-auto p-5" footer={<div className="flex items-center justify-between gap-3"><span className="text-[11px] text-slate-500">{selectedMapIds.filter((id) => availableMaps.some((map) => map.id === id && map.isActive)).length}개 맵 선택됨</span><div className="flex gap-2"><button type="button" disabled={isSaving} onClick={() => { setAddOpen(false); setSelectedMapIds([]); }} className="rounded-lg border px-3 py-2 text-xs disabled:opacity-50 dark:border-slate-700">취소</button><button type="button" disabled={isSaving || !seasonId || !selectedMapIds.some((id) => availableMaps.some((map) => map.id === id && map.isActive))} onClick={() => void addSelectedMaps()} className="rounded-lg bg-[#f99e1a] px-4 py-2 text-xs font-bold text-slate-950 disabled:opacity-50">{isSaving ? "등록 중..." : `${selectedMapIds.filter((id) => availableMaps.some((map) => map.id === id && map.isActive)).length}개 등록`}</button></div></div>}>
        <AdminFilterPanel>
          <AdminSearchInput label="맵 이름 또는 지역" placeholder="맵 이름, 지역 검색..." value={addQuery} onChange={setAddQuery} containerClassName="lg:col-span-3" />
          <AdminMultiFilterTabs label="맵 모드" tabs={modeTabs} selectedCodes={addModeFilter} onChange={setAddModeFilter} containerClassName="lg:col-span-9" />
        </AdminFilterPanel>
        <div className="mb-2 flex items-center justify-between"><span className="text-xs text-slate-500">검색 결과 {filteredAvailableMaps.length}개 · 선택 {selectedMapIds.filter((id) => availableMaps.some((map) => map.id === id && map.isActive)).length}개</span><button type="button" disabled={!isAddFilterActive} onClick={() => { setAddQuery(""); setAddModeFilter([]); }} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300">조건 초기화</button></div>
        <div className="flex h-[380px] min-h-0 shrink-0 flex-col"><AdminTable columns={availableColumns} data={filteredAvailableMaps} keyField="id" onRowClick={toggleAvailableMap} rowClassName={(map) => `${selectedMapIds.includes(map.id) ? "bg-amber-500/10 dark:bg-amber-500/15" : ""} ${map.isActive ? "" : "cursor-not-allowed opacity-60"}`} emptyIcon="🗺️" emptyTitle="등록된 맵이 없습니다." emptyDescription="조건을 바꾸거나 공통관리의 맵 관리에서 맵을 등록하세요." /></div>
      </AdminModal>
    </section>
  );
}
