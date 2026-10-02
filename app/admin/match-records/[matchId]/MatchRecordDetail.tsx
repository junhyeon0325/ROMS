// File: app/admin/match-records/[matchId]/MatchRecordDetail.tsx
// Page/Component: MatchRecordDetail
// Purpose: 경기 결과를 요약하고 세트·선수·영웅 밴과 모든 저장 필드를 구조화해 표시한다.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Entity = Record<string, unknown>;
type Member = Entity & { streamer: Entity };
type Team = Entity & { members: Member[] };
type PlayerStat = Entity & { streamer: Entity };
type HeroBan = Entity & { team: Entity; hero: Entity };
type MapRecord = Entity & { subareas: Entity[] };
type SetRecord = Entity & {
  map: MapRecord | null; mapSubarea: Entity | null; winnerTeam: Entity | null;
  playerStats: PlayerStat[]; heroBans: HeroBan[];
};
type MatchRecord = Entity & {
  season: Entity; teamA: Team; teamB: Team; winnerTeam: Entity | null; sets: SetRecord[];
};
type ApiResult = { success: boolean; data?: MatchRecord; message?: string };
const cardClass = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#111726]";
const fieldLabels: Record<string, string> = {
  id: "ID", seasonId: "대회 ID", matchId: "경기 ID", matchSetId: "세트 ID", streamerId: "선수 ID",
  teamAId: "A팀 ID", teamBId: "B팀 ID", teamId: "팀 ID", winnerTeamId: "승리 팀 ID", heroId: "영웅 ID",
  tournamentStage: "대회 단계", matchDate: "경기일", bestOf: "최대 세트", setNumber: "세트 번호",
  mapId: "맵 ID", mapSubareaId: "선택 구역 ID", mapSubareaResults: "구역별 결과", teamAColor: "A팀 색상",
  hybridFirstAttackTeamId: "혼합 선공 팀 ID", hybridTurnResults: "혼합 공격 턴",
  teamAPushDistanceMeters: "A팀 밀기 거리(m)", teamBPushDistanceMeters: "B팀 밀기 거리(m)",
  escortFirstAttackTeamId: "호위 선공 팀 ID", escortTurnResults: "호위 공격 턴",
  teamAEscortDistanceMeters: "A팀 호위 거리(m)", teamBEscortDistanceMeters: "B팀 호위 거리(m)",
  teamAEscortScore: "A팀 호위 점수", teamBEscortScore: "B팀 호위 점수",
  gameDurationSeconds: "경기 시간(초)", vodUrl: "VOD", lineupOrder: "출전 순서",
  kills: "처치", deaths: "죽음", assists: "도움", damage: "피해", healing: "치유", mitigatedDamage: "경감",
  usedHeroIds: "사용 영웅 ID", usedHeroSubareas: "구역별 사용 영웅 ID", usedHeroTurns: "턴별 사용 영웅 ID",
  isPotg: "POTG", sortOrder: "순서", position: "포지션", remarks: "비고",
  createdBy: "생성자", createdAt: "생성일", updatedBy: "수정자", updatedAt: "수정일",
};

