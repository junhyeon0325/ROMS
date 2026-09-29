// File: app/admin/seasons/draft/page.tsx
// Page/Component: AdminSeasonDraftPage
// Purpose: 등록 팀장별 팀을 미리 보여주고 선수 풀에서 지명 칸으로 수동 배정한다.
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, RotateCcw, Search, Shield, StepBack, UserMinus } from "lucide-react";
import AdminAvatar from "@/components/admin/AdminAvatar";
import SeasonInlineSelect from "@/components/admin/SeasonInlineSelect";
import { useAdmin } from "@/lib/context/AdminContext";
import { fetchSeasonDraft, saveSeasonDraftClient } from "@/lib/seasons/draftClient";
import { assignCoach, boardDraftOrders, draftPickNumber, placePlayerInSlot, prepareCaptainTeams, prepareDraftSlots, removeLastPick, reorderCaptains, resetPlayerPicks, swapDraftPlayers, unassignPlayer, type BoardSnapshot } from "@/lib/seasons/draftBoard";
import { validateDraftInput } from "@/lib/seasons/draftValidator";
import type { DraftSaveInput, SeasonDraft } from "@/lib/types/seasonDraft";
import type { SeasonParticipantRecord } from "@/lib/types/seasonParticipants";

// 공격 포지션을 사진의 탄알 모양으로 구별한다.
function DamageBullet() {
  return <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M2 5.5h8.5c3.3 0 6 1.8 7.5 4.5-1.5 2.7-4.2 4.5-7.5 4.5H2v-9Z" /></svg>;
}

// 기존 포지션 코드에 해당하는 역할 이름과 아이콘을 표시한다.
function PositionBadge({ position }: { position: string | null }) {
  if (position === "TANK") return <span className="inline-flex items-center gap-0.5 rounded-md bg-sky-50 px-1 py-0.5 text-[10px] font-bold text-sky-700 dark:bg-sky-950/50 dark:text-sky-300"><Shield size={11} aria-hidden="true" />돌격</span>;
  if (position === "DAMAGE") return <span className="inline-flex items-center gap-0.5 rounded-md bg-rose-50 px-1 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"><DamageBullet />공격</span>;
  if (position === "SUPPORT" || position === "HEALER") return <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-1 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"><Plus size={11} strokeWidth={3} aria-hidden="true" />지원</span>;
  return <span className="rounded-md bg-slate-100 px-1 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800">포지션 없음</span>;
}

// 선수 이름·사진·역할을 선택 가능한 카드로 표시한다.
function PlayerCard({ player, selected, onSelect }: { player: SeasonParticipantRecord; selected: boolean; onSelect: () => void }) {
  return <button type="button" aria-pressed={selected} onClick={onSelect} className={`flex min-h-[68px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg border p-1 text-center transition-colors ${selected ? "border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/20" : "border-slate-200 bg-white hover:border-amber-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-amber-600"}`}>
    <AdminAvatar name={player.name} profileImg={player.profileImg} size="h-8 w-8 text-[10px]" />
    <span className="block w-full truncate text-[10px] font-bold leading-tight text-slate-900 dark:text-slate-100">{player.name}</span><PositionBadge position={player.position} />
  </button>;
}

