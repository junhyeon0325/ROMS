// File: app/admin/player-map-hero-statistics/PlayerMapHeroStatistics.tsx
// Page/Component: PlayerMapHeroStatistics
// Purpose: 저장된 선수·맵·영웅 조합을 필터·검색·정렬·페이지로 조회한다.
"use client";

import { useEffect, useState } from "react";
import AdminCard from "@/components/admin/AdminCard";
import AdminTable, { type AdminTableColumn } from "@/components/admin/AdminTable";
import { useAdmin } from "@/lib/context/AdminContext";

type Option = { id: string; name: string };
type Options = { players: Option[]; maps: Option[]; heroes: Option[] };
type Row = { playerId: string; playerName: string; mapId: string; mapName: string; heroId: string; heroName: string; uses: number; matches: number; sets: number; wins: number; losses: number };
type Result = { total: number; page: number; pageSize: number; rows: Row[] };
type Filters = { playerId: string; mapId: string; heroId: string; search: string; sort: string };
const initialFilters: Filters = { playerId: "", mapId: "", heroId: "", search: "", sort: "uses" };
const emptyOptions: Options = { players: [], maps: [], heroes: [] };
const fieldClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
const columns: AdminTableColumn<Row>[] = [
  { key: "player", header: "선수", render: (row) => <strong>{row.playerName}</strong> },
  { key: "map", header: "맵", render: (row) => row.mapName },
  { key: "hero", header: "영웅", render: (row) => row.heroName },
  { key: "uses", header: "사용 횟수", align: "right", render: (row) => row.uses.toLocaleString() },
  { key: "matches", header: "경기 수", align: "right", render: (row) => row.matches.toLocaleString() },
  { key: "sets", header: "세트 수", align: "right", render: (row) => row.sets.toLocaleString() },
  { key: "wins", header: "승", align: "right", render: (row) => row.wins.toLocaleString() },
  { key: "losses", header: "패", align: "right", render: (row) => row.losses.toLocaleString() },
  { key: "rate", header: "승률", align: "right", render: (row) => row.wins + row.losses ? `${(row.wins / (row.wins + row.losses) * 100).toFixed(1)}%` : "—" },
];

// API 응답을 검사해 실패 이유를 조회 화면에 전달한다.
async function readApi<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  const body = await response.json() as { success: boolean; data?: T; message?: string };
  if (!response.ok || !body.success || body.data === undefined) throw new Error(body.message || "조회에 실패했습니다.");
  return body.data;
}

