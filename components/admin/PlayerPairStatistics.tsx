// File: components/admin/PlayerPairStatistics.tsx
// Page/Component: PlayerPairStatistics
// Purpose: 선수별 맵 또는 영웅 통계를 각 독립 페이지에서 같은 조회 경험으로 표시한다.
"use client";

import { useEffect, useState } from "react";
import AdminCard from "@/components/admin/AdminCard";
import AdminTable, { type AdminTableColumn } from "@/components/admin/AdminTable";
import { useAdmin } from "@/lib/context/AdminContext";
import type { PairKind } from "@/lib/matches/playerPairStatisticsService";

type Option = { id: string; name: string };
type Options = { players: Option[]; items: Option[] };
type Row = { playerId: string; playerName: string; itemId: string; itemName: string; uses: number; matches: number; sets: number; wins: number; losses: number };
type Result = { total: number; page: number; pageSize: number; rows: Row[] };
type Filters = { playerId: string; itemId: string; search: string; sort: string };
const initialFilters: Filters = { playerId: "", itemId: "", search: "", sort: "uses" };
const fieldClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

// API 응답의 성공 여부를 검사해 서버 오류를 화면에 전달한다.
async function readApi<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  const body = await response.json() as { success: boolean; data?: T; message?: string };
  if (!response.ok || !body.success || body.data === undefined) throw new Error(body.message || "조회에 실패했습니다.");
  return body.data;
}