// 고정 번호의 한 지명 칸을 선수 카드나 배정 버튼으로 표시한다.
function DraftSlotCard({ number, player, selected, disabled, onSelect, onPlace }: { number: number; player?: SeasonParticipantRecord; selected: boolean; disabled: boolean; onSelect: () => void; onPlace: () => void }) {
  if (!player) return <button type="button" aria-label={`${number}번 지명 칸에 선수 배정`} disabled={disabled} onClick={onPlace} className="relative flex min-h-[88px] min-w-0 items-center justify-center gap-1 rounded-lg border border-dashed border-amber-300 bg-amber-50/60 p-1 text-amber-800 hover:bg-amber-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-transparent disabled:text-slate-400 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-300 dark:disabled:border-slate-700 dark:disabled:bg-transparent"><strong className="absolute right-1.5 top-1 text-[10px]">#{number}</strong><Plus size={18} aria-hidden="true" /><span className="min-w-0 truncate text-[11px] font-semibold">선수 배정</span></button>;
  return <div className={`relative flex min-h-[88px] min-w-0 items-center rounded-lg border bg-white px-2 py-1 dark:bg-slate-900 ${selected ? "border-amber-500 ring-2 ring-amber-500/20" : "border-slate-200 dark:border-slate-700"}`}><strong className="absolute right-1.5 top-1 text-[10px] text-amber-700 dark:text-amber-300">#{number}</strong><button type="button" aria-pressed={selected} onClick={onSelect} className="flex h-full w-full min-w-0 items-center gap-2 pr-3 text-left"><AdminAvatar name={player.name} profileImg={player.profileImg} size="h-12 w-12 text-sm" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{player.name}</span><PositionBadge position={player.position} /></span></button></div>;
}

// 지명 칸을 교환한 뒤 각 팀의 인원과 공격·지원 상한을 다시 검사한다.
function canSwapDraftPlayers(board: BoardSnapshot, participants: Map<string, SeasonParticipantRecord>): boolean {
  return board.teams.every((team) => {
    const roster = team.members.map((id) => participants.get(id)).filter((item): item is SeasonParticipantRecord => !!item && !item.roles.includes("COACH"));
    return roster.length <= 5 && roster.filter((item) => item.position === "DAMAGE").length <= 2 && roster.filter((item) => item.position === "SUPPORT" || item.position === "HEALER").length <= 2;
  });
}

