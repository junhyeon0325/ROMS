// 호위 세트의 선공 팀과 추가 공격 턴을 경기 진행 순서로 정리한다.
import type { MatchSetInput } from "@/lib/types/matches";

// 선공 팀이 정해지면 기본 두 턴과 이어서 추가한 턴의 ID를 반환한다.
export function getEscortTurnIds(set: MatchSetInput, teamAId: string, teamBId: string): string[] {
  const first = set.escortFirstAttackTeamId;
  if (!first || ![teamAId, teamBId].includes(first)) return [];
  const second = first === teamAId ? teamBId : teamAId;
  const extra = Object.keys(set.escortTurnResults ?? {})
    .filter((id) => /^turn-(?:[3-9]|[1-9]\d+)$/.test(id))
    .sort((a, b) => Number(a.slice(5)) - Number(b.slice(5)));
  return [first, second, ...extra];
}

// 기본 턴의 팀 ID 또는 추가 턴에 저장된 공격 팀을 반환한다.
export function getEscortAttackTeamId(set: MatchSetInput, turnId: string): string {
  return set.escortTurnResults?.[turnId]?.attackTeamId ?? turnId;
}

// 여러 공격 턴 중 팀별 마지막 입력값을 기존 세트 요약 컬럼에 반영할 값으로 구한다.
export function getLatestEscortTeamResult(set: MatchSetInput, teamAId: string, teamBId: string, teamId: string) {
  const turnIds = getEscortTurnIds(set, teamAId, teamBId);
  const lastTurnId = [...turnIds].reverse().find((id) => getEscortAttackTeamId(set, id) === teamId && set.escortTurnResults?.[id]);
  return lastTurnId ? set.escortTurnResults?.[lastTurnId] ?? null : null;
}
