// File: components/admin/SetDetailEditor.tsx
// Page/Component: SetDetailEditor
// Purpose: 세트별 밴 순서와 좌우 팀의 경기·선수 데이터를 탭으로 입력하고 저장한다.
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Ban, Check, ChevronLeft, ChevronRight, Clock3, LoaderCircle, MapPin, Plus, Search, Swords, X } from "lucide-react";
import AdminAvatar from "@/components/admin/AdminAvatar";
import { useAdmin } from "@/lib/context/AdminContext";
import type { HeroItem } from "@/lib/types/heroes";
import type { MapSubareaResultInput, MatchRecord, MatchSetInput, MatchStatInput } from "@/lib/types/matches";
import { formatGameDuration, parseGameDuration } from "@/lib/matches/duration";
import { getFirstBanTeam, swapBanTeamAssignments } from "@/lib/matches/banOrder";
import type { SeasonDraft } from "@/lib/types/seasonDraft";

type ApiResult<T> = { success: boolean; data?: T; message?: string };
type MapOption = { id: string; nameKr: string; mode: string; imageUrl?: string | null; sortOrder: number; subareas?: { id: string; name: string; nameEn: string; sortOrder: number }[] };
type Props = { seasonId: string; matchId: string; setId: string };
type TeamColor = "BLUE" | "RED";
type DetailTab = "bans" | "matchData" | "stats";
const unassignedSubareaTabId = "__unassigned__";
const inputClass = "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white";
const metrics = [
  { key: "kills", label: "처치" }, { key: "assists", label: "도움" }, { key: "deaths", label: "죽음" },
  { key: "damage", label: "피해" }, { key: "healing", label: "치유" }, { key: "mitigatedDamage", label: "경감" },
] as const;
const roleLabels: Record<string, string> = { TANK: "돌격", DAMAGE: "공격", SUPPORT: "지원", HEALER: "지원" };

// 신규 선수 통계를 수치 0과 비어 있는 사용 영웅 목록으로 초기화한다.
function newStat(streamerId: string): MatchStatInput {
  return { streamerId, kills: 0, deaths: 0, assists: 0, damage: 0, healing: 0, mitigatedDamage: 0, usedHeroIds: [], usedHeroSubareas: {}, usedHeroTurns: {}, isPotg: false };
}