// 등록된 선수의 팀 편성과 감독 배정, 칸별 고정 지명 순서를 보드로 관리한다.
export default function AdminSeasonDraftPage() {
  const { seasons, seasonsStatus, reloadSeasons, showFeedback } = useAdmin();
  const [selectedId, setSelectedId] = useState("");
  const seasonId = selectedId;
  const selectedSeason = seasons.find((season) => season.id === seasonId) ?? null;
  const [data, setData] = useState<SeasonDraft>({ participants: [], teams: [] });
  const [board, setBoard] = useState<BoardSnapshot>({ teams: [], slots: {} });
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 대회가 바뀌면 이전 보드를 지우고 해당 시즌의 저장 상태를 다시 조회한다.
  useEffect(() => {
    if (!seasonId) return;
    let active = true;
    setLoading(true);
    setError("");
    setData({ participants: [], teams: [] });
    setBoard({ teams: [], slots: {} });
    setSelectedPlayerId(null);
    fetchSeasonDraft(seasonId).then((result) => {
      if (!active) return;
      if (!result.success || !result.data) { setError(result.message || "편성을 불러오지 못했습니다."); return; }
      setData(result.data);
      const nextTeams = prepareCaptainTeams(result.data);
      setBoard({ teams: nextTeams, slots: prepareDraftSlots(nextTeams, result.data.participants) });
    }).catch(() => { if (active) setError("편성을 불러오지 못했습니다."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [seasonId]);

  const teams = board.teams;
  const orders = boardDraftOrders(teams, board.slots);
  const participantById = useMemo(() => new Map(data.participants.map((item) => [item.streamerId, item])), [data.participants]);
  const captains = useMemo(() => data.participants.filter((item) => item.roles.includes("CAPTAIN")), [data.participants]);
  const players = useMemo(() => data.participants.filter((item) => !item.roles.includes("COACH") && !item.roles.includes("CAPTAIN")), [data.participants]);
  const coaches = useMemo(() => data.participants.filter((item) => item.roles.includes("COACH") && !item.roles.includes("CAPTAIN")), [data.participants]);
  const coachIds = useMemo(() => new Set(coaches.map((item) => item.streamerId)), [coaches]);
  const memberTeam = useMemo(() => new Map(teams.flatMap((team) => team.members.map((id) => [id, team.key] as const))), [teams]);
  const selectedPlayer = selectedPlayerId ? participantById.get(selectedPlayerId) : null;
  const assignedPlayers = players.filter((player) => memberTeam.has(player.streamerId));
  const pool = players.filter((player) => !memberTeam.has(player.streamerId));
  const visiblePool = pool.filter((player) => player.name.toLowerCase().includes(query.trim().toLowerCase()));
  const poolGroups = [
    { key: "damage", label: "공격 선수", players: visiblePool.filter((player) => player.position === "DAMAGE") },
    { key: "support", label: "지원 선수", players: visiblePool.filter((player) => player.position === "SUPPORT" || player.position === "HEALER") },
    { key: "other", label: "기타 선수", players: visiblePool.filter((player) => player.position !== "DAMAGE" && player.position !== "SUPPORT" && player.position !== "HEALER") },
  ].filter((group) => group.key !== "other" || group.players.length > 0);
  const orderedPicks = assignedPlayers.filter((player) => orders[player.streamerId] !== undefined).sort((a, b) => orders[a.streamerId] - orders[b.streamerId]);

  // 선수·감독·팀장 변경을 현재 보드에 반영한다.
  const applyBoard = (next: BoardSnapshot) => {
    if (next === board) return;
    setBoard(next);
    setError("");
  };

  // 번호가 가장 큰 지명 선수 한 명을 선수 풀로 돌린다.
  const removeLast = () => {
    if (saving) return;
    applyBoard(removeLastPick(board));
    setSelectedPlayerId(null);
  };

  // 모든 지명 선수를 선수 풀로 돌리고 팀장·감독은 보존한다.
  const resetAll = () => {
    if (saving) return;
    applyBoard(resetPlayerPicks(board));
    setSelectedPlayerId(null);
  };

  // 보드 선수를 다시 누르면 해제하고 다른 지명 선수를 누르면 자리와 팀을 교환한다.
  const selectBoardPlayer = (playerId: string) => {
    if (saving) return;
    if (selectedPlayerId === playerId) { setSelectedPlayerId(null); return; }
    if (selectedPlayerId && board.slots[selectedPlayerId] !== undefined) {
      const swapped = swapDraftPlayers(board, selectedPlayerId, playerId);
      if (!canSwapDraftPlayers(swapped, participantById)) { showFeedback("자리 교환 후 팀별 선수·공격·지원 인원을 확인해주세요."); return; }
      applyBoard(swapped);
      setSelectedPlayerId(null);
      return;
    }
    setSelectedPlayerId(playerId);
  };

  // 선택한 지명 선수만 팀에서 제외하고 선수 풀로 되돌린다.
  const removeSelectedPlayer = () => {
    if (!selectedPlayerId || board.slots[selectedPlayerId] === undefined || saving) return;
    applyBoard(unassignPlayer(board, selectedPlayerId));
    setSelectedPlayerId(null);
  };

  // 선택 선수를 누른 빈 칸으로 옮기고 팀 인원·역할 상한을 지킨다.
  const placePlayer = (targetKey: string, slot: number) => {
    if (!selectedPlayerId) { showFeedback("먼저 선수를 선택해주세요."); return; }
    if (selectedPlayer) {
      const target = teams.find((team) => team.key === targetKey);
      const roster = target?.members.map((id) => participantById.get(id)).filter((item): item is SeasonParticipantRecord => !!item && !item.roles.includes("COACH") && item.streamerId !== selectedPlayerId) ?? [];
      if (roster.length >= 5) { showFeedback("한 팀에는 팀장을 포함해 5명까지 배정할 수 있습니다."); return; }
      const position = selectedPlayer.position;
      if ((position === "DAMAGE" && roster.filter((item) => item.position === "DAMAGE").length >= 2) || ((position === "SUPPORT" || position === "HEALER") && roster.filter((item) => item.position === "SUPPORT" || item.position === "HEALER").length >= 2)) { showFeedback("팀별 딜러와 힐러는 각각 2명까지 배정할 수 있습니다."); return; }
    }
    applyBoard(placePlayerInSlot(board, selectedPlayerId, targetKey, slot));
    setSelectedPlayerId(null);
  };

  // 기존 감독 소속을 해제하고 선택한 팀의 감독을 한 명으로 교체한다.
  const changeCoach = (teamKey: string, coachId: string) => {
    if (teams.find((team) => team.key === teamKey)?.members.find((id) => coachIds.has(id)) === (coachId || undefined)) return;
    applyBoard({ ...board, teams: assignCoach(teams, teamKey, coachId || null, coachIds) });
  };

  // 팀원과 지명 순서를 검사하고 한 시즌의 변경 사항을 함께 저장한다.
  const save = async () => {
    if (!seasonId || loading || saving) return;
    const input: DraftSaveInput = {
      teams: teams.map((team) => ({ ...(team.id ? { id: team.id } : {}), name: team.name, sortOrder: team.sortOrder, members: team.members })),
      draftOrders: data.participants.map((item) => ({ streamerId: item.streamerId, order: item.roles.includes("COACH") || item.roles.includes("CAPTAIN") || !memberTeam.has(item.streamerId) ? null : orders[item.streamerId] ?? null })),
    };
    try { validateDraftInput(input); } catch (cause) { setError(cause instanceof Error ? cause.message : "입력을 확인해주세요."); return; }
    setSaving(true);
    setError("");
    try {
      const result = await saveSeasonDraftClient(seasonId, input);
      if (!result.success || !result.data) { setError(result.message || "저장하지 못했습니다."); return; }
      setData(result.data);
      const nextTeams = prepareCaptainTeams(result.data);
      setBoard({ teams: nextTeams, slots: prepareDraftSlots(nextTeams, result.data.participants) });
      setSelectedPlayerId(null);
      showFeedback("팀 편성과 지명 순서를 저장했습니다.");
    } catch { setError("저장 요청에 실패했습니다."); } finally { setSaving(false); }
  };

  return <section className="flex h-full min-h-0 flex-col gap-2 overflow-hidden">
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-slate-800/10 p-4 md:p-5">
      <div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f99e1a] text-sm font-bold text-slate-950 shadow-sm">🏆</span><div><div className="flex items-center gap-2"><h2 className="text-sm font-bold text-slate-900 dark:text-white md:text-base">{selectedSeason?.name || "팀 구성 및 드래프트"}</h2>{selectedSeason && <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${selectedSeason.status === "진행중" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400" : selectedSeason.status === "개최 예정" ? "bg-amber-100 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800"}`}>{selectedSeason.status}</span>}</div><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{selectedSeason ? `총 상금: ${selectedSeason.prize}` : "대회를 선택해 팀 편성과 지명 순서를 관리하세요."}</p></div></div>
      <div className="flex flex-wrap items-center gap-2">{seasonsStatus === "ready" && seasons.length > 0 && <SeasonInlineSelect seasons={seasons} value={seasonId} onChange={setSelectedId} disabled={loading || saving} />}{seasonsStatus === "error" && <button type="button" onClick={reloadSeasons} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold">다시 시도</button>}{seasonsStatus === "ready" && !seasons.length && <Link href="/admin/seasons" className="rounded-lg bg-[#f99e1a] px-4 py-2 text-xs font-bold text-slate-950">+ 새 대회 등록</Link>}<button type="button" disabled={!seasonId || loading || saving} onClick={() => void save()} className="rounded-lg bg-[#f99e1a] px-4 py-2 text-xs font-bold text-slate-950 disabled:opacity-50">{saving ? "저장 중..." : "변경 사항 저장"}</button></div>
    </div>
    {error && <p role="alert" className="shrink-0 rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {seasonId ? <div className="grid min-h-0 flex-1 gap-2 overflow-hidden xl:grid-cols-[minmax(340px,0.9fr)_minmax(0,1.7fr)]">
      <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#111726]">
        <div className="border-b border-slate-100 p-2 dark:border-slate-800"><div className="flex items-center justify-between"><h2 className="text-sm font-bold">선수 풀</h2><p className="text-[11px] text-slate-500">대기 {pool.length}명 · 전체 {players.length}명</p></div><label className="mt-1.5 flex items-center gap-2 rounded-lg border border-slate-200 px-2 dark:border-slate-700"><Search size={14} className="text-slate-400" aria-hidden="true" /><input aria-label="선수 검색" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="선수 이름 검색" className="w-full bg-transparent py-1.5 text-xs outline-none" /></label></div>
        <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-1.5">{loading ? <p className="p-4 text-center text-sm text-slate-500">선수 목록을 불러오는 중...</p> : visiblePool.length ? poolGroups.map((group) => <section key={group.key} aria-label={group.label} className="rounded-lg border border-slate-200 bg-slate-50/70 p-1.5 dark:border-slate-700 dark:bg-slate-900/50"><h3 className="mb-1 text-[11px] font-bold text-slate-700 dark:text-slate-200">{group.label} <span className="font-normal text-slate-500">{group.players.length}명</span></h3>{group.players.length ? <div className="grid grid-cols-4 gap-1 2xl:grid-cols-5">{group.players.map((player) => <PlayerCard key={player.streamerId} player={player} selected={selectedPlayerId === player.streamerId} onSelect={() => setSelectedPlayerId(selectedPlayerId === player.streamerId ? null : player.streamerId)} />)}</div> : <p className="rounded-lg border border-dashed border-slate-200 p-2 text-center text-[11px] text-slate-400 dark:border-slate-700">대기 중인 선수가 없습니다.</p>}</section>) : <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-700">{pool.length ? "검색 조건에 맞는 선수가 없습니다." : "모든 선수가 팀에 배정되었습니다."}</p>}</div>
      </aside>

      <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#111726]">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3 py-2 dark:border-slate-800"><div><h2 className="text-sm font-bold">팀장별 지명 보드</h2><p className="text-[11px] text-slate-500">팀장 {captains.length}명 · 지명 {orderedPicks.length}명</p></div><div className="flex items-center gap-1"><button type="button" disabled={!selectedPlayerId || board.slots[selectedPlayerId] === undefined || saving} onClick={removeSelectedPlayer} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] font-semibold text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200"><UserMinus size={14} />선수 제외</button><button type="button" disabled={!orderedPicks.length || saving} onClick={removeLast} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] font-semibold text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200"><StepBack size={14} />마지막 지명 취소</button><button type="button" disabled={!orderedPicks.length || saving} onClick={resetAll} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2 py-1.5 text-[11px] font-semibold text-rose-600 disabled:opacity-40 dark:border-rose-900 dark:text-rose-400"><RotateCcw size={14} />선수 전체 초기화</button></div></div>
        <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden p-2">
          {loading ? <p className="py-12 text-center text-sm text-slate-500">팀 편성을 불러오는 중...</p> : <>
            {teams.length ? <div className="grid min-h-0 flex-1 auto-rows-min content-start gap-1.5 overflow-y-auto">{teams.map((team, index) => {
              const captain = team.members.map((id) => participantById.get(id)).find((item) => item?.roles.includes("CAPTAIN"));
              const coach = team.members.find((id) => coachIds.has(id)) || "";
              const coachParticipant = coach ? participantById.get(coach) : null;
              const teamPlayers = team.members.map((id) => participantById.get(id)).filter((item): item is SeasonParticipantRecord => !!item && !item.roles.includes("COACH") && !item.roles.includes("CAPTAIN"));
              const slotCount = Math.max(4, ...teamPlayers.map((player) => board.slots[player.streamerId] + 1));
              return <article key={team.key} className="grid min-h-[100px] grid-cols-[144px_minmax(0,1fr)] gap-1.5 rounded-xl border border-slate-200 bg-slate-50/70 p-1.5 dark:border-slate-700 dark:bg-slate-900/60 sm:grid-cols-[168px_minmax(0,1fr)]">
                <div className="flex min-w-0 flex-col justify-center gap-1 border-r border-slate-200 pr-1.5 dark:border-slate-700">
                  <div className="flex min-h-10 min-w-0 items-center gap-1.5"><label className="sr-only" htmlFor={`captain-order-${team.key}`}>{captain?.name || `${index + 1}번 팀`} 팀장 순서</label><select id={`captain-order-${team.key}`} title="팀장 순서" value={team.sortOrder} onChange={(event) => { const target = Number(event.target.value); if (target !== team.sortOrder) applyBoard({ ...board, teams: reorderCaptains(teams, team.key, target) }); }} className="w-9 shrink-0 rounded-md border border-amber-300 bg-white px-0.5 py-1 text-xs font-bold text-amber-800 dark:bg-slate-900 dark:text-amber-300">{teams.map((_, order) => <option key={order} value={order + 1}>{order + 1}</option>)}</select>{captain ? <><AdminAvatar name={captain.name} profileImg={captain.profileImg} size="h-10 w-10 text-xs" /><span className="min-w-0"><span className="block text-[10px] font-bold text-amber-700 dark:text-amber-300">팀장</span><strong className="block truncate text-xs">{captain.name}</strong></span></> : <p role="alert" className="text-xs font-bold text-rose-600">팀장 지정 필요</p>}</div>
                  <div className="flex min-h-8 min-w-0 items-center gap-1 rounded-md bg-white/80 px-1 py-0.5 dark:bg-slate-800/60"><span className="shrink-0 text-[10px] font-bold text-slate-500 dark:text-slate-300">감독</span>{coachParticipant && <AdminAvatar name={coachParticipant.name} profileImg={coachParticipant.profileImg} size="h-8 w-8 text-[10px]" />}<select aria-label={`${captain?.name || `${index + 1}번 팀`} 감독`} value={coach} onChange={(event) => changeCoach(team.key, event.target.value)} className="min-w-0 flex-1 bg-transparent text-xs text-slate-800 outline-none dark:text-slate-100"><option value="">선택</option>{coaches.map((item) => <option key={item.streamerId} value={item.streamerId}>{item.name}</option>)}</select></div>
                </div>
                <div className="grid min-w-0 grid-cols-4 gap-1">{Array.from({ length: slotCount }, (_, slot) => {
                  const player = teamPlayers.find((item) => board.slots[item.streamerId] === slot);
                  return <DraftSlotCard key={slot} number={draftPickNumber(index, slot, teams.length)} player={player} selected={!!player && selectedPlayerId === player.streamerId} disabled={!selectedPlayerId || saving} onSelect={() => { if (player) selectBoardPlayer(player.streamerId); }} onPlace={() => placePlayer(team.key, slot)} />;
                })}</div>
              </article>;
            })}</div> : <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700"><p className="font-bold">등록된 팀장이 없습니다.</p><p className="mt-1 text-sm text-slate-500">대회 선수 등록 및 역할 배정에서 팀장을 지정하면 팀별 지명 칸이 자동으로 생깁니다.</p><Link href="/admin/seasons/structure" className="mt-3 inline-flex rounded-lg bg-[#f99e1a] px-3 py-2 text-xs font-bold text-slate-950">팀장 배정 화면으로 이동</Link></div>}
            <div className="shrink-0 rounded-lg border border-slate-200 px-2 py-1 dark:border-slate-700"><h3 className="text-[11px] font-bold">지명 순서대로 보기</h3>{orderedPicks.length ? <ol className="mt-1 flex max-h-12 flex-wrap gap-1 overflow-y-auto">{orderedPicks.map((player) => <li key={player.streamerId} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] dark:bg-slate-800"><strong className="text-amber-600 dark:text-amber-400">#{orders[player.streamerId]}</strong> {player.name}</li>)}</ol> : <p className="text-[10px] text-slate-500">선수를 지명 칸에 배정하면 순서대로 표시됩니다.</p>}</div>
          </>}
        </div>
      </div>
    </div> : <div className="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-center dark:border-slate-800 dark:bg-slate-800/40"><div><span className="mb-2 block text-3xl">🏆</span><p className="font-bold text-slate-800 dark:text-slate-200">대회를 선택해 주세요.</p><p className="mt-1 text-sm text-slate-500">선택한 대회의 팀 편성과 지명 보드를 표시합니다.</p></div></div>}
  </section>;
}
