// File: app/admin/match-records/MatchRecordBrowser.tsx
// Page/Component: MatchRecordBrowser
// Purpose: 대회별 경기 그리드에서 핵심 결과와 상세 페이지 링크를 제공한다.
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminCard from "@/components/admin/AdminCard";
import AdminTable, { type AdminTableColumn } from "@/components/admin/AdminTable";
import { useAdmin } from "@/lib/context/AdminContext";

type Option = { id: string; name: string; mapType?: string };
type SetRow = { id: string; setNumber: number; winnerTeamId: string | null; map: Option | null };
type MatchRow = {
  id: string; seasonId: string; tournamentStage: string; matchDate: string | null;
  bestOf: number | null; winnerTeamId: string | null;
  teamA: Option; teamB: Option; sets: SetRow[]; scoreA: number; scoreB: number;
};
type ListData = { total: number; page: number; pageSize: number; rows: MatchRow[] };
type ApiResult<T> = { success: boolean; data?: T; message?: string };
const fieldClass = "rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
// API 공통 응답을 확인하고 오류 메시지를 호출자에 전달한다.
async function readApi<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  const result = await response.json() as ApiResult<T>;
  if (!response.ok || !result.success || result.data === undefined) throw new Error(result.message || "조회에 실패했습니다.");
  return result.data;
}