// 선택 세트의 경기·참가자·맵·영웅을 읽어 편집 가능한 전적을 구성한다.
export default function SetDetailEditor({ seasonId, matchId, setId }: Props) {
  const { showFeedback } = useAdmin();
  const [match, setMatch] = useState<MatchRecord | null>(null);
  const [set, setSet] = useState<MatchSetInput | null>(null);
  const [draft, setDraft] = useState<SeasonDraft | null>(null);
  const [maps, setMaps] = useState<MapOption[]>([]);
  const [heroes, setHeroes] = useState<HeroItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [durationDraft, setDurationDraft] = useState("");
  const [metricDrafts, setMetricDrafts] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<DetailTab>("bans");
  const [activeSubareaTabId, setActiveSubareaTabId] = useState("");
  const [activeHybridTurnId, setActiveHybridTurnId] = useState("");
  const [showAddSubareaPicker, setShowAddSubareaPicker] = useState(false);
  const [heroPickerTarget, setHeroPickerTarget] = useState<{ kind: "player"; id: string; subareaId: string | null; turnTeamId?: string } | { kind: "ban"; index: number } | null>(null);
  const [heroSearch, setHeroSearch] = useState("");
  const [heroRole, setHeroRole] = useState("ALL");
  const [heroTeamsReversed, setHeroTeamsReversed] = useState(false);

  // 세트마다 출전 팀의 모든 선수를 표에 배치하고 저장된 기록을 복원한다.
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    Promise.all([
      fetch(`/api/matches?seasonId=${encodeURIComponent(seasonId)}`, { signal: controller.signal }),
      fetch(`/api/seasons/${encodeURIComponent(seasonId)}/draft`, { signal: controller.signal }),
      fetch(`/api/seasons/${encodeURIComponent(seasonId)}/maps`, { signal: controller.signal }),
      fetch("/api/heroes", { signal: controller.signal }),
    ]).then(async ([matchResponse, draftResponse, mapsResponse, heroesResponse]) => {
      const [matchResult, draftResult, mapResult, heroResult] = await Promise.all([
        matchResponse.json() as Promise<ApiResult<MatchRecord[]>>,
        draftResponse.json() as Promise<ApiResult<SeasonDraft>>,
        mapsResponse.json() as Promise<ApiResult<MapOption[]>>,
        heroesResponse.json() as Promise<ApiResult<HeroItem[]>>,
      ]);
      if (!matchResult.success || !draftResult.success || !mapResult.success || !heroResult.success) throw new Error(matchResult.message || draftResult.message || mapResult.message || heroResult.message || "세트 정보를 불러오지 못했습니다.");
      const foundMatch = matchResult.data?.find((item) => item.id === matchId);
      const foundSet = foundMatch?.sets.find((item) => item.id === setId);
      if (!foundMatch || !foundSet) throw new Error("세트 기록을 찾을 수 없습니다. 세트 목록에서 다시 선택해주세요.");
      const teamIds = new Set([foundMatch.teamAId, foundMatch.teamBId]);
      const teamByPlayer = new Map((draftResult.data?.teams ?? []).flatMap((team) => team.members.map((id) => [id, team.id] as const)));
      const rosterIds = new Set((draftResult.data?.participants ?? []).filter((player) => teamIds.has(teamByPlayer.get(player.streamerId) || "") && !player.roles.includes("COACH")).map((player) => player.streamerId));
      const savedById = new Map(foundSet.stats.map((stat) => [stat.streamerId, stat]));
      const stats = [...rosterIds].map((id) => ({ ...newStat(id), ...savedById.get(id), usedHeroIds: savedById.get(id)?.usedHeroIds ?? [], usedHeroSubareas: savedById.get(id)?.usedHeroSubareas ?? {}, usedHeroTurns: savedById.get(id)?.usedHeroTurns ?? {} }));
      setMatch(foundMatch);
      setSet({ ...foundSet, teamAColor: foundSet.teamAColor ?? "BLUE", mapSubareaResults: foundSet.mapSubareaResults ?? {}, stats });
      setDurationDraft(formatGameDuration(foundSet.gameDurationSeconds));
      setDraft(draftResult.data ?? null);
      setMaps(mapResult.data ?? []);
      setHeroes(heroResult.data ?? []);
    }).catch((cause: unknown) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "세트 정보를 불러오지 못했습니다."); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [seasonId, matchId, setId]);

  const teams = useMemo(() => draft?.teams ?? [], [draft]);
  const participants = useMemo(() => new Map((draft?.participants ?? []).map((player) => [player.streamerId, player])), [draft]);
  const teamA = teams.find((team) => team.id === match?.teamAId);
  const teamB = teams.find((team) => team.id === match?.teamBId);
  const mapName = maps.find((map) => map.id === set?.mapId)?.nameKr ?? "맵 미지정";
  const isHybridMap = maps.find((map) => map.id === set?.mapId)?.mode === "HYBRID";
  const isPushMap = maps.find((map) => map.id === set?.mapId)?.mode === "PUSH";
  const firstAttackTeamId = set?.hybridFirstAttackTeamId ?? null;
  const hybridTurnIds = firstAttackTeamId && match ? [firstAttackTeamId, firstAttackTeamId === match.teamAId ? match.teamBId : match.teamAId, ...Object.keys(set?.hybridTurnResults ?? {}).filter((id) => /^turn-(?:[3-9]|[1-9]\d+)$/.test(id)).sort((a, b) => Number(a.slice(5)) - Number(b.slice(5)))] : [];
  const activeHybridTurn = hybridTurnIds.includes(activeHybridTurnId) ? activeHybridTurnId : hybridTurnIds[0];
  const activeAttackTeamId = set?.hybridTurnResults?.[activeHybridTurn]?.attackTeamId ?? activeHybridTurn;
  const mapSubareas = maps.find((map) => map.id === set?.mapId)?.subareas ?? [];
  const recordedSubareaIds = new Set([...(set ? Object.keys(set.mapSubareaResults ?? {}) : []), ...(set?.stats ?? []).flatMap((stat) => Object.values(stat.usedHeroSubareas ?? {}).flat())]);
  const recordedSubareas = mapSubareas.filter((area) => recordedSubareaIds.has(area.id)).sort((a, b) => (set?.mapSubareaResults?.[a.id]?.order ?? a.sortOrder) - (set?.mapSubareaResults?.[b.id]?.order ?? b.sortOrder));
  const availableSubareas = mapSubareas.filter((area) => !recordedSubareaIds.has(area.id));
  const hasUnassignedSubareaHeroes = (set?.stats ?? []).some((stat) => (stat.usedHeroIds ?? []).some((heroId) => !(stat.usedHeroSubareas?.[heroId] ?? []).some((id) => mapSubareas.some((area) => area.id === id))));
  const showUnassignedSubareaTab = mapSubareas.length > 0 && hasUnassignedSubareaHeroes;
  const activeSubarea = recordedSubareas.find((area) => area.id === activeSubareaTabId) ?? recordedSubareas[0] ?? null;
  const activeUnassignedSubarea = showUnassignedSubareaTab && activeSubareaTabId === unassignedSubareaTabId;
  const activeHeroSubareaId = activeUnassignedSubarea ? null : activeSubarea?.id ?? null;
  const backHref = `/admin/matches?seasonId=${encodeURIComponent(seasonId)}&matchId=${encodeURIComponent(matchId)}`;
  const pickerPlayer = heroPickerTarget?.kind === "player" ? participants.get(heroPickerTarget.id) : null;
  const pickerStat = heroPickerTarget?.kind === "player" ? set?.stats.find((stat) => stat.streamerId === heroPickerTarget.id) : null;
  const pickerBan = heroPickerTarget?.kind === "ban" ? set?.bans[heroPickerTarget.index] : null;
  const pickerHeroes = heroes.filter((hero) => (heroRole === "ALL" || hero.role === heroRole) && `${hero.nameKr} ${hero.nameEn}`.toLocaleLowerCase("ko-KR").includes(heroSearch.trim().toLocaleLowerCase("ko-KR")));
  const heroRoles = [...new Set(heroes.map((hero) => hero.role))];

  // 선수 전적이나 사용 영웅 선택을 지정 선수 행에 반영한다.
  const updateStat = (streamerId: string, patch: Partial<MatchStatInput>) => setSet((current) => current ? { ...current, stats: current.stats.map((stat) => stat.streamerId === streamerId ? { ...stat, ...patch } : stat) } : current);

  // 전투 수치를 입력 중에는 콤마 없이 편집하고 포커스를 벗어나면 천 단위로 표시한다.
  const renderMetricInput = (stat: MatchStatInput, playerName: string, metric: typeof metrics[number]) => {
    const draftKey = `${stat.streamerId}:${metric.key}`;
    return <input
      aria-label={`${playerName} ${metric.label}`}
      type="text"
      inputMode="numeric"
      pattern="[0-9,]*"
      disabled={saving}
      value={metricDrafts[draftKey] ?? stat[metric.key].toLocaleString("en-US")}
      onFocus={(event) => {
        setMetricDrafts((current) => ({ ...current, [draftKey]: String(stat[metric.key]) }));
        if (stat[metric.key] === 0) event.currentTarget.select();
      }}
      onChange={(event) => {
        const value = event.target.value.replace(/\D/g, "");
        setMetricDrafts((current) => ({ ...current, [draftKey]: value }));
        updateStat(stat.streamerId, { [metric.key]: value ? Number(value) : 0 });
      }}
      onBlur={() => setMetricDrafts((current) => {
        const next = { ...current };
        delete next[draftKey];
        return next;
      })}
      className={`${inputClass} px-1.5 py-1.5 text-center`}
    />;
  };

  // 선택 구역의 양 팀 점유율과 승리 팀을 세트 결과에 저장한다.
  const updateSubareaResult = (subareaId: string, patch: Partial<MapSubareaResultInput>) => setSet((current) => {
    if (!current) return current;
    const previous = current.mapSubareaResults?.[subareaId] ?? { teamAProgress: null, teamBProgress: null, winnerTeamId: null };
    return { ...current, mapSubareaResults: { ...(current.mapSubareaResults ?? {}), [subareaId]: { ...previous, ...patch } } };
  });

  // 거점이 100% 미만으로 내려가면 화물 거리를 비우고 과거 구간 진행률은 보존한다.
  const updateHybridTurnResult = (turnId: string, patch: { captureProgressPercent?: number | null; payloadDistanceMeters?: number | null }) => setSet((current) => current ? {
    ...current,
    hybridTurnResults: { ...(current.hybridTurnResults ?? {}), [turnId]: { ...(current.hybridTurnResults?.[turnId] ?? { points: null, progressPercent: null }), ...patch, ...(patch.captureProgressPercent !== undefined && patch.captureProgressPercent !== 100 ? { payloadDistanceMeters: null } : {}) } },
  } : current);

  // 경기에서 표시하는 순서대로 기존 구역을 고정하고 새 구역을 마지막 번호에 추가한다.
  const addSubareaResult = (subareaId: string) => {
    setSet((current) => {
      if (!current) return current;
      const mapSubareaResults = { ...(current.mapSubareaResults ?? {}) };
      recordedSubareas.forEach((area, index) => {
        const previous = mapSubareaResults[area.id] ?? { teamAProgress: null, teamBProgress: null, winnerTeamId: null };
        mapSubareaResults[area.id] = { ...previous, order: index };
      });
      mapSubareaResults[subareaId] = { order: recordedSubareas.length, teamAScore: 0, teamBScore: 0, teamAProgress: null, teamBProgress: null, winnerTeamId: null };
      return { ...current, mapSubareaResults };
    });
    setActiveSubareaTabId(subareaId);
    setShowAddSubareaPicker(false);
  };

  // 팀 선수 순서를 탱커·딜러·지원가로 묶고 각 역할 내부는 저장 순서로 정렬한다.
  const teamLineup = (teamId: string, stats = set?.stats ?? []) => {
    const memberIds = new Set(teams.find((team) => team.id === teamId)?.members ?? []);
    const roleRank = (streamerId: string) => {
      const position = participants.get(streamerId)?.position;
      return position === "TANK" ? 0 : position === "DAMAGE" ? 1 : position === "SUPPORT" || position === "HEALER" ? 2 : 3;
    };
    return stats.map((stat, index) => ({ stat, index })).filter(({ stat }) => memberIds.has(stat.streamerId)).sort((a, b) => roleRank(a.stat.streamerId) - roleRank(b.stat.streamerId) || (a.stat.lineupOrder ?? a.index) - (b.stat.lineupOrder ?? b.index) || a.index - b.index).map(({ stat }) => stat);
  };

  // 같은 팀·포지션의 공격 또는 지원 선수 순서를 바꾸고 기존 lineupOrder에 기록한다.
  const moveRolePlayer = (teamId: string, streamerId: string, role: "DAMAGE" | "SUPPORT", direction: -1 | 1) => setSet((current) => {
    if (!current) return current;
    const roleIds = teamLineup(teamId, current.stats).filter((stat) => {
      const position = participants.get(stat.streamerId)?.position;
      return role === "SUPPORT" ? position === "SUPPORT" || position === "HEALER" : position === "DAMAGE";
    }).map((stat) => stat.streamerId);
    const index = roleIds.indexOf(streamerId);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= roleIds.length) return current;
    [roleIds[index], roleIds[targetIndex]] = [roleIds[targetIndex], roleIds[index]];
    const orderById = new Map(roleIds.map((id, order) => [id, order]));
    return { ...current, stats: current.stats.map((stat) => orderById.has(stat.streamerId) ? { ...stat, lineupOrder: orderById.get(stat.streamerId)! } : stat) };
  });

  // 기존 두 턴을 유지하면서 다음 공격 턴을 새 키로 추가하고 직전 수비 팀을 공격 팀으로 지정한다.
  const addHybridTurn = () => {
    if (!match || !set || !hybridTurnIds.length) return;
    const turnId = `turn-${hybridTurnIds.length + 1}`;
    const lastTurnId = hybridTurnIds[hybridTurnIds.length - 1];
    const lastAttackTeamId = set.hybridTurnResults?.[lastTurnId]?.attackTeamId ?? lastTurnId;
    const attackTeamId = lastAttackTeamId === match.teamAId ? match.teamBId : match.teamAId;
    setSet((current) => current ? { ...current, hybridTurnResults: { ...(current.hybridTurnResults ?? {}), [turnId]: { attackTeamId, points: null, progressPercent: null } } } : current);
    setActiveHybridTurnId(turnId);
  };

  // 사용 영웅 모달은 다중 선택으로 토글하고 밴 슬롯은 하나를 지정한 뒤 닫는다.
  const choosePickerHero = (heroId: string) => {
    if (heroPickerTarget?.kind === "ban") {
      const index = heroPickerTarget.index;
      setSet((current) => current ? { ...current, bans: current.bans.map((ban, at) => at === index ? { ...ban, heroId } : ban) } : current);
      setHeroPickerTarget(null);
      return;
    }
    if (pickerStat) {
      const current = pickerStat.usedHeroIds ?? [];
      const subareas = { ...(pickerStat.usedHeroSubareas ?? {}) };
      const targetSubareaId = heroPickerTarget?.kind === "player" ? heroPickerTarget.subareaId : null;
      const turnTeamId = heroPickerTarget?.kind === "player" ? heroPickerTarget.turnTeamId : undefined;
      if (turnTeamId) {
        const usedHeroTurns = { ...(pickerStat.usedHeroTurns ?? {}) };
        const turnHeroes = usedHeroTurns[turnTeamId] ?? [];
        usedHeroTurns[turnTeamId] = turnHeroes.includes(heroId) ? turnHeroes.filter((id) => id !== heroId) : [...turnHeroes, heroId];
        updateStat(pickerStat.streamerId, { usedHeroIds: current.includes(heroId) ? current : [...current, heroId], usedHeroTurns });
      } else if (targetSubareaId) {
        const heroSubareas = subareas[heroId] ?? [];
        if (heroSubareas.includes(targetSubareaId)) {
          const remaining = heroSubareas.filter((id) => id !== targetSubareaId);
          if (remaining.length) subareas[heroId] = remaining;
          else delete subareas[heroId];
          updateStat(pickerStat.streamerId, { usedHeroIds: remaining.length ? current : current.filter((id) => id !== heroId), usedHeroSubareas: subareas });
        } else {
          subareas[heroId] = [...heroSubareas, targetSubareaId];
          updateStat(pickerStat.streamerId, { usedHeroIds: current.includes(heroId) ? current : [...current, heroId], usedHeroSubareas: subareas });
        }
      } else if (current.includes(heroId)) {
        delete subareas[heroId];
        updateStat(pickerStat.streamerId, { usedHeroIds: current.filter((id) => id !== heroId), usedHeroSubareas: subareas });
      } else updateStat(pickerStat.streamerId, { usedHeroIds: [...current, heroId], usedHeroSubareas: { ...subareas, [heroId]: [] } });
    }
  };

  // 선택 세트만 저장하고 최신 서버 결과의 선수별 영웅 연결을 화면에 복원한다.
  const save = async () => {
    if (!match || !set || saving) return;
    if (set.bans.length !== 4 || set.bans.some((ban) => !ban.heroId)) { setActiveTab("bans"); setError("고정된 4개 밴 슬롯에 영웅을 모두 선택해주세요."); return; }
    const gameDurationSeconds = parseGameDuration(durationDraft);
    if (gameDurationSeconds === undefined) { setError("경기 시간은 분:초 형식으로 입력해주세요. 예: 8:56"); return; }
    setSaving(true); setError("");
    try {
      const setToSave = { ...set, gameDurationSeconds };
      const response = await fetch("/api/matches", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: match.id, scope: "setDetail", data: { set: setToSave } }) });
      const result = await response.json() as ApiResult<MatchRecord>;
      if (!result.success || !result.data) throw new Error(result.message || "세트 상세 기록을 저장하지 못했습니다.");
      const updatedMatch = result.data;
      const updatedSet = updatedMatch.sets.find((item) => item.id === set.id);
      if (!updatedSet) throw new Error("저장 결과에서 세트 기록을 찾지 못했습니다.");
      setMatch(updatedMatch); setSet(updatedSet); setDurationDraft(formatGameDuration(updatedSet.gameDurationSeconds)); setMetricDrafts({}); showFeedback("세트 상세 기록을 저장했습니다.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "세트 상세 기록을 저장하지 못했습니다."); }
    finally { setSaving(false); }
  };

  // 선수별 전투 수치와 POTG를 입력하는 표를 표시한다.
  const renderTeam = (teamId: string, name: string, tone: TeamColor) => {
    const rows = teamLineup(teamId);
    const theme = tone === "BLUE" ? { head: "bg-sky-800 text-sky-50", row: "bg-sky-50/80 dark:bg-sky-950/30", accent: "text-sky-700 dark:text-sky-300", border: "border-sky-200 dark:border-sky-900" } : { head: "bg-rose-800 text-rose-50", row: "bg-rose-50/80 dark:bg-rose-950/30", accent: "text-rose-700 dark:text-rose-300", border: "border-rose-200 dark:border-rose-900" };
    return <section key={teamId} className={`overflow-hidden rounded-2xl border ${theme.border}`}>
      <header className={`flex items-center px-4 py-3 ${theme.head}`}><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-75">{tone} TEAM</p><h2 className="mt-0.5 text-base font-black">{name}</h2></div></header>
      <div className="overflow-x-auto"><table className="w-full min-w-[960px] border-collapse text-xs"><thead className="bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400"><tr><th className="w-48 px-3 py-2 text-left">선수</th>{metrics.map((metric) => <th key={metric.key} className="w-24 px-1.5 py-2 text-center">{metric.label}</th>)}<th className="w-20 px-2 py-2 text-center">POTG</th></tr></thead><tbody>{rows.map((stat) => {
        const player = participants.get(stat.streamerId);
        return <tr key={stat.streamerId} className={`border-t ${theme.border} ${theme.row}`}><td className="px-3 py-2"><div className="flex items-center gap-2"><AdminAvatar name={player?.name ?? "선수"} profileImg={player?.profileImg} size="h-9 w-9 text-[10px]" /><div><p className="font-bold">{player?.name ?? "등록 선수"}</p><p className={`text-[10px] ${theme.accent}`}>{player?.position ? roleLabels[player.position] ?? player.position : "역할 미지정"}</p></div></div></td>{metrics.map((metric) => <td key={metric.key} className="px-1.5 py-2">{renderMetricInput(stat, player?.name ?? stat.streamerId, metric)}</td>)}<td className="px-2 py-2 text-center"><input type="checkbox" aria-label={`${player?.name ?? "선수"} POTG`} checked={stat.isPotg} disabled={saving} onChange={(event) => setSet((current) => current ? { ...current, stats: current.stats.map((item) => ({ ...item, isPotg: item.streamerId === stat.streamerId ? event.target.checked : event.target.checked ? false : item.isPotg })) } : current)} className="h-4 w-4 accent-amber-500" /></td></tr>;
      })}{!rows.length && <tr><td colSpan={metrics.length + 2} className="p-8 text-center text-sm text-slate-500">이 팀에 등록된 선수가 없습니다.</td></tr>}</tbody></table></div>
    </section>;
  };

  // 가로로 정렬한 선수 카드마다 해당 구역에서 사용한 영웅을 세로로 표시한다.
  const renderHeroTeam = (teamId: string, name: string, tone: TeamColor, subareaId: string | null, unassigned = false) => {
    const rows = teamLineup(teamId);
    const roleIds = (role: "DAMAGE" | "SUPPORT") => rows.filter((stat) => {
      const position = participants.get(stat.streamerId)?.position;
      return role === "SUPPORT" ? position === "SUPPORT" || position === "HEALER" : position === "DAMAGE";
    }).map((stat) => stat.streamerId);
    const theme = tone === "BLUE" ? { head: "bg-sky-800 text-sky-50", card: "bg-sky-50/80 dark:bg-sky-950/30", accent: "text-sky-700 dark:text-sky-300", border: "border-sky-200 dark:border-sky-900" } : { head: "bg-rose-800 text-rose-50", card: "bg-rose-50/80 dark:bg-rose-950/30", accent: "text-rose-700 dark:text-rose-300", border: "border-rose-200 dark:border-rose-900" };
    return <section key={teamId} className={`min-w-0 overflow-hidden rounded-2xl border ${theme.border}`}>
      <header className={`flex min-h-16 items-center justify-center px-4 py-3 text-center ${theme.head}`}><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-75">{tone} TEAM</p><h3 className="text-sm font-black">{name}</h3></div></header>
      <div className="overflow-x-auto"><div className="flex min-w-full divide-x divide-slate-200 dark:divide-slate-800">{rows.map((stat) => {
        const player = participants.get(stat.streamerId);
        const heroIds = (stat.usedHeroIds ?? []).filter((id) => { const areas = stat.usedHeroSubareas?.[id] ?? []; return !mapSubareas.length || (unassigned ? !areas.some((areaId) => mapSubareas.some((area) => area.id === areaId)) : Boolean(subareaId && areas.includes(subareaId))); });
        const role = player?.position === "DAMAGE" ? "DAMAGE" : player?.position === "SUPPORT" || player?.position === "HEALER" ? "SUPPORT" : null;
        const peers = role ? roleIds(role) : [];
        const roleIndex = peers.indexOf(stat.streamerId);
        return <article key={stat.streamerId} className={`flex min-w-[112px] flex-1 flex-col items-center gap-2 px-2 py-3 ${theme.card}`}>
          <div className="flex w-full items-center justify-center gap-1"><AdminAvatar name={player?.name ?? "선수"} profileImg={player?.profileImg} size="h-8 w-8 text-[9px]" /><div className="min-w-0 text-center"><p className="truncate text-[11px] font-bold">{player?.name ?? "등록 선수"}</p><p className={`text-[9px] ${theme.accent}`}>{player?.position ? roleLabels[player.position] ?? player.position : "역할 미지정"}</p></div></div>
          {role && roleIndex >= 0 && peers.length > 1 && <div className="flex gap-1"><button type="button" disabled={saving || roleIndex === 0} aria-label={`${player?.name ?? "선수"} 왼쪽으로 이동`} onClick={() => moveRolePlayer(teamId, stat.streamerId, role, -1)} className="rounded border border-slate-300 p-1 disabled:opacity-30 dark:border-slate-700"><ChevronLeft size={13} /></button><button type="button" disabled={saving || roleIndex === peers.length - 1} aria-label={`${player?.name ?? "선수"} 오른쪽으로 이동`} onClick={() => moveRolePlayer(teamId, stat.streamerId, role, 1)} className="rounded border border-slate-300 p-1 disabled:opacity-30 dark:border-slate-700"><ChevronRight size={13} /></button></div>}
          <div className="flex min-h-12 w-full flex-col items-center gap-1.5">{heroIds.map((heroId) => { const hero = heroes.find((item) => item.id === heroId); return <button key={heroId} type="button" disabled={saving} title={`${hero?.nameKr ?? "영웅"} 제거`} aria-label={`${player?.name ?? "선수"} ${hero?.nameKr ?? "영웅"} 제거`} onClick={() => { const usedHeroSubareas = { ...(stat.usedHeroSubareas ?? {}) }; if (!mapSubareas.length || unassigned) { delete usedHeroSubareas[heroId]; updateStat(stat.streamerId, { usedHeroIds: (stat.usedHeroIds ?? []).filter((id) => id !== heroId), usedHeroSubareas }); return; } const remaining = (usedHeroSubareas[heroId] ?? []).filter((id) => id !== subareaId); if (remaining.length) usedHeroSubareas[heroId] = remaining; else delete usedHeroSubareas[heroId]; updateStat(stat.streamerId, { usedHeroIds: remaining.length ? stat.usedHeroIds ?? [] : (stat.usedHeroIds ?? []).filter((id) => id !== heroId), usedHeroSubareas }); }} className="group relative h-12 w-12 overflow-hidden rounded-md border border-amber-500 bg-amber-500/10">{hero?.imageUrl ? <img src={hero.imageUrl} alt={hero.nameKr} className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center text-[9px] font-bold">{hero?.nameKr.slice(0, 2) ?? "?"}</span>}<span className="absolute inset-0 hidden items-center justify-center bg-black/60 text-white group-hover:flex"><X size={12} /></span></button>; })}<button type="button" disabled={saving || !heroes.length} onClick={() => { setHeroPickerTarget({ kind: "player", id: stat.streamerId, subareaId: unassigned || !mapSubareas.length ? null : subareaId }); setHeroSearch(""); setHeroRole("ALL"); }} className={`inline-flex items-center gap-1 rounded-md border border-dashed px-2 py-1.5 text-[10px] font-bold ${theme.accent} ${theme.border}`}><Plus size={12} />영웅 추가</button></div>
        </article>;
      })}{!rows.length && <p className="p-8 text-sm text-slate-500">이 팀에 등록된 선수가 없습니다.</p>}</div></div>
    </section>;
  };

  // 혼합맵의 선택한 턴에 각 선수의 역할·자리 이동과 사용 영웅을 표시한다.
  const renderHybridTeam = (teamId: string, name: string, turnId: string, attackTeamId: string) => {
    const rows = teamLineup(teamId);
    const roleIds = (role: "DAMAGE" | "SUPPORT") => rows.filter((stat) => { const position = participants.get(stat.streamerId)?.position; return role === "SUPPORT" ? position === "SUPPORT" || position === "HEALER" : position === "DAMAGE"; }).map((stat) => stat.streamerId);
    return <section className="min-w-0 rounded-xl border border-slate-200 dark:border-slate-700">
      <h3 className="rounded-t-xl bg-slate-900 px-3 py-2 text-center text-sm font-bold text-white">{name} · {teamId === attackTeamId ? "공격" : "수비"}</h3>
      <div className="flex min-w-0 overflow-x-auto p-2">{rows.map((stat) => {
        const player = participants.get(stat.streamerId);
        const role = player?.position === "DAMAGE" ? "DAMAGE" : player?.position === "SUPPORT" || player?.position === "HEALER" ? "SUPPORT" : null;
        const peers = role ? roleIds(role) : [];
        const roleIndex = peers.indexOf(stat.streamerId);
        return <div key={stat.streamerId} className="flex min-w-28 flex-1 flex-col items-center gap-2 border-r border-slate-200 px-2 py-2 last:border-r-0 dark:border-slate-700">
          <div className="flex items-center gap-1"><AdminAvatar name={player?.name ?? "선수"} profileImg={player?.profileImg} size="h-8 w-8 text-[9px]" /><div className="min-w-0 text-center"><p className="truncate text-xs font-bold">{player?.name ?? "등록 선수"}</p><p className="text-[9px] text-slate-500">{player?.position ? roleLabels[player.position] ?? player.position : "역할 미지정"}</p></div></div>
          {role && roleIndex >= 0 && peers.length > 1 && <div className="flex gap-1"><button type="button" disabled={saving || roleIndex === 0} aria-label={`${player?.name ?? "선수"} 왼쪽으로 이동`} onClick={() => moveRolePlayer(teamId, stat.streamerId, role, -1)} className="rounded border border-slate-300 p-1 disabled:opacity-30 dark:border-slate-700"><ChevronLeft size={13} /></button><button type="button" disabled={saving || roleIndex === peers.length - 1} aria-label={`${player?.name ?? "선수"} 오른쪽으로 이동`} onClick={() => moveRolePlayer(teamId, stat.streamerId, role, 1)} className="rounded border border-slate-300 p-1 disabled:opacity-30 dark:border-slate-700"><ChevronRight size={13} /></button></div>}
          <div className="flex min-h-12 flex-col items-center gap-1">{(stat.usedHeroTurns?.[turnId] ?? []).map((heroId) => {
            const hero = heroes.find((item) => item.id === heroId);
            return <button key={heroId} type="button" disabled={saving} aria-label={`${player?.name ?? "선수"} ${hero?.nameKr ?? "영웅"} 제거`} onClick={() => updateStat(stat.streamerId, { usedHeroTurns: { ...(stat.usedHeroTurns ?? {}), [turnId]: (stat.usedHeroTurns?.[turnId] ?? []).filter((id) => id !== heroId) } })} className="h-11 w-11 overflow-hidden rounded-md border border-amber-500">{hero?.imageUrl ? <img src={hero.imageUrl} alt={hero.nameKr} className="h-full w-full object-cover" /> : hero?.nameKr ?? "영웅"}</button>;
          })}</div>
          <button type="button" disabled={saving} onClick={() => { setHeroPickerTarget({ kind: "player", id: stat.streamerId, subareaId: null, turnTeamId: turnId }); setHeroSearch(""); setHeroRole("ALL"); }} className="rounded border border-dashed border-amber-500 px-2 py-1 text-[10px] font-bold text-amber-600">영웅 추가</button>
        </div>;
      })}</div>
    </section>;
  };


  const teamAColor = set?.teamAColor ?? "BLUE";
  const teamBColor: TeamColor = teamAColor === "BLUE" ? "RED" : "BLUE";
  // 직전 세트 패배 팀이 1·4번, 상대 팀이 2·3번 밴하도록 기본 슬롯을 정한다.
  const defaultBanTeam = (index: number) => {
    if (!match || !set) return "";
    const first = getFirstBanTeam(match.teamAId, match.teamBId, set.setNumber, match.sets) ?? match.teamBId;
    return index === 0 || index === 3 ? first : first === match.teamAId ? match.teamBId : match.teamAId;
  };
  // 저장된 팀 배정을 우선하고, 아직 만들지 않은 슬롯은 기본 순서로 표시한다.
  const banTeamFor = (index: number) => set?.bans[index]?.teamId ?? defaultBanTeam(index);
  // 네 밴 슬롯의 팀 배정을 바꾸되 각 순번의 영웅 선택은 유지한다.
  const swapBanOrder = () => {
    if (!set || !match || saving) return;
    const defaultTeamIds = Array.from({ length: 4 }, (_, index) => banTeamFor(index));
    setSet((current) => current ? {
      ...current,
      bans: swapBanTeamAssignments(current.bans, defaultTeamIds, match.teamAId, match.teamBId),
    } : current);
  };
  // 탱커·딜러·지원가 밴 수를 세며 HEALER 코드는 지원가에 합산한다.
  const banRoleCount = (role: string) => {
    const targetIndex = heroPickerTarget?.kind === "ban" ? heroPickerTarget.index : -1;
    const group = role === "HEALER" ? "SUPPORT" : role;
    return (set?.bans ?? []).reduce((count, ban, index) => {
      if (index === targetIndex) return count;
      const banRole = heroes.find((hero) => hero.id === ban.heroId)?.role;
      return count + (banRole && (banRole === "HEALER" ? "SUPPORT" : banRole) === group ? 1 : 0);
    }, 0);
  };
  // 밴 번호를 눌렀을 때 해당 슬롯으로 영웅 선택 모달을 연다.
  const openBanPicker = (index: number) => {
    if (!match || !set) return;
    if (!getFirstBanTeam(match.teamAId, match.teamBId, set.setNumber, match.sets) && !set.bans[index]) { setError("직전 세트의 승리 팀을 먼저 지정해주세요."); return; }
    setSet((current) => {
      if (!current || current.bans.length > index) return current;
      const bans = [...current.bans];
      while (bans.length <= index) bans.push({ teamId: defaultBanTeam(bans.length), heroId: "" });
      return { ...current, bans };
    });
    setHeroPickerTarget({ kind: "ban", index }); setHeroSearch(""); setHeroRole("ALL");
  };
  // 밴 팀별 번호 슬롯을 이미지 보드처럼 좌우 패널로 그린다.
  const renderBanTeam = (teamId: string, teamName: string, tone: TeamColor) => {
    if (!match) return null;
    const theme = tone === "BLUE"
      ? { panel: "border-sky-500/30 bg-sky-950/5 dark:bg-sky-950/20", header: "bg-sky-800", empty: "border-sky-500/50 bg-sky-50 hover:border-sky-500 dark:bg-sky-950/30", emptyText: "text-sky-700 dark:text-sky-300", number: "bg-sky-800" }
      : { panel: "border-rose-500/30 bg-rose-950/5 dark:bg-rose-950/20", header: "bg-rose-800", empty: "border-rose-500/50 bg-rose-50 hover:border-rose-500 dark:bg-rose-950/30", emptyText: "text-rose-700 dark:text-rose-300", number: "bg-rose-800" };
    const count = 4;
    const slots = Array.from({ length: count }, (_, index) => index).filter((index) => banTeamFor(index) === teamId);
    return <section className={`overflow-hidden rounded-2xl border ${theme.panel}`}>
      <header className={`flex items-center justify-center px-3 py-3 text-center text-white ${theme.header}`}><div><p className="text-[10px] font-bold uppercase tracking-[0.15em] opacity-70">{tone} TEAM</p><h3 className="truncate text-sm font-black">{teamName}</h3></div></header>
      <div className="grid grid-cols-2 gap-2 p-3">{slots.map((index) => {
        const ban = set?.bans[index];
        const hero = heroes.find((item) => item.id === ban?.heroId);
        return <div key={index} className="min-w-0 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <button type="button" disabled={saving} onClick={() => openBanPicker(index)} aria-haspopup="dialog" aria-label={`${index + 1}번 밴 영웅 선택`} className={`group relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-lg border-2 transition ${hero ? "border-amber-400" : `border-dashed ${theme.empty}`}`}>
            {hero?.imageUrl ? <img src={hero.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-105" /> : null}
            {hero?.imageUrl ? <span className="absolute inset-0 bg-slate-950/20" /> : null}
            <span className={`absolute left-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-md text-base font-black tabular-nums text-white ${hero ? "bg-slate-950/75" : theme.number}`}>{index + 1}</span>
            {!hero && <span className={`text-xs font-bold ${theme.emptyText}`}>영웅 선택</span>}
            {hero && <span className="absolute inset-x-0 bottom-0 truncate bg-slate-950/80 px-2 py-1 text-center text-xs font-black text-white">{hero.nameKr}</span>}
          </button>
        </div>;
      })}</div>
    </section>;
  };

  return <section className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto pb-4 text-slate-900 dark:text-slate-100">
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-slate-800/10 p-4 md:p-5">
      <div className="flex items-center gap-3"><Link href={backHref} aria-label="경기 기록 관리로 돌아가기" className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-amber-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"><ArrowLeft size={17} /></Link><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f99e1a] text-slate-950"><Swords size={18} aria-hidden="true" /></span><div><h1 className="text-sm font-black md:text-base">세트 상세 기록</h1><p className="mt-0.5 text-xs text-slate-500">{match ? `${match.tournamentStage} · ${match.teamAName} vs ${match.teamBName} · ${set?.setNumber}세트` : "세트별 경기 결과와 선수 데이터를 입력합니다."}</p></div></div>
      <div className="flex gap-2"><Link href={backHref} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">목록으로</Link><button type="button" disabled={!match || !set || loading || saving} onClick={() => void save()} className="inline-flex items-center gap-1.5 rounded-lg bg-[#f99e1a] px-4 py-2 text-xs font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">{saving ? <><LoaderCircle size={14} className="animate-spin" />저장 중...</> : <><Check size={14} />기록 저장</>}</button></div>
    </header>
    {saving && <div role="status" aria-live="polite" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-5 text-sm font-bold text-slate-900 shadow-2xl dark:bg-slate-900 dark:text-white"><LoaderCircle size={24} className="animate-spin text-amber-500" />세트 기록 저장 중...</div></div>}
    {error && <p role="alert" className="shrink-0 rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>}
    {loading ? <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-[#111726]">세트 기록을 불러오는 중...</div> : match && set ? <>
      <section className="grid shrink-0 gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#111726] sm:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900"><p className="text-[10px] font-bold text-slate-400">경기</p><p className="mt-1 truncate text-sm font-bold">{match.teamAName} <span className="mx-1 text-amber-500">VS</span> {match.teamBName}</p></div>
        <label className="flex min-w-0 items-center gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-900"><MapPin size={15} className="shrink-0 text-amber-500" /><span className="min-w-0 flex-1"><span className="block text-[10px] font-bold text-slate-400">맵</span><select value={set.mapId ?? ""} disabled={saving} onChange={(event) => { const mapId = event.target.value || null; const mapMode = maps.find((map) => map.id === mapId)?.mode; if (mapMode === "HYBRID" || mapMode === "PUSH") setActiveTab("matchData"); else if (!maps.find((map) => map.id === mapId)?.subareas?.length) setActiveTab("stats"); setSet((current) => { return current ? { ...current, mapId, hybridFirstAttackTeamId: mapId === current.mapId ? current.hybridFirstAttackTeamId ?? null : null, hybridTurnResults: mapId === current.mapId ? current.hybridTurnResults ?? {} : {}, mapSubareaId: mapId === current.mapId ? current.mapSubareaId ?? null : null, mapSubareaResults: mapId === current.mapId ? current.mapSubareaResults ?? {} : {}, stats: mapId === current.mapId ? current.stats : current.stats.map((stat) => ({ ...stat, usedHeroSubareas: {}, usedHeroTurns: {} })), teamAPushDistanceMeters: mapId === current.mapId ? current.teamAPushDistanceMeters ?? null : null, teamBPushDistanceMeters: mapId === current.mapId ? current.teamBPushDistanceMeters ?? null : null, winnerTeamId: mapId ? current.winnerTeamId : null } : current; }); }} className="mt-1 w-full bg-transparent text-sm font-bold outline-none"><option value="">맵 선택</option>{maps.map((map) => <option key={map.id} value={map.id}>{map.nameKr}</option>)}</select></span></label>
        {isHybridMap && <label className="min-w-0 rounded-xl bg-slate-50 p-3 dark:bg-slate-900"><span className="block text-[10px] font-bold text-slate-400">선공 팀</span><select disabled={saving} value={set.hybridFirstAttackTeamId ?? ""} onChange={(event) => setSet((current) => current ? { ...current, hybridFirstAttackTeamId: event.target.value || null } : current)} className="mt-1 w-full bg-transparent text-sm font-bold outline-none"><option value="">선택</option><option value={match.teamAId}>{match.teamAName}</option><option value={match.teamBId}>{match.teamBName}</option></select></label>}

        <label className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-900"><span className="min-w-0 flex-1"><span className="block text-[10px] font-bold text-slate-400">세트 승리팀</span><select value={set.winnerTeamId ?? ""} disabled={saving || !set.mapId} onChange={(event) => setSet((current) => current ? { ...current, winnerTeamId: event.target.value || null } : current)} className="mt-1 w-full bg-transparent text-sm font-bold outline-none"><option value="">미정</option>{[match.teamAId, match.teamBId].map((id) => <option key={id} value={id}>{id === match.teamAId ? match.teamAName : match.teamBName}</option>)}</select></span></label>
        <label className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-900"><Clock3 size={15} className="shrink-0 text-amber-500" /><span className="min-w-0 flex-1"><span className="block text-[10px] font-bold text-slate-400">경기 시간 (분:초)</span><input type="text" inputMode="numeric" pattern="[0-9:]*" disabled={saving} value={durationDraft} onChange={(event) => { const value = event.target.value.replace(/[^\d:]/g, ""); setDurationDraft(value); const seconds = parseGameDuration(value); if (seconds !== undefined) setSet((current) => current ? { ...current, gameDurationSeconds: seconds } : current); }} onBlur={() => { const seconds = parseGameDuration(durationDraft); if (seconds !== undefined) setDurationDraft(formatGameDuration(seconds)); }} placeholder="예: 8:56" className="mt-1 w-full bg-transparent text-sm font-bold outline-none" /></span></label>
        {!isHybridMap && <label className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900"><span className="block text-[10px] font-bold text-slate-400">A팀 색상</span><span className="mt-1 flex gap-1"><button type="button" disabled={saving} onClick={() => setSet((current) => current ? { ...current, teamAColor: "BLUE" } : current)} className={`flex-1 rounded-md px-2 py-1 text-[10px] font-bold ${teamAColor === "BLUE" ? "bg-sky-700 text-white" : "bg-white text-slate-500 dark:bg-slate-800"}`}>블루</button><button type="button" disabled={saving} onClick={() => setSet((current) => current ? { ...current, teamAColor: "RED" } : current)} className={`flex-1 rounded-md px-2 py-1 text-[10px] font-bold ${teamAColor === "RED" ? "bg-rose-700 text-white" : "bg-white text-slate-500 dark:bg-slate-800"}`}>레드</button></span></label>}
        <label className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900"><span className="block text-[10px] font-bold text-slate-400">VOD 주소</span><input type="url" disabled={saving} value={set.vodUrl} onChange={(event) => setSet((current) => current ? { ...current, vodUrl: event.target.value } : current)} placeholder="https://..." className="mt-1 w-full bg-transparent text-sm outline-none" /></label>
      </section>
      <section className="shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#111726]">
        <nav aria-label="세트 기록 입력 탭" className="flex border-b border-slate-200 dark:border-slate-800"><button type="button" onClick={() => setActiveTab("bans")} className={`inline-flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold ${activeTab === "bans" ? "border-amber-500 text-amber-600 dark:text-amber-400" : "border-transparent text-slate-500"}`}><Ban size={15} />밴 기록</button><button type="button" onClick={() => setActiveTab("matchData")} className={`inline-flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold ${activeTab === "matchData" ? "border-amber-500 text-amber-600 dark:text-amber-400" : "border-transparent text-slate-500"}`}><MapPin size={15} />경기 데이터</button><button type="button" onClick={() => setActiveTab("stats")} className={`inline-flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold ${activeTab === "stats" ? "border-amber-500 text-amber-600 dark:text-amber-400" : "border-transparent text-slate-500"}`}><Swords size={15} />선수 데이터</button></nav>
        {activeTab === "bans" ? <div className="space-y-3 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="text-sm font-bold">영웅 밴 순서</h2><p className="mt-1 text-xs text-slate-500">네 칸에서 번호를 눌러 영웅을 지정하거나 밴 순서를 변경하세요. 각 포지션은 최대 두 번까지 밴할 수 있습니다.</p></div><button type="button" disabled={saving} onClick={swapBanOrder} className="rounded-lg border border-amber-500/50 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-950/70">밴 순서 변경</button></div>
          <div className="grid items-stretch gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(180px,0.7fr)_minmax(0,1fr)]">
            {renderBanTeam(match.teamAId, teamA?.name ?? match.teamAName, teamAColor)}
            <div className="flex min-h-44 flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 bg-cover bg-center p-4 text-center dark:border-slate-700" style={maps.find((map) => map.id === set.mapId)?.imageUrl ? { backgroundImage: `linear-gradient(rgba(2,6,23,.55),rgba(2,6,23,.78)),url("${maps.find((map) => map.id === set.mapId)?.imageUrl}")` } : undefined}><span className="rounded-full border border-white/30 bg-black/35 px-3 py-1 text-[10px] font-black tracking-[0.2em] text-white">MAP</span><p className="text-xl font-black text-white drop-shadow">{mapName}</p><div className="flex flex-wrap justify-center gap-2 text-[10px] font-bold"><span className={`rounded px-2 py-1 ${teamAColor === "BLUE" ? "bg-sky-500 text-white" : "bg-rose-500 text-white"}`}>{teamAColor} · {match.teamAName}</span><span className={`rounded px-2 py-1 ${teamBColor === "BLUE" ? "bg-sky-500 text-white" : "bg-rose-500 text-white"}`}>{teamBColor} · {match.teamBName}</span></div></div>
            {renderBanTeam(match.teamBId, teamB?.name ?? match.teamBName, teamBColor)}
          </div>
          {!set.bans.length && <p className="text-center text-xs text-slate-500">번호 슬롯을 누르면 해당 순번의 밴 기록이 만들어집니다.</p>}
        </div>
          : activeTab === "matchData" ? isHybridMap ? <div className="space-y-4 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="text-sm font-bold">공격·수비 턴별 경기 데이터</h2><p className="mt-1 text-xs text-slate-500">선공 팀을 정하고 각 턴에서 선수별 사용 영웅을 입력하세요.</p></div><button type="button" aria-label="영웅 입력 칸 좌우 전환" aria-pressed={heroTeamsReversed} onClick={() => setHeroTeamsReversed((current) => !current)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold dark:border-slate-700">영웅 칸 좌우 전환</button></div>
            {hybridTurnIds.length ? <>
              <div className="flex flex-wrap items-center gap-2"><nav aria-label="공격·수비 턴" className="flex min-w-0 flex-1 gap-2 overflow-x-auto border-b border-slate-200 dark:border-slate-800">{hybridTurnIds.map((turnId, turnIndex) => { const attackTeamId = set.hybridTurnResults?.[turnId]?.attackTeamId ?? turnId; return <button key={turnId} type="button" onClick={() => setActiveHybridTurnId(turnId)} className={`shrink-0 border-b-2 px-4 py-2 text-sm font-bold ${activeHybridTurn === turnId ? "border-amber-500 text-amber-600" : "border-transparent text-slate-500"}`}>{turnIndex + 1}턴 · {attackTeamId === match.teamAId ? match.teamAName : match.teamBName} 공격 / {attackTeamId === match.teamAId ? match.teamBName : match.teamAName} 수비</button>; })}</nav><button type="button" disabled={saving} onClick={addHybridTurn} className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-amber-500/40 px-3 py-2 text-xs font-bold text-amber-700 dark:text-amber-300"><Plus size={14} />턴 추가</button></div>
              {activeHybridTurn.startsWith("turn-") && <label className="block max-w-xs text-xs font-bold">공격 팀<select disabled={saving} value={activeAttackTeamId} onChange={(event) => setSet((current) => current ? { ...current, hybridTurnResults: { ...(current.hybridTurnResults ?? {}), [activeHybridTurn]: { ...(current.hybridTurnResults?.[activeHybridTurn] ?? { points: null, progressPercent: null }), attackTeamId: event.target.value } } } : current)} className={`${inputClass} mt-1`}><option value={match.teamAId}>{match.teamAName}</option><option value={match.teamBId}>{match.teamBName}</option></select></label>}
              <div className="grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                <div className="min-w-0 rounded-lg bg-slate-950 p-3 text-center text-white"><label htmlFor="hybrid-capture-progress" className="text-[10px] font-bold text-sky-200">거점 진행률<span className="ml-1 text-sm">{set.hybridTurnResults?.[activeHybridTurn]?.captureProgressPercent ?? 0}%</span></label><input id="hybrid-capture-progress" type="range" min={0} max={100} disabled={saving} aria-label="거점 진행률" value={set.hybridTurnResults?.[activeHybridTurn]?.captureProgressPercent ?? 0} onChange={(event) => updateHybridTurnResult(activeHybridTurn, { captureProgressPercent: Number(event.target.value) })} className="mt-2 w-full accent-sky-400" /></div>
                <label className="min-w-0 text-xs font-bold">화물 진행 거리 (m)<input type="number" min={0} step="any" disabled={saving || set.hybridTurnResults?.[activeHybridTurn]?.captureProgressPercent !== 100} value={set.hybridTurnResults?.[activeHybridTurn]?.payloadDistanceMeters ?? ""} onChange={(event) => updateHybridTurnResult(activeHybridTurn, { payloadDistanceMeters: event.target.value === "" ? null : Number(event.target.value) })} className={`${inputClass} mt-1 disabled:cursor-not-allowed disabled:opacity-50`} placeholder="거점 100% 달성 후 입력" /></label>
                <label className="min-w-0 text-xs font-bold">공격 획득 점수<input type="text" inputMode="numeric" pattern="[0-9]*" disabled={saving} value={set.hybridTurnResults?.[activeHybridTurn]?.points ?? ""} onChange={(event) => { const value = event.target.value.replace(/\D/g, ""); if (value && Number(value) > 99) return; setSet((current) => current ? { ...current, hybridTurnResults: { ...(current.hybridTurnResults ?? {}), [activeHybridTurn]: { ...(current.hybridTurnResults?.[activeHybridTurn] ?? { points: null, progressPercent: null }), points: value ? Number(value) : null } } } : current); }} className={`${inputClass} mt-1`} placeholder="예: 2" /></label>
              </div>
              <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">{(heroTeamsReversed ? [[match.teamBId, match.teamBName], [match.teamAId, match.teamAName]] : [[match.teamAId, match.teamAName], [match.teamBId, match.teamBName]]).map(([teamId, name]) => <div key={teamId} className="min-w-0">{renderHybridTeam(teamId, name, activeHybridTurn, activeAttackTeamId)}</div>)}</div>
            </> : <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">위에서 선공 팀을 선택하면 두 턴이 자동으로 구성됩니다.</p>}
          </div> : <div className="space-y-4 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-sm font-bold">경기 데이터</h2><p className="mt-1 text-xs text-slate-500">{mapSubareas.length ? "구역 탭에서 점유율, 승리 팀과 선수별 사용 영웅을 함께 입력하세요." : "세부 구역이 없는 맵입니다. 선수별 사용 영웅을 바로 입력할 수 있습니다."}</p></div>{mapSubareas.length > 0 && availableSubareas.length > 0 && <div className="relative"><button type="button" disabled={saving} aria-expanded={showAddSubareaPicker} onClick={() => setShowAddSubareaPicker((open) => !open)} className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-amber-500/40 px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-500/10 dark:text-amber-300"><Plus size={14} />구역 추가</button>{showAddSubareaPicker && <div className="absolute right-0 top-full z-20 mt-1 min-w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">{availableSubareas.map((area) => <button key={area.id} type="button" onClick={() => addSubareaResult(area.id)} className="block w-full rounded px-3 py-2 text-left text-xs font-semibold hover:bg-amber-500/10">{area.name}</button>)}</div>}</div>}</div>
            {isPushMap && <section aria-label="팀별 밀기 거리" className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2 dark:border-slate-700 dark:bg-slate-900"><div className="sm:col-span-2"><h3 className="text-sm font-bold">팀별 최종 밀기 거리</h3><p className="mt-1 text-xs text-slate-500">경기 종료 시 각 팀이 밀어낸 거리를 미터 단위로 입력하세요.</p></div><label className="text-xs font-bold">{match.teamAName}<span className="ml-1 text-slate-500">(팀 A, m)</span><input type="number" min={0} step="any" disabled={saving} value={set.teamAPushDistanceMeters ?? ""} onChange={(event) => setSet((current) => current ? { ...current, teamAPushDistanceMeters: event.target.value === "" ? null : Number(event.target.value) } : current)} className={`${inputClass} mt-1`} placeholder="예: 95.06" /></label><label className="text-xs font-bold">{match.teamBName}<span className="ml-1 text-slate-500">(팀 B, m)</span><input type="number" min={0} step="any" disabled={saving} value={set.teamBPushDistanceMeters ?? ""} onChange={(event) => setSet((current) => current ? { ...current, teamBPushDistanceMeters: event.target.value === "" ? null : Number(event.target.value) } : current)} className={`${inputClass} mt-1`} placeholder="예: 135.99" /></label></section>}
            <button type="button" aria-label="영웅 입력 칸 좌우 전환" aria-pressed={heroTeamsReversed} onClick={() => setHeroTeamsReversed((current) => !current)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold dark:border-slate-700">영웅 칸 좌우 전환</button>
            {mapSubareas.length > 0 && <nav aria-label="경기 구역 탭" className="flex gap-2 overflow-x-auto border-b border-slate-200 dark:border-slate-800">{recordedSubareas.map((area, index) => <button key={area.id} type="button" onClick={() => setActiveSubareaTabId(area.id)} className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-bold ${activeSubarea?.id === area.id && !activeUnassignedSubarea ? "border-amber-500 text-amber-600 dark:text-amber-400" : "border-transparent text-slate-500"}`}>{index + 1}구역 · {area.name}</button>)}{showUnassignedSubareaTab && <button type="button" onClick={() => setActiveSubareaTabId(unassignedSubareaTabId)} className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-bold ${activeUnassignedSubarea ? "border-amber-500 text-amber-600 dark:text-amber-400" : "border-transparent text-slate-500"}`}>미지정 영웅</button>}</nav>}
            {mapSubareas.length > 0 && recordedSubareas.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">실제 진행한 구역만 ‘구역 추가’를 눌러 기록하세요.</p>}
            {activeSubarea && !activeUnassignedSubarea && <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900"><header className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><h3 className="font-bold">{activeSubarea.name} 경기 결과</h3><span className="text-xs text-slate-500">{recordedSubareas.findIndex((area) => area.id === activeSubarea.id) + 1}구역</span></div><fieldset className="flex items-center gap-1" aria-label={`${activeSubarea.name} 구역 승리 팀`}><legend className="sr-only">구역 승리 팀</legend>{[[match.teamAId, match.teamAName, teamAColor], [match.teamBId, match.teamBName, teamBColor]].map(([id, name, color]) => <label key={id} className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-bold transition focus-within:ring-2 focus-within:ring-amber-400 ${set.mapSubareaResults?.[activeSubarea.id]?.winnerTeamId === id ? color === "BLUE" ? "border-sky-500 bg-sky-700 text-white" : "border-rose-500 bg-rose-700 text-white" : "border-slate-300 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"}`}><input type="radio" className="sr-only" name={`subarea-winner-${activeSubarea.id}`} value={id} checked={set.mapSubareaResults?.[activeSubarea.id]?.winnerTeamId === id} disabled={saving} onChange={() => updateSubareaResult(activeSubarea.id, { winnerTeamId: id })} />{name}</label>)}</fieldset></header>
              <div className="grid grid-cols-[52px_minmax(0,1fr)_32px_minmax(0,1fr)_52px] items-center gap-2 rounded-xl bg-slate-950 p-3 text-white">
                <label className="block text-center text-[10px] font-bold text-sky-300">{teamAColor}<input type="number" min={0} max={99} disabled={saving} aria-label={`${match.teamAName} 구역 점수`} value={set.mapSubareaResults?.[activeSubarea.id]?.teamAScore ?? 0} onChange={(event) => updateSubareaResult(activeSubarea.id, { teamAScore: event.target.value === "" ? null : Math.min(99, Math.max(0, Math.floor(Number(event.target.value)))) })} className="match-score-input mt-1 block w-full rounded-md bg-sky-700 px-0 py-2 text-center text-xl font-black tabular-nums text-white outline-none" /></label>
                <div className="min-w-0 text-center"><label className="text-[10px] font-bold text-sky-200">{match.teamAName}<span className="ml-1 text-sm">{set.mapSubareaResults?.[activeSubarea.id]?.teamAProgress ?? 0}%</span></label><input type="range" min={0} max={100} disabled={saving} aria-label={`${match.teamAName} 점유율`} value={set.mapSubareaResults?.[activeSubarea.id]?.teamAProgress ?? 0} onChange={(event) => updateSubareaResult(activeSubarea.id, { teamAProgress: Number(event.target.value) })} className="mt-2 w-full accent-sky-400" /></div>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-black">C</span>
                <div className="min-w-0 text-center"><label className="text-[10px] font-bold text-rose-200">{match.teamBName}<span className="ml-1 text-sm">{set.mapSubareaResults?.[activeSubarea.id]?.teamBProgress ?? 0}%</span></label><input type="range" min={0} max={100} disabled={saving} aria-label={`${match.teamBName} 점유율`} value={set.mapSubareaResults?.[activeSubarea.id]?.teamBProgress ?? 0} onChange={(event) => updateSubareaResult(activeSubarea.id, { teamBProgress: Number(event.target.value) })} className="mt-2 w-full accent-rose-400" /></div>
                <label className="block text-center text-[10px] font-bold text-rose-300">{teamBColor}<input type="number" min={0} max={99} disabled={saving} aria-label={`${match.teamBName} 구역 점수`} value={set.mapSubareaResults?.[activeSubarea.id]?.teamBScore ?? 0} onChange={(event) => updateSubareaResult(activeSubarea.id, { teamBScore: event.target.value === "" ? null : Math.min(99, Math.max(0, Math.floor(Number(event.target.value)))) })} className="match-score-input mt-1 block w-full rounded-md bg-rose-700 px-0 py-2 text-center text-xl font-black tabular-nums text-white outline-none" /></label>
              </div>
            </section>}
            {(!mapSubareas.length || activeSubarea || activeUnassignedSubarea) ? <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">{(heroTeamsReversed ? [[match.teamBId, teamB?.name ?? match.teamBName, teamBColor], [match.teamAId, teamA?.name ?? match.teamAName, teamAColor]] : [[match.teamAId, teamA?.name ?? match.teamAName, teamAColor], [match.teamBId, teamB?.name ?? match.teamBName, teamBColor]]).map(([teamId, name, color]) => renderHeroTeam(teamId, name, color as TeamColor, activeHeroSubareaId, activeUnassignedSubarea))}</div> : null}
          </div> : <div className="space-y-4 p-4"><div><h2 className="text-sm font-bold">선수 데이터</h2><p className="mt-1 text-xs text-slate-500">선수별 처치·도움·죽음·피해·치유·경감과 POTG를 입력합니다.</p></div><div className="flex min-w-0 flex-col gap-4">{renderTeam(match.teamAId, teamA?.name ?? match.teamAName, teamAColor)}{renderTeam(match.teamBId, teamB?.name ?? match.teamBName, teamBColor)}</div></div>}
      </section>
      
    </> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-[#111726]"><p className="text-sm font-bold">세트 기록을 표시할 수 없습니다.</p><p className="mt-1 text-xs text-slate-500">경기 기록 관리에서 세트를 다시 선택해주세요.</p><Link href={backHref} className="mt-4 inline-flex rounded-lg bg-[#f99e1a] px-3 py-2 text-xs font-bold text-slate-950">경기 목록으로</Link></div>}
    {heroPickerTarget && (pickerStat || pickerBan) && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setHeroPickerTarget(null); }}><section role="dialog" aria-modal="true" aria-labelledby="used-hero-title" className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-white shadow-2xl dark:bg-[#111726]"><header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800"><div><h2 id="used-hero-title" className="text-base font-black">{pickerBan ? "밴할 영웅 선택" : "사용한 영웅 선택"}</h2><p className="mt-0.5 text-xs text-slate-500">{pickerBan ? `${pickerBan.teamId === match?.teamAId ? match.teamAName : match?.teamBName} · ${heroPickerTarget?.kind === "ban" ? heroPickerTarget.index + 1 : ""}번 밴 · 포지션별 최대 2회` : `${pickerPlayer?.name ?? "선수"} · ${heroPickerTarget?.kind === "player" && heroPickerTarget.turnTeamId ? `${heroPickerTarget.turnTeamId === match?.teamAId ? match?.teamAName : match?.teamBName} 공격 턴` : heroPickerTarget?.kind === "player" && heroPickerTarget.subareaId ? mapSubareas.find((area) => area.id === heroPickerTarget.subareaId)?.name ?? "구역" : "구역 미지정"} · 선택 ${heroPickerTarget?.kind === "player" && heroPickerTarget.turnTeamId ? pickerStat?.usedHeroTurns?.[heroPickerTarget.turnTeamId]?.length ?? 0 : pickerStat?.usedHeroIds?.length ?? 0}개`}</p></div><button type="button" aria-label="영웅 선택 닫기" onClick={() => setHeroPickerTarget(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button></header><div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-3 dark:border-slate-800"><label className="relative min-w-52 flex-1"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={heroSearch} onChange={(event) => setHeroSearch(event.target.value)} placeholder="영웅 이름 검색" className={`${inputClass} pl-9`} /></label><div className="flex max-w-full gap-1 overflow-x-auto">{[{ role: "ALL", label: "전체" }, ...heroRoles.map((role) => ({ role, label: roleLabels[role] ?? role }))].map((item) => <button key={item.role} type="button" onClick={() => setHeroRole(item.role)} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold ${heroRole === item.role ? "bg-amber-500 text-slate-950" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>{item.label}</button>)}</div></div><div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4"><div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 xl:grid-cols-10">{pickerHeroes.map((hero) => { const selected = pickerStat ? (heroPickerTarget?.kind === "player" && heroPickerTarget.turnTeamId ? (pickerStat.usedHeroTurns?.[heroPickerTarget.turnTeamId] ?? []).includes(hero.id) : heroPickerTarget?.kind === "player" && heroPickerTarget.subareaId ? (pickerStat.usedHeroSubareas?.[hero.id] ?? []).includes(heroPickerTarget.subareaId) : (pickerStat.usedHeroIds ?? []).includes(hero.id)) : pickerBan?.heroId === hero.id; const overRoleLimit = Boolean(pickerBan && banRoleCount(hero.role) >= 2 && pickerBan.heroId !== hero.id); return <button key={hero.id} type="button" disabled={overRoleLimit} title={overRoleLimit ? "이 포지션은 이미 두 번 밴되었습니다." : hero.nameKr} aria-pressed={selected} onClick={() => choosePickerHero(hero.id)} className={`group relative overflow-hidden rounded-xl border text-left transition ${overRoleLimit ? "cursor-not-allowed opacity-40" : "hover:-translate-y-0.5"} ${selected ? "border-amber-500 ring-2 ring-amber-500/60" : "border-slate-200 hover:border-amber-400 dark:border-slate-700"}`}><div className="aspect-square bg-slate-100 dark:bg-slate-900">{hero.imageUrl ? <img src={hero.imageUrl} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-lg font-black text-slate-400">{hero.nameKr.slice(0, 1)}</div>}</div><p className="truncate px-2 py-1.5 text-center text-[11px] font-bold">{hero.nameKr}</p>{selected && <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-slate-950"><Check size={13} /></span>}</button>; })}</div>{!pickerHeroes.length && <p className="p-8 text-center text-sm text-slate-500">검색 결과가 없습니다.</p>}</div><footer className="flex items-center justify-between gap-3 border-t border-slate-200 p-3 dark:border-slate-800"><p className="text-xs text-slate-500">{pickerBan ? "영웅을 선택하면 밴 슬롯에 지정됩니다." : "영웅 카드를 클릭해 사용 기록을 추가·해제하세요."}</p><button type="button" onClick={() => setHeroPickerTarget(null)} className="rounded-lg bg-[#f99e1a] px-4 py-2 text-xs font-bold text-slate-950">선택 완료</button></footer></section></div>}
  </section>;
}
