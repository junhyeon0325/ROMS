// File: app/admin/match-statistics/MatchStatistics.tsx
// Page/Component: MatchStatistics
// Purpose: 시즌별 선수·맵·영웅 집계를 필터·정렬·페이지로 조회하고 관련 경기를 연다.
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminCard from "@/components/admin/AdminCard";
import AdminTable, { type AdminTableColumn } from "@/components/admin/AdminTable";
import { useAdmin } from "@/lib/context/AdminContext";

type Tab = "players" | "maps" | "heroes";
type Option = { id: string; name: string };
type Options = { teams: Option[]; maps: Option[]; players: Option[]; heroes: Option[] };
type Row = { id: string; name: string; subtitle: string; matches: number; sets: number; decided: number; wins: number; losses: number; uses: number };
type MatchRow = { id: string; matchDate: string | null; tournamentStage: string; teamA: string; teamB: string };
type Page<T> = { total: number; page: number; pageSize: number; rows: T[] };
type Filters = { teamId: string; mapId: string; playerId: string; heroId: string; search: string; sort: string };
const initialFilters: Filters = { teamId: "", mapId: "", playerId: "", heroId: "", search: "", sort: "sets" };
const emptyOptions: Options = { teams: [], maps: [], players: [], heroes: [] };
const fieldClass = "rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
const tabs: { id: Tab; label: string }[] = [{ id: "players", label: "선수별" }, { id: "maps", label: "맵별" }, { id: "heroes", label: "영웅별" }];

// API 오류를 화면 상태로 처리할 수 있도록 성공 응답의 data만 반환한다.
async function readApi<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  const result = await response.json() as { success: boolean; data?: T; message?: string };
  if (!response.ok || !result.success || result.data === undefined) throw new Error(result.message || "조회에 실패했습니다.");
  return result.data;
}

// 완료된 승패만 분모로 사용하고 미정 결과에는 대시를 표시한다.
function rate(row: Row) {
  const decided = row.wins + row.losses;
  return decided ? `${(row.wins / decided * 100).toFixed(1)}%` : "—";
}