// 맵·영웅별 열과 필터 설명을 생성하고 선택 대회 결과를 서버 페이지 단위로 조회한다.
export default function PlayerPairStatistics({ kind }: { kind: PairKind }) {
  const label = kind === "map" ? "맵" : "영웅";
  const { seasons, seasonsStatus, reloadSeasons } = useAdmin();
  const [seasonId, setSeasonId] = useState("");
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [searchDraft, setSearchDraft] = useState("");
  const [page, setPage] = useState(1);
  const [options, setOptions] = useState<Options>({ players: [], items: [] });
  const [data, setData] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterError, setFilterError] = useState("");
  const [retry, setRetry] = useState(0);

  // URL 선택값이 없으면 러너리그 시즌4를 우선 표시한다.
  useEffect(() => {
    if (seasonsStatus !== "ready" || seasonId || !seasons.length) return;
    const requested = new URLSearchParams(window.location.search).get("seasonId");
    setSeasonId(seasons.find((season) => season.id === requested)?.id ??
      seasons.find((season) => /러너리그.*(?:시즌|season)\s*4/i.test(season.name))?.id ?? seasons[0].id);
  }, [seasons, seasonsStatus, seasonId]);

  // 대회에 실제 기록된 선수와 맵 또는 영웅만 선택지로 조회한다.
  useEffect(() => {
    if (!seasonId) return;
    const controller = new AbortController();
    setOptions({ players: [], items: [] }); setFilterError("");
    readApi<Options>(`/api/player-pair-statistics?kind=${kind}&view=filters&seasonId=${seasonId}`, controller.signal)
      .then(setOptions).catch((cause) => { if (!controller.signal.aborted) setFilterError(cause.message); });
    return () => controller.abort();
  }, [kind, seasonId, retry]);

  // 조건이 바뀌면 이전 요청을 취소하고 정렬된 현재 페이지를 읽는다.
  useEffect(() => {
    if (!seasonId) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ kind, seasonId, page: String(page), ...filters });
    setLoading(true); setError(""); setData(null);
    readApi<Result>(`/api/player-pair-statistics?${params}`, controller.signal)
      .then(setData).catch((cause) => { if (!controller.signal.aborted) setError(cause.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [kind, seasonId, page, filters, retry]);

  // 필터가 바뀌면 첫 페이지부터 다시 읽는다.
  const changeFilter = (key: keyof Filters, value: string) => {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  };
  const columns: AdminTableColumn<Row>[] = [
    { key: "player", header: "선수", render: (row) => <strong>{row.playerName}</strong> },
    { key: "item", header: label, render: (row) => row.itemName },
    { key: "uses", header: kind === "map" ? "사용 세트" : "사용 횟수", align: "right", render: (row) => row.uses.toLocaleString() },
    { key: "matches", header: "경기 수", align: "right", render: (row) => row.matches.toLocaleString() },
    { key: "wins", header: "승", align: "right", render: (row) => row.wins.toLocaleString() },
    { key: "losses", header: "패", align: "right", render: (row) => row.losses.toLocaleString() },
    { key: "rate", header: "승률", align: "right", render: (row) => row.wins + row.losses ? `${(row.wins / (row.wins + row.losses) * 100).toFixed(1)}%` : "—" },
  ];

  return <div className="flex min-h-0 flex-1 flex-col gap-4 pb-6">
    <div><h1 className="text-xl font-bold text-slate-900 dark:text-white">선수별 {label} 통계</h1>
      <p className="mt-1 text-xs text-slate-500">저장된 경기 기록에서 선수·{label} 조합별 사용을 조회합니다.</p></div>
    <AdminCard title={`${label} 사용 통계`} countBadge={data ? `${data.total}개 조합` : undefined} className="flex-1">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <label className="text-xs">대회·시즌<select className={`${fieldClass} mt-1`} value={seasonId} onChange={(event) => { setSeasonId(event.target.value); setFilters(initialFilters); setSearchDraft(""); setPage(1); }}><option value="">대회 선택</option>{seasons.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="text-xs">선수<select className={`${fieldClass} mt-1`} value={filters.playerId} onChange={(event) => changeFilter("playerId", event.target.value)}><option value="">전체 선수</option>{options.players.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="text-xs">{label}<select className={`${fieldClass} mt-1`} value={filters.itemId} onChange={(event) => changeFilter("itemId", event.target.value)}><option value="">전체 {label}</option>{options.items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="text-xs">정렬<select className={`${fieldClass} mt-1`} value={filters.sort} onChange={(event) => changeFilter("sort", event.target.value)}><option value="uses">사용 많은순</option><option value="matches">경기 수 많은순</option><option value="wins">승 많은순</option><option value="rate">승률 높은순</option><option value="player">선수명순</option><option value="item">{label}명순</option></select></label>
        <form className="text-xs sm:col-span-2" onSubmit={(event) => { event.preventDefault(); changeFilter("search", searchDraft.trim()); }}><label htmlFor={`${kind}-pair-search`}>선수·{label} 이름 검색</label><div className="mt-1 flex gap-2"><input id={`${kind}-pair-search`} className={`${fieldClass} min-w-0 flex-1`} value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="이름 입력" /><button type="submit" className="rounded-lg bg-amber-500 px-4 font-bold text-slate-950">검색</button></div></form>
      </div>
      <p className="my-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">한 행은 선수·{label} 조합입니다. {kind === "map" ? "맵이 지정된 선수·세트를 사용 1회로 셉니다." : "사용 영웅 ID가 기록된 선수·세트를 영웅당 사용 1회로 셉니다. 맵 미지정 세트도 포함합니다."} 경기 수는 중복 없는 경기 수입니다. 승률 = 승 / (승 + 패). 현재 시즌 팀이 경기 참가 팀과 일치하고 세트 승리 팀이 확정된 사용만 승패에 포함합니다.</p>
      {seasonsStatus === "error" && <button type="button" className="mb-3 text-xs text-red-600 underline" onClick={reloadSeasons}>대회 목록 조회 실패 · 다시 시도</button>}
      {filterError && <p role="alert" className="mb-3 text-xs text-red-600">필터 조회 실패: {filterError} <button type="button" className="underline" onClick={() => setRetry((value) => value + 1)}>다시 시도</button></p>}
      {error && <p role="alert" className="mb-3 text-xs text-red-600">{error} <button type="button" className="underline" onClick={() => setRetry((value) => value + 1)}>다시 시도</button></p>}
      <AdminTable columns={columns} data={data?.rows ?? []} keyField={(row) => `${row.playerId}-${row.itemId}`} isLoading={loading || seasonsStatus === "loading"} emptyTitle={seasonId ? "조회된 사용 기록이 없습니다." : "대회를 선택해주세요."} containerClassName="max-h-[50vh]" />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300"><span>{data ? `${data.total}개 조합 중 ${data.total ? (page - 1) * data.pageSize + 1 : 0}-${Math.min(page * data.pageSize, data.total)}개` : ""}</span><div className="flex items-center gap-3"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>이전</button><span>{page} / {Math.max(1, Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 20)))}</span><button type="button" disabled={!data || loading || page * data.pageSize >= data.total} onClick={() => setPage((value) => value + 1)}>다음</button></div></div>
    </AdminCard>
  </div>;
}
