// 세트 번호와 직전 세트 결과로 먼저 밴할 팀을 결정한다.
import type { MatchSetInput } from "@/lib/types/matches";

// 첫 세트는 기존 B팀 선밴을 유지하고 이후에는 직전 패배 팀을 반환한다.
export function getFirstBanTeam(teamAId: string, teamBId: string, setNumber: number, sets: MatchSetInput[]): string | null {
  if (setNumber === 1) return teamBId;
  const previous = sets.find((set) => set.setNumber === setNumber - 1);
  if (!previous?.winnerTeamId) return null;
  return previous.winnerTeamId === teamAId ? teamBId : teamAId;
}

// 네 밴 슬롯의 팀 배정을 맞바꾸고 순번별 영웅 선택은 유지한다.
export function swapBanTeamAssignments(
  bans: { teamId: string; heroId: string }[],
  defaultTeamIds: string[],
  teamAId: string,
  teamBId: string,
): { teamId: string; heroId: string }[] {
  return Array.from({ length: 4 }, (_, index) => {
    const ban = bans[index];
    const teamId = ban?.teamId ?? defaultTeamIds[index];
    return { teamId: teamId === teamAId ? teamBId : teamAId, heroId: ban?.heroId ?? "" };
  });
}