// 시즌4를 우선 선택하고 서버 페이지별 경기 결과를 표시한다.
export default function MatchRecordBrowser() {
  const { seasons, seasonsStatus, reloadSeasons } = useAdmin();
  const [seasonId, setSeasonId] = useState("");
  const [filters, setFilters] = useState({ search: "", matchId: "", setNumber: "", teamId: "", mapId: "", sort: "dateDesc" });
  const [searchDraft, setSearchDraft] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListData | null>(null);
  const [options, setOptions] = useState<{ teams: Option[]; maps: Option[] }>({ teams: [], maps: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  // 대회 목록을 받으면 러너리그 시즌4를 이름으로 찾아 초기값으로 사용한다.
  useEffect(() => {
    if (seasonsStatus !== "ready" || seasonId || seasons.length === 0) return;
    const requestedId = new URLSearchParams(window.location.search).get("seasonId");
    setSeasonId(seasons.find((season) => season.id === requestedId)?.id ?? seasons.find((season) => /러너리그.*시즌\s*4|러너리그.*season\s*4/i.test(season.name))?.id ?? seasons[0].id);
  }, [seasons, seasonsStatus, seasonId]);

  // 대회를 바꿀 때 해당 대회의 실제 팀과 사용 맵 선택지만 읽는다.
  useEffect(() => {
    if (!seasonId) return;
    const controller = new AbortController();
    setOptions({ teams: [], maps: [] });
    readApi<{ teams: Option[]; maps: Option[] }>(`/api/match-records?view=filters&seasonId=${seasonId}`, controller.signal)
      .then(setOptions).catch((cause) => { if (!controller.signal.aborted) setError(cause.message); });
    return () => controller.abort();
  }, [seasonId]);

  // 검색·필터·정렬·페이지 변경 때 현재 페이지의 경기만 서버에서 다시 읽는다.
  useEffect(() => {
    if (!seasonId) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ seasonId, page: String(page), ...filters });
    setLoading(true); setError(""); setData(null);
    readApi<ListData>(`/api/match-records?${params}`, controller.signal)
      .then(setData).catch((cause) => { if (!controller.signal.aborted) setError(cause.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [seasonId, page, filters, reloadToken]);

  // 필터를 바꾸면 첫 페이지부터 조회한다.
  const changeFilter = (key: keyof typeof filters, value: string) => {
    setPage(1); setFilters((current) => ({ ...current, [key]: value }));
  };
  const columns = useMemo<AdminTableColumn<MatchRow>[]>(() => [
    { key: "id", header: "경기 ID", render: (row) => row.id },
    { key: "date", header: "경기일", render: (row) => row.matchDate?.slice(0, 10) ?? "미정" },
    { key: "stage", header: "단계", render: (row) => row.tournamentStage },
    { key: "teams", header: "대진", render: (row) => `${row.teamA.name} vs ${row.teamB.name}` },
    { key: "score", header: "세트 결과", render: (row) => `${row.scoreA} : ${row.scoreB} / ${row.sets.length}세트` },
    { key: "winner", header: "승리 팀", render: (row) => row.winnerTeamId === row.teamA.id ? row.teamA.name : row.winnerTeamId === row.teamB.id ? row.teamB.name : "미정" },
    { key: "maps", header: "맵", render: (row) => row.sets.map((set) => `${set.setNumber}. ${set.map?.name ?? "미정"}`).join(" · ") || "미정" },
    { key: "detail", header: "상세", render: (row) => <Link className="font-bold text-amber-700 underline dark:text-amber-400" href={`/admin/match-records/${row.id}?seasonId=${row.seasonId}`}>전체 기록</Link> },
  ], []);

  return <div className="flex min-h-0 flex-1 flex-col gap-4">
    <div><h1 className="text-xl font-bold text-slate-900 dark:text-white">경기 데이터 조회</h1><p className="mt-1 text-xs text-slate-500">저장된 경기 결과와 세트·선수·영웅 밴 기록을 읽기 전용으로 조회합니다.</p></div>
    <AdminCard title="경기 목록" countBadge={data ? `${data.total}건` : undefined} className="flex-1">
      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs">대회·시즌<select className={fieldClass} value={seasonId} onChange={(event) => { setSeasonId(event.target.value); setPage(1); setFilters({ search: "", matchId: "", setNumber: "", teamId: "", mapId: "", sort: "dateDesc" }); setSearchDraft(""); }}><option value="">대회 선택</option>{seasons.map((season) => <option key={season.id} value={season.id}>{season.name}</option>)}</select></label>
        <label className="flex flex-col gap-1 text-xs">경기 ID<input className={fieldClass} type="number" min="1" value={filters.matchId} onChange={(event) => changeFilter("matchId", event.target.value)} placeholder="전체" /></label>
        <label className="flex flex-col gap-1 text-xs">세트 번호<input className={fieldClass} type="number" min="1" value={filters.setNumber} onChange={(event) => changeFilter("setNumber", event.target.value)} placeholder="전체" /></label>
        <label className="flex flex-col gap-1 text-xs">팀<select className={fieldClass} value={filters.teamId} onChange={(event) => changeFilter("teamId", event.target.value)}><option value="">전체 팀</option>{options.teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label>
        <label className="flex flex-col gap-1 text-xs">맵<select className={fieldClass} value={filters.mapId} onChange={(event) => changeFilter("mapId", event.target.value)}><option value="">전체 맵</option>{options.maps.map((map) => <option key={map.id} value={map.id}>{map.name} · {map.mapType}</option>)}</select></label>
        <label className="flex flex-col gap-1 text-xs">정렬<select className={fieldClass} value={filters.sort} onChange={(event) => changeFilter("sort", event.target.value)}><option value="dateDesc">경기일 최신순</option><option value="dateAsc">경기일 오래된순</option><option value="stage">단계순</option><option value="idDesc">등록 최신순</option></select></label>
        <form className="flex flex-col gap-1 text-xs sm:col-span-2" onSubmit={(event) => { event.preventDefault(); changeFilter("search", searchDraft.trim()); }}><label htmlFor="record-search">단계·팀 검색</label><div className="flex gap-2"><input id="record-search" className={`${fieldClass} min-w-0 flex-1`} value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="단계 또는 팀명" /><button className="rounded-lg bg-amber-500 px-4 font-bold text-slate-950" type="submit">검색</button></div></form>
      </div>
      {seasonsStatus === "error" && <button className="mb-3 text-xs text-red-600 underline" onClick={reloadSeasons}>대회 목록 조회 실패 · 다시 시도</button>}
      {error && <p role="alert" className="mb-3 text-xs text-red-600">{error} <button type="button" className="underline" onClick={() => setReloadToken((current) => current + 1)}>다시 시도</button></p>}
      <AdminTable columns={columns} data={data?.rows ?? []} isLoading={loading || seasonsStatus === "loading"} emptyTitle={seasonId ? "조회된 경기가 없습니다." : "대회를 선택해주세요."} containerClassName="max-h-[55vh]" />
      <div className="mt-3 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300"><span>{data ? `${data.total}건 중 ${data.total ? (page - 1) * data.pageSize + 1 : 0}-${Math.min(page * data.pageSize, data.total)}건` : ""}</span><div className="flex items-center gap-3"><button disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>이전</button><span>{page} / {Math.max(1, Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 20)))}</span><button disabled={!data || page * data.pageSize >= data.total || loading} onClick={() => setPage((current) => current + 1)}>다음</button></div></div>
    </AdminCard>

  </div>;
}