// 저장값을 읽기 쉬운 문자열로 바꾸되 JSON의 원래 키와 값은 유지한다.
function valueText(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "예" : "아니오";
  if (typeof value === "string" && /^[\[{]/.test(value)) {
    try { return JSON.stringify(JSON.parse(value), null, 2); } catch { return value; }
  }
  return typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
}

// 초 단위 저장 시간을 분:초로 표시한다.
function durationText(seconds: unknown): string {
  if (typeof seconds !== "number") return "기록 없음";
  return `${Math.floor(seconds / 60)}분 ${String(seconds % 60).padStart(2, "0")}초`;
}

// 저장된 세트 승리 팀을 기준으로 경기 스코어를 계산한다.
function scoreFor(sets: SetRecord[], teamId: unknown): number {
  return sets.filter((set) => set.winnerTeamId === teamId).length;
}

// 행의 핵심 값 한 개를 짧은 카드로 표시한다.
function Fact({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
    <dt className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{label}</dt>
    <dd className="mt-1 break-words text-sm font-bold text-slate-900 dark:text-white">{value}</dd>
  </div>;
}

// 관계별 원본 스칼라 필드를 접는 영역에 모두 남겨 세부 값 누락을 막는다.
function StoredFields({ title, entity }: { title: string; entity: Entity | null }) {
  if (!entity) return null;
  const fields = Object.entries(entity).filter(([, value]) => value === null || typeof value !== "object");
  return <details className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/40">
    <summary className="cursor-pointer px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200">{title} · 저장 필드 {fields.length}개</summary>
    <dl className="grid gap-3 border-t border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-3 dark:border-slate-800">
      {fields.map(([key, value]) => <div key={key} className="min-w-0">
        <dt className="text-[11px] text-slate-500">{fieldLabels[key] ?? key}</dt>
        <dd className="mt-1 whitespace-pre-wrap break-all font-mono text-xs text-slate-800 dark:text-slate-200">{valueText(value)}</dd>
      </div>)}
    </dl>
  </details>;
}

// 세트별 선수 기록을 팀과 주요 전투 지표 중심의 작은 그리드로 표시한다.
function PlayerGrid({ stats, teamA, teamB }: { stats: PlayerStat[]; teamA: Team; teamB: Team }) {
  const teamAIds = new Set(teamA.members.map((member) => String(member.streamerId)));
  const teamBIds = new Set(teamB.members.map((member) => String(member.streamerId)));
  if (stats.length === 0) return <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-xs text-slate-500 dark:bg-slate-800/40">저장된 선수 기록이 없습니다.</p>;
  return <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
    <table className="w-full min-w-[680px] text-left text-xs">
      <thead className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"><tr>
        {['팀 / 선수', '처치', '죽음', '도움', '피해', '치유', '경감', 'POTG'].map((heading) => <th key={heading} className="px-3 py-2.5 font-bold">{heading}</th>)}
      </tr></thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
        {stats.map((stat) => {
          const id = String(stat.streamerId);
          const teamName = teamAIds.has(id) ? String(teamA.name) : teamBIds.has(id) ? String(teamB.name) : "팀 미확인";
          return <tr key={String(stat.id)} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
            <td className="px-3 py-3"><span className="block text-[10px] text-slate-500">{teamName}</span><strong>{String(stat.streamer.name ?? id)}</strong></td>
            {[stat.kills, stat.deaths, stat.assists, stat.damage, stat.healing, stat.mitigatedDamage].map((value, index) => <td key={index} className="px-3 py-3 tabular-nums">{Number(value ?? 0).toLocaleString()}</td>)}
            <td className="px-3 py-3">{stat.isPotg ? <span className="rounded-full bg-amber-100 px-2 py-1 font-bold text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">POTG</span> : "—"}</td>
          </tr>;
        })}
      </tbody>
    </table>
  </div>;
}

// 팀 편성과 시즌 소속 선수의 저장된 이름·포지션을 간결하게 보여준다.
function TeamRoster({ team, label }: { team: Team; label: string }) {
  return <section className={cardClass}>
    <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold">{label} · {String(team.name)}</h2><span className="text-xs text-slate-500">{team.members.length}명</span></div>
    <div className="flex flex-wrap gap-2">{team.members.length ? team.members.map((member) => <span key={String(member.id)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700">{String(member.streamer.name ?? member.streamerId)} <span className="text-slate-500">{valueText(member.position)}</span></span>) : <p className="text-xs text-slate-500">등록된 팀 선수가 없습니다.</p>}</div>
  </section>;
}

// 경기 한 세트의 결과·맵·밴·선수 통계를 읽기 쉬운 순서로 배치한다.
function SetSection({ set, match }: { set: SetRecord; match: MatchRecord }) {
  const map = set.map;
  const winner = set.winnerTeam?.name ?? "미정";
  const hasModeResults = [set.mapSubareaResults, set.hybridTurnResults, set.escortTurnResults].some((value) => value !== null && value !== "");
  return <section id="match-set-panel" role="tabpanel" aria-label={`${String(set.setNumber)}세트 상세 기록`} className={`${cardClass} space-y-5`}>
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
      <div><span className="text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">SET {String(set.setNumber).padStart(2, "0")}</span><h2 className="mt-1 text-lg font-bold">{String(map?.name ?? "맵 미정")}</h2><p className="mt-1 text-xs text-slate-500">{String(map?.mapType ?? "모드 미정")} · {String(set.mapSubarea?.name ?? "구역 미지정")}</p></div>
      <div className="rounded-xl bg-amber-50 px-4 py-2 text-right dark:bg-amber-500/10"><span className="block text-[10px] font-bold text-amber-700 dark:text-amber-300">세트 승리</span><strong className="text-sm text-slate-900 dark:text-white">{String(winner)}</strong></div>
    </div>
    <div className="grid gap-2 sm:grid-cols-3"><Fact label="진행 시간" value={durationText(set.gameDurationSeconds)} /><Fact label="A팀 색상" value={valueText(set.teamAColor)} /><Fact label="선수 기록" value={`${set.playerStats.length}명`} /></div>
    {(set.teamAPushDistanceMeters !== null || set.teamBPushDistanceMeters !== null || set.teamAEscortScore !== null || set.teamBEscortScore !== null) && <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {set.teamAPushDistanceMeters !== null && <Fact label={`${String(match.teamA.name)} 밀기 거리`} value={`${valueText(set.teamAPushDistanceMeters)}m`} />}
      {set.teamBPushDistanceMeters !== null && <Fact label={`${String(match.teamB.name)} 밀기 거리`} value={`${valueText(set.teamBPushDistanceMeters)}m`} />}
      {set.teamAEscortScore !== null && <Fact label={`${String(match.teamA.name)} 호위 점수`} value={valueText(set.teamAEscortScore)} />}
      {set.teamBEscortScore !== null && <Fact label={`${String(match.teamB.name)} 호위 점수`} value={valueText(set.teamBEscortScore)} />}
    </div>}
    {hasModeResults && <details className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50"><summary className="cursor-pointer text-xs font-bold">구역·공격 턴 상세 결과</summary><div className="mt-3 grid gap-3 lg:grid-cols-3">{([['구역별 결과', set.mapSubareaResults], ['혼합 공격 턴', set.hybridTurnResults], ['호위 공격 턴', set.escortTurnResults]] as const).filter(([, value]) => value !== null && value !== "").map(([label, value]) => <div key={label} className="min-w-0 rounded-lg bg-white p-3 dark:bg-slate-900"><strong className="text-xs">{label}</strong><pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all text-[11px] text-slate-600 dark:text-slate-300">{valueText(value)}</pre></div>)}</div></details>}
    <div><h3 className="mb-2 text-sm font-bold">선수별 기록</h3><PlayerGrid stats={set.playerStats} teamA={match.teamA} teamB={match.teamB} /></div>
    <div><h3 className="mb-2 text-sm font-bold">영웅 밴</h3>{set.heroBans.length ? <div className="flex flex-wrap gap-2">{set.heroBans.map((ban) => <span key={String(ban.id)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700">{String(ban.team.name)} · <strong>{String(ban.hero.name)}</strong></span>)}</div> : <p className="text-xs text-slate-500">저장된 영웅 밴이 없습니다.</p>}</div>
    {typeof set.vodUrl === "string" && /^https?:\/\//.test(set.vodUrl) && <a href={set.vodUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-xs font-bold text-amber-700 underline dark:text-amber-400">VOD 보기 ↗</a>}
  </section>;
}

// 관계별 접는 목록에 API가 반환한 모든 저장 스칼라 값을 표시한다.
function StoredRecordSection({ match }: { match: MatchRecord }) {
  return <details className={cardClass}>
    <summary className="cursor-pointer text-sm font-bold">모든 저장 필드 보기 <span className="ml-2 text-xs font-normal text-slate-500">ID·비고·감사 정보·영웅 사용 기록 포함</span></summary>
    <div className="mt-4 space-y-2">
      <StoredFields title="경기" entity={match} /><StoredFields title="대회" entity={match.season} />
      {[match.teamA, match.teamB].map((team) => <div key={String(team.id)} className="space-y-2"><StoredFields title={`팀 · ${String(team.name)}`} entity={team} />{team.members.map((member) => <div key={String(member.id)} className="space-y-2 pl-3"><StoredFields title={`팀 선수 · ${String(member.streamer.name ?? member.streamerId)}`} entity={member} /><StoredFields title={`선수 정보 · ${String(member.streamer.name ?? member.streamerId)}`} entity={member.streamer} /></div>)}</div>)}
      {match.winnerTeam && <StoredFields title="경기 승리 팀" entity={match.winnerTeam} />}
      {match.sets.map((set) => <div key={String(set.id)} className="space-y-2 border-l-2 border-amber-400 pl-3"><StoredFields title={`${set.setNumber}세트`} entity={set} /><StoredFields title="맵" entity={set.map} /><StoredFields title="선택 구역" entity={set.mapSubarea} />{set.map?.subareas.map((area) => <StoredFields key={String(area.id)} title={`맵 구역 · ${String(area.name)}`} entity={area} />)}{set.winnerTeam && <StoredFields title="세트 승리 팀" entity={set.winnerTeam} />}{set.playerStats.map((stat) => <div key={String(stat.id)} className="space-y-2"><StoredFields title={`선수 기록 · ${String(stat.streamer.name ?? stat.streamerId)}`} entity={stat} /><StoredFields title="선수 정보" entity={stat.streamer} /></div>)}{set.heroBans.map((ban) => <div key={String(ban.id)} className="space-y-2"><StoredFields title={`영웅 밴 · ${String(ban.hero.name ?? ban.heroId)}`} entity={ban} /><StoredFields title="밴 영웅" entity={ban.hero} /><StoredFields title="밴 팀" entity={ban.team} /></div>)}</div>)}
    </div>
  </details>;
}

// 선택 경기를 API에서 읽고 요약·세트·전체 저장 필드를 페이지에 표시한다.
export default function MatchRecordDetail({ matchId, seasonId }: { matchId: string; seasonId: string }) {
  const [match, setMatch] = useState<MatchRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const [selectedSetId, setSelectedSetId] = useState("");

  // 대회와 경기 ID가 모두 유효할 때 선택 경기 하나의 상세만 요청한다.
  useEffect(() => {
    if (!/^[1-9]\d*$/.test(seasonId) || !/^[1-9]\d*$/.test(matchId)) {
      setError("대회 또는 경기 ID가 올바르지 않습니다."); setLoading(false); return;
    }
    const controller = new AbortController();
    setLoading(true); setError(""); setMatch(null);
    fetch(`/api/match-records?view=detail&seasonId=${seasonId}&matchId=${matchId}`, { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json() as ApiResult;
        if (!response.ok || !result.success || !result.data) throw new Error(result.message || "상세 기록을 불러오지 못했습니다.");
        return result.data;
      })
      .then(setMatch)
      .catch((cause) => { if (!controller.signal.aborted) setError(cause.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [matchId, seasonId, reloadToken]);

  const backHref = `/admin/match-records?seasonId=${encodeURIComponent(seasonId)}`;
  if (loading) return <div className={`${cardClass} m-auto w-full max-w-xl py-16 text-center text-sm text-slate-500`} role="status">경기 전체 기록을 불러오는 중입니다...</div>;
  if (error || !match) return <div className={`${cardClass} m-auto w-full max-w-xl space-y-4 py-12 text-center`}><p role="alert" className="text-sm text-red-600">{error || "경기 기록을 찾을 수 없습니다."}</p><button type="button" onClick={() => setReloadToken((value) => value + 1)} className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950">다시 시도</button><Link href={backHref} className="ml-3 text-xs underline">목록으로</Link></div>;

  const scoreA = scoreFor(match.sets, match.teamA.id);
  const scoreB = scoreFor(match.sets, match.teamB.id);
  // 현재 경기에서 선택한 세트만 펼치고 새 경기에서는 첫 세트를 기본으로 보여준다.
  const activeSet = match.sets.find((set) => String(set.id) === selectedSetId) ?? match.sets[0];
  return <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pb-8">
    <div className="flex items-center justify-between gap-3"><Link href={backHref} className="text-xs font-bold text-slate-500 hover:text-amber-600">← 경기 목록</Link><span className="text-xs text-slate-500">경기 #{matchId} · 조회 전용</span></div>
    <header className="overflow-hidden rounded-2xl bg-slate-900 p-6 text-white shadow-lg dark:bg-[#171f32]">
      <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-slate-300"><span className="rounded-full bg-amber-500/20 px-3 py-1 font-bold text-amber-300">{String(match.season.name)}</span><span>{String(match.tournamentStage)}</span><span>·</span><span>{typeof match.matchDate === "string" ? match.matchDate.slice(0, 10) : "날짜 미정"}</span></div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center"><div className="min-w-0"><p className="text-[11px] text-slate-400">TEAM A</p><h1 className="mt-1 break-words text-lg font-black sm:text-2xl">{String(match.teamA.name)}</h1></div><div className="rounded-xl bg-white/10 px-4 py-3 font-mono text-2xl font-black tabular-nums sm:px-6 sm:text-4xl">{scoreA} <span className="text-slate-500">:</span> {scoreB}</div><div className="min-w-0"><p className="text-[11px] text-slate-400">TEAM B</p><h1 className="mt-1 break-words text-lg font-black sm:text-2xl">{String(match.teamB.name)}</h1></div></div>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-300"><span>승리: <strong className="text-amber-300">{String(match.winnerTeam?.name ?? "미정")}</strong></span><span>·</span><span>{match.sets.length}세트 기록</span><span>·</span><span>최대 {valueText(match.bestOf)}세트</span></div>
    </header>
    <div className="grid gap-4 lg:grid-cols-2"><TeamRoster team={match.teamA} label="A팀" /><TeamRoster team={match.teamB} label="B팀" /></div>
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-base font-black">세트별 기록</h2><span className="text-xs text-slate-500">{match.sets.length}개 세트</span></div>
      {activeSet ? <>
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="세트 선택">
          {match.sets.map((set) => {
            const selected = set.id === activeSet.id;
            return <button key={String(set.id)} type="button" role="tab" aria-controls="match-set-panel" aria-selected={selected} onClick={() => setSelectedSetId(String(set.id))} className={`min-w-36 shrink-0 rounded-xl border px-4 py-3 text-left transition-colors ${selected ? "border-amber-500 bg-amber-500 text-slate-950 shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-amber-300 dark:border-slate-700 dark:bg-[#111726] dark:text-slate-200"}`}>
              <span className="block text-[10px] font-black">{String(set.setNumber).padStart(2, "0")} SET</span>
              <strong className="mt-1 block truncate text-xs">{String(set.map?.name ?? "맵 미정")}</strong>
              <span className="mt-1 block truncate text-[11px] opacity-75">{String(set.winnerTeam?.name ?? "결과 미정")}</span>
            </button>;
          })}
        </div>
        <SetSection key={String(activeSet.id)} set={activeSet} match={match} />
      </> : <div className={`${cardClass} py-10 text-center text-xs text-slate-500`}>등록된 세트가 없습니다.</div>}
    </div>
    <StoredRecordSection match={match} />
  </div>;
}