// 선택한 대회와 조건에 따라 서버 페이지 한 건씩 요청하고 이전 요청을 취소한다.
export default function PlayerMapHeroStatistics() {
  const { seasons, seasonsStatus, reloadSeasons } = useAdmin();
  const [seasonId, setSeasonId] = useState("");
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [searchDraft, setSearchDraft] = useState("");
  const [page, setPage] = useState(1);
  const [options, setOptions] = useState<Options>(emptyOptions);
  const [data, setData] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterError, setFilterError] = useState("");
  const [retry, setRetry] = useState(0);

  // 대회 목록이 로드되면 URL의 대회를 선택하거나 러너리그 시즌4를 우선 선택한다.
  useEffect(() => {
    if (seasonsStatus !== "ready" || seasonId || !seasons.length) return;
    const requested = new URLSearchParams(window.location.search).get("seasonId");
    setSeasonId(seasons.find((season) => season.id === requested)?.id ??
      seasons.find((season) => /러너리그.*(?:시즌|season)\s*4/i.test(season.name))?.id ?? seasons[0].id);
  }, [seasons, seasonsStatus, seasonId]);

  // 선택 대회에서 기록에 등장한 항목만 필터에 채운다.
  useEffect(() => {
    if (!seasonId) return;
    const controller = new AbortController();
    setOptions(emptyOptions);
    setFilterError("");
    readApi<Options>(`/api/player-map-hero-statistics?view=filters&seasonId=${seasonId}`, controller.signal)
      .then(setOptions).catch((cause) => { if (!controller.signal.aborted) setFilterError(cause.message); });
    return () => controller.abort();
  }, [seasonId, retry]);

  // 조건 변경 시 서버에서 정렬된 현재 페이지의 행만 받는다.
  useEffect(() => {
    if (!seasonId) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ seasonId, page: String(page), ...filters });
    setLoading(true); setError(""); setData(null);
    readApi<Result>(`/api/player-map-hero-statistics?${params}`, controller.signal)
      .then(setData).catch((cause) => { if (!controller.signal.aborted) setError(cause.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [seasonId, page, filters, retry]);

  // 필터가 바뀌면 결과를 첫 페이지부터 조회한다.
  const changeFilter = (key: keyof Filters, value: string) => {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  };

  return <div className="flex min-h-0 flex-1 flex-col gap-4 pb-6">
    <div><h1 className="text-xl font-bold text-slate-900 dark:text-white">선수별 맵·영웅 통계</h1>
      <p className="mt-1 text-xs text-slate-500">저장된 경기 기록에서 선수·맵·영웅 조합별 사용을 조회합니다.</p></div>
    <AdminCard title="사용 통계" countBadge={data ? `${data.total}개 조합` : undefined} className="flex-1">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <label className="text-xs">대회·시즌<select className={`${fieldClass} mt-1`} value={seasonId} onChange={(event) => { setSeasonId(event.target.value); setFilters(initialFilters); setSearchDraft(""); setPage(1); }}><option value="">대회 선택</option>{seasons.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="text-xs">선수<select className={`${fieldClass} mt-1`} value={filters.playerId} onChange={(event) => changeFilter("playerId", event.target.value)}><option value="">전체 선수</option>{options.players.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="text-xs">맵<select className={`${fieldClass} mt-1`} value={filters.mapId} onChange={(event) => changeFilter("mapId", event.target.value)}><option value="">전체 맵</option>{options.maps.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="text-xs">영웅<select className={`${fieldClass} mt-1`} value={filters.heroId} onChange={(event) => changeFilter("heroId", event.target.value)}><option value="">전체 영웅</option>{options.heroes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="text-xs">정렬<select className={`${fieldClass} mt-1`} value={filters.sort} onChange={(event) => changeFilter("sort", event.target.value)}><option value="uses">사용 횟수 많은순</option><option value="matches">경기 수 많은순</option><option value="wins">승 많은순</option><option value="rate">승률 높은순</option><option value="player">선수명순</option><option value="map">맵명순</option><option value="hero">영웅명순</option></select></label>
        <form className="text-xs" onSubmit={(event) => { event.preventDefault(); changeFilter("search", searchDraft.trim()); }}><label htmlFor="usage-search">선수·맵·영웅 이름 검색</label><div className="mt-1 flex gap-2"><input id="usage-search" className={`${fieldClass} min-w-0 flex-1`} value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="이름 입력" /><button type="submit" className="rounded-lg bg-amber-500 px-4 font-bold text-slate-950">검색</button></div></form>
      </div>
      <p className="my-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">한 행은 선수·맵·영웅 조합입니다. 사용 횟수는 해당 영웅이 기록된 선수·세트당 1회이며, 경기 수와 세트 수는 각각 중복 없는 경기·세트 수입니다. 승률 = 승 / (승 + 패). 승패는 선수의 현재 시즌 팀과 경기 참가 팀이 일치하고 세트 승리 팀이 확정된 사용만 계산합니다. 결과 미정 또는 팀 확인 불가 기록은 분모에서 제외합니다.</p>
      {seasonsStatus === "error" && <button type="button" className="mb-3 text-xs text-red-600 underline" onClick={reloadSeasons}>대회 목록 조회 실패 · 다시 시도</button>}
      {filterError && <p role="alert" className="mb-3 text-xs text-red-600">필터를 불러오지 못했습니다: {filterError} <button type="button" className="underline" onClick={() => setRetry((value) => value + 1)}>다시 시도</button></p>}
      {error && <p role="alert" className="mb-3 text-xs text-red-600">{error} <button type="button" className="underline" onClick={() => setRetry((value) => value + 1)}>다시 시도</button></p>}
      <AdminTable columns={columns} data={data?.rows ?? []} keyField={(row) => `${row.playerId}-${row.mapId}-${row.heroId}`} isLoading={loading || seasonsStatus === "loading"} emptyTitle={seasonId ? "조회된 사용 기록이 없습니다." : "대회를 선택해주세요."} containerClassName="max-h-[50vh]" />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300"><span>{data ? `${data.total}개 조합 중 ${data.total ? (page - 1) * data.pageSize + 1 : 0}-${Math.min(page * data.pageSize, data.total)}개` : ""}</span><div className="flex items-center gap-3"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>이전</button><span>{page} / {Math.max(1, Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 20)))}</span><button type="button" disabled={!data || loading || page * data.pageSize >= data.total} onClick={() => setPage((value) => value + 1)}>다음</button></div></div>
    </AdminCard>
  </div>;
}