// 시즌·탭·필터마다 서버에서 한 페이지를 읽고 선택 행의 경기 목록을 별도로 표시한다.
export default function MatchStatistics() {
  const { seasons, seasonsStatus, reloadSeasons } = useAdmin();
  const [seasonId, setSeasonId] = useState("");
  const [tab, setTab] = useState<Tab>("players");
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [searchDraft, setSearchDraft] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Page<Row> | null>(null);
  const [options, setOptions] = useState<Options>(emptyOptions);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const [detail, setDetail] = useState<Row | null>(null);
  const [detailPage, setDetailPage] = useState(1);
  const [matches, setMatches] = useState<Page<MatchRow> | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  // 대회 목록이 준비되면 러너리그 시즌4를 우선 선택한다.
  useEffect(() => {
    if (seasonsStatus !== "ready" || seasonId || seasons.length === 0) return;
    const requestedId = new URLSearchParams(window.location.search).get("seasonId");
    setSeasonId(seasons.find((season) => season.id === requestedId)?.id ??
      seasons.find((season) => /러너리그.*시즌\s*4|러너리그.*season\s*4/i.test(season.name))?.id ?? seasons[0].id);
  }, [seasons, seasonsStatus, seasonId]);

  // 선택 시즌이 바뀔 때 해당 시즌의 필터 사전만 다시 읽는다.
  useEffect(() => {
    if (!seasonId) return;
    const controller = new AbortController();
    setOptions(emptyOptions);
    readApi<Options>(`/api/match-statistics?view=filters&seasonId=${seasonId}`, controller.signal)
      .then(setOptions).catch((cause) => { if (!controller.signal.aborted) setError(cause.message); });
    return () => controller.abort();
  }, [seasonId, reloadToken]);

  // 필터·정렬·페이지 변경 시 현재 통계 행만 요청하고 이전 요청은 취소한다.
  useEffect(() => {
    if (!seasonId) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ seasonId, tab, page: String(page), ...filters });
    setLoading(true); setError(""); setData(null);
    readApi<Page<Row>>(`/api/match-statistics?${params}`, controller.signal)
      .then(setData).catch((cause) => { if (!controller.signal.aborted) setError(cause.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [seasonId, tab, page, filters, reloadToken]);

  // 선택 행에 기여한 경기만 별도 페이지로 읽어 전체 기록 링크를 제공한다.
  useEffect(() => {
    if (!seasonId || !detail) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ seasonId, tab, view: "matches", detailId: detail.id, page: String(detailPage), ...filters });
    setDetailLoading(true); setDetailError(""); setMatches(null);
    readApi<Page<MatchRow>>(`/api/match-statistics?${params}`, controller.signal)
      .then(setMatches).catch((cause) => { if (!controller.signal.aborted) setDetailError(cause.message); })
      .finally(() => { if (!controller.signal.aborted) setDetailLoading(false); });
    return () => controller.abort();
  }, [seasonId, tab, filters, detail, detailPage, reloadToken]);

  // 필터를 바꾸면 집계와 상세 페이지를 첫 페이지로 되돌린다.
  const changeFilter = (key: keyof Filters, value: string) => {
    setPage(1); setDetail(null); setFilters((current) => ({
      ...current, [key]: value,
      ...(key === "teamId" && !value && tab === "maps" && ["wins", "rate"].includes(current.sort) ? { sort: "sets" } : {}),
    }));
  };
  const columns = useMemo<AdminTableColumn<Row>[]>(() => [
    { key: "name", header: tab === "players" ? "선수" : tab === "maps" ? "맵" : "영웅", render: (row) => <><strong>{row.name}</strong><span className="ml-2 text-slate-500">{row.subtitle}</span></> },
    { key: "matches", header: "경기 수", align: "right", render: (row) => row.matches.toLocaleString() },
    { key: "sets", header: "세트 수", align: "right", render: (row) => row.sets.toLocaleString() },
    ...(tab === "heroes" ? [{ key: "uses", header: "사용 횟수", align: "right" as const, render: (row: Row) => row.uses.toLocaleString() }] : []),
    { key: "decided", header: tab === "heroes" ? "결과 확정 사용" : "결과 확정 세트", align: "right", render: (row) => row.decided.toLocaleString() },
    ...((tab !== "maps" || filters.teamId) ? [
      { key: "wins", header: "승", align: "right" as const, render: (row: Row) => row.wins.toLocaleString() },
      { key: "losses", header: "패", align: "right" as const, render: (row: Row) => row.losses.toLocaleString() },
      { key: "rate", header: "승률", align: "right" as const, render: (row: Row) => rate(row) },
    ] : []),
    { key: "detail", header: "경기 기록", render: (row) => <button type="button" className="font-bold text-amber-700 underline dark:text-amber-400" onClick={() => { setDetail(row); setDetailPage(1); }}>보기</button> },
  ], [tab, filters.teamId]);
  const explanation = tab === "players"
    ? "선수 기록이 저장된 세트만 참여로 셉니다. 승·패는 현재 시즌 팀 편성과 일치하고 세트 승리 팀이 확정된 기록만 셉니다. 승률 = 승 / (승 + 패)."
    : tab === "maps"
      ? "맵이 지정된 세트를 셉니다. 팀 선택 시 해당 팀이 참가한 세트의 승·패를 표시합니다. 승률 = 승 / (승 + 패)."
      : "사용 횟수는 선수·세트 기록의 사용 영웅 ID당 1회입니다. 승·패는 현재 시즌 팀 편성과 일치하고 세트 결과가 확정된 사용만 셉니다. 승률 = 승 / (승 + 패).";

  return <div className="flex min-h-0 flex-1 flex-col gap-4">
    <AdminCard title={<div role="tablist" aria-label="통계 기준" className="flex flex-wrap gap-2">{tabs.map((item) => <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} className={`rounded-lg px-4 py-2 text-sm font-bold ${tab === item.id ? "bg-amber-500 text-slate-950" : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200"}`} onClick={() => { setTab(item.id); setPage(1); setDetail(null); setFilters((current) => ({ ...current, sort: item.id === "heroes" ? "uses" : "sets" })); }}>{item.label}</button>)}</div>} actions={data ? <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{data.total}건</span> : undefined} className="flex-1">
      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <label className="flex flex-col gap-1 text-xs">대회·시즌<select className={fieldClass} value={seasonId} onChange={(event) => { setSeasonId(event.target.value); setPage(1); setDetail(null); setFilters(initialFilters); setSearchDraft(""); }}><option value="">대회 선택</option>{seasons.map((season) => <option key={season.id} value={season.id}>{season.name}</option>)}</select></label>
        <label className="flex flex-col gap-1 text-xs">팀<select className={fieldClass} value={filters.teamId} onChange={(event) => changeFilter("teamId", event.target.value)}><option value="">전체 팀</option>{options.teams.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="flex flex-col gap-1 text-xs">맵<select className={fieldClass} value={filters.mapId} onChange={(event) => changeFilter("mapId", event.target.value)}><option value="">전체 맵</option>{options.maps.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="flex flex-col gap-1 text-xs">선수<select className={fieldClass} value={filters.playerId} onChange={(event) => changeFilter("playerId", event.target.value)}><option value="">전체 선수</option>{options.players.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="flex flex-col gap-1 text-xs">영웅<select className={fieldClass} value={filters.heroId} onChange={(event) => changeFilter("heroId", event.target.value)}><option value="">전체 영웅</option>{options.heroes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="flex flex-col gap-1 text-xs">정렬<select className={fieldClass} value={filters.sort} onChange={(event) => changeFilter("sort", event.target.value)}><option value="sets">세트 수 많은순</option><option value="matches">경기 수 많은순</option>{tab === "heroes" && <option value="uses">사용 횟수 많은순</option>}{(tab !== "maps" || filters.teamId) && <><option value="wins">승 많은순</option><option value="rate">승률 높은순</option></>}<option value="name">이름순</option></select></label>
        <form className="flex flex-col gap-1 text-xs sm:col-span-2 xl:col-span-2" onSubmit={(event) => { event.preventDefault(); changeFilter("search", searchDraft.trim()); }}><label htmlFor="statistics-search">{tab === "players" ? "선수명" : tab === "maps" ? "맵명" : "영웅명"} 검색</label><div className="flex gap-2"><input id="statistics-search" className={`${fieldClass} min-w-0 flex-1`} value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="이름 입력" /><button type="submit" className="rounded-lg bg-amber-500 px-4 font-bold text-slate-950">검색</button></div></form>
      </div>
      <p className="mb-3 text-xs text-slate-600 dark:text-slate-300">{explanation} 경기 수는 중복 없는 경기 수이며, 결과 미정 세트는 승률 분모에서 제외합니다. 다른 항목 필터는 같은 세트에 기록된 항목을 찾습니다.</p>
      {seasonsStatus === "error" && <button type="button" className="mb-3 text-xs text-red-600 underline" onClick={reloadSeasons}>대회 목록 조회 실패 · 다시 시도</button>}
      {error && <p role="alert" className="mb-3 text-xs text-red-600">{error} <button type="button" className="underline" onClick={() => setReloadToken((value) => value + 1)}>다시 시도</button></p>}
      <AdminTable columns={columns} data={data?.rows ?? []} isLoading={loading || seasonsStatus === "loading"} emptyTitle={seasonId ? "조회된 통계가 없습니다." : "대회를 선택해주세요."} />
      <div className="mt-3 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300"><span>{data ? `${data.total}건 중 ${data.total ? (page - 1) * data.pageSize + 1 : 0}-${Math.min(page * data.pageSize, data.total)}건` : ""}</span><div className="flex items-center gap-3"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>이전</button><span>{page} / {Math.max(1, Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 20)))}</span><button type="button" disabled={!data || page * data.pageSize >= data.total || loading} onClick={() => setPage((value) => value + 1)}>다음</button></div></div>
    </AdminCard>
    {detail && <AdminCard title={<>{detail.name} · 관련 경기{matches && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{matches.total}건</span>}</>} actions={<button type="button" className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700" onClick={() => setDetail(null)}>닫기</button>}>
      {detailError && <p role="alert" className="mb-2 text-xs text-red-600">{detailError} <button type="button" className="underline" onClick={() => setReloadToken((value) => value + 1)}>다시 시도</button></p>}
      <AdminTable columns={[
        { key: "date", header: "경기일", render: (row: MatchRow) => row.matchDate ?? "미정" },
        { key: "stage", header: "단계", render: (row: MatchRow) => row.tournamentStage },
        { key: "teams", header: "대진", render: (row: MatchRow) => `${row.teamA} vs ${row.teamB}` },
        { key: "link", header: "상세", render: (row: MatchRow) => <Link className="font-bold text-amber-700 underline dark:text-amber-400" href={`/admin/match-records/${row.id}?seasonId=${seasonId}`}>전체 기록</Link> },
      ]} data={matches?.rows ?? []} isLoading={detailLoading} emptyTitle="관련 경기가 없습니다." containerClassName="max-h-[25vh]" />
      <div className="mt-2 flex justify-end gap-3 text-xs"><button type="button" disabled={detailPage <= 1 || detailLoading} onClick={() => setDetailPage((value) => value - 1)}>이전</button><span>{detailPage} / {Math.max(1, Math.ceil((matches?.total ?? 0) / (matches?.pageSize ?? 20)))}</span><button type="button" disabled={!matches || detailPage * matches.pageSize >= matches.total || detailLoading} onClick={() => setDetailPage((value) => value + 1)}>다음</button></div>
    </AdminCard>}
  </div>;
}
