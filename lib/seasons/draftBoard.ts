// 수동 드래프트 보드에서 참가자의 팀 이동과 감독 교체를 중복 없이 처리한다.
import type { SeasonDraft } from "@/lib/types/seasonDraft";
import type { SeasonParticipantRecord } from "@/lib/types/seasonParticipants";

export interface BoardTeam {
  key: string;
  id?: string;
  name: string;
  sortOrder: number;
  members: string[];
}

export interface BoardSnapshot {
  teams: BoardTeam[];
  slots: Record<string, number>;
}

// 보드의 왼쪽 열부터 팀장 순서대로 고정 지명 번호를 계산한다.
export function draftPickNumber(teamIndex: number, slot: number, teamCount: number): number {
  return slot * teamCount + teamIndex + 1;
}

// 저장된 지명 번호의 칸을 우선 복원하고 기존 자유 입력 번호는 팀 안에서 순서대로 배치한다.
export function prepareDraftSlots(teams: BoardTeam[], participants: SeasonParticipantRecord[]): Record<string, number> {
  const byId = new Map(participants.map((item) => [item.streamerId, item]));
  const slots: Record<string, number> = {};
  teams.forEach((team, teamIndex) => {
    const players = team.members.map((id) => byId.get(id)).filter((item): item is SeasonParticipantRecord => !!item && !item.roles.includes("CAPTAIN") && !item.roles.includes("COACH"));
    const used = new Set<number>();
    for (const player of players) {
      const order = player.draftOrder;
      if (!order || (order - 1) % teams.length !== teamIndex) continue;
      const slot = Math.floor((order - 1) / teams.length);
      if (slot >= 4 || used.has(slot)) continue;
      slots[player.streamerId] = slot;
      used.add(slot);
    }
    for (const player of [...players].sort((a, b) => (a.draftOrder ?? Number.MAX_SAFE_INTEGER) - (b.draftOrder ?? Number.MAX_SAFE_INTEGER))) {
      if (slots[player.streamerId] !== undefined) continue;
      let slot = 0;
      while (used.has(slot)) slot++;
      slots[player.streamerId] = slot;
      used.add(slot);
    }
  });
  return slots;
}

// 현재 팀장 순서와 각 선수의 칸 위치로 저장할 지명 번호를 만든다.
export function boardDraftOrders(teams: BoardTeam[], slots: Record<string, number>): Record<string, number> {
  return Object.fromEntries(teams.flatMap((team, teamIndex) => team.members.filter((id) => slots[id] !== undefined).map((id) => [id, draftPickNumber(teamIndex, slots[id], teams.length)])));
}

// 선수를 누른 빈 칸으로 옮기며 이전 칸을 비운 보드 상태를 반환한다.
export function placePlayerInSlot(board: BoardSnapshot, playerId: string, targetKey: string, slot: number): BoardSnapshot {
  const target = board.teams.find((team) => team.key === targetKey);
  if (!target || target.members.some((id) => id !== playerId && board.slots[id] === slot)) return board;
  return { teams: movePlayer(board.teams, playerId, targetKey), slots: { ...board.slots, [playerId]: slot } };
}

// 지명된 선수 한 명을 팀과 칸에서 함께 제거해 선수 풀로 돌린다.
export function unassignPlayer(board: BoardSnapshot, playerId: string): BoardSnapshot {
  if (board.slots[playerId] === undefined) return board;
  const slots = { ...board.slots };
  delete slots[playerId];
  return { teams: movePlayer(board.teams, playerId, null), slots };
}

// 두 지명 선수의 팀 소속과 지명 칸을 맞바꿔 중복 배정을 막는다.
export function swapDraftPlayers(board: BoardSnapshot, firstId: string, secondId: string): BoardSnapshot {
  if (firstId === secondId || board.slots[firstId] === undefined || board.slots[secondId] === undefined) return board;
  const firstTeam = board.teams.find((team) => team.members.includes(firstId));
  const secondTeam = board.teams.find((team) => team.members.includes(secondId));
  if (!firstTeam || !secondTeam) return board;
  return {
    teams: board.teams.map((team) => ({ ...team, members: team.members.map((id) => id === firstId ? secondId : id === secondId ? firstId : id) })),
    slots: { ...board.slots, [firstId]: board.slots[secondId], [secondId]: board.slots[firstId] },
  };
}

// 현재 배정된 선수 중 번호가 가장 큰 한 명을 선수 풀로 돌린다.
export function removeLastPick(board: BoardSnapshot): BoardSnapshot {
  const last = Object.entries(boardDraftOrders(board.teams, board.slots)).sort((a, b) => b[1] - a[1])[0];
  if (!last) return board;
  return unassignPlayer(board, last[0]);
}

// 팀장과 감독 소속을 유지하고 지명된 선수만 모두 풀로 돌린다.
export function resetPlayerPicks(board: BoardSnapshot): BoardSnapshot {
  const playerIds = new Set(Object.keys(board.slots));
  if (!playerIds.size) return board;
  return { teams: board.teams.map((team) => ({ ...team, members: team.members.filter((id) => !playerIds.has(id)) })), slots: {} };
}

// 기존 팀을 보존하고 아직 팀이 없는 등록 팀장에게 화면용 팀을 하나씩 만든다.
export function prepareCaptainTeams(data: SeasonDraft): BoardTeam[] {
  const teams: BoardTeam[] = [...data.teams].sort((a, b) => (a.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b.sortOrder ?? Number.MAX_SAFE_INTEGER)).map((team) => ({ key: team.id, id: team.id, name: team.name, sortOrder: team.sortOrder ?? 0, members: [...team.members] }));
  const captains = data.participants.filter((item) => item.roles.includes("CAPTAIN"));
  const usedNames = new Set(teams.map((team) => team.name));
  for (const captain of captains) {
    if (teams.some((team) => team.members.includes(captain.streamerId))) continue;
    const base = `${captain.name.trim().slice(0, 90)} 팀`;
    let name = usedNames.has(base) ? `${captain.name.trim().slice(0, 75)} 팀 (${captain.streamerId})` : base;
    let suffix = 2;
    while (usedNames.has(name)) name = `${captain.name.trim().slice(0, 70)} 팀 (${captain.streamerId}-${suffix++})`;
    usedNames.add(name);
    teams.push({
      key: `captain-${captain.streamerId}`,
      name,
      sortOrder: teams.length + 1,
      members: [captain.streamerId],
    });
  }
  return teams.map((team, index) => ({ ...team, sortOrder: index + 1 }));
}

// 선택한 팀장을 목표 지명 순서로 옮기고 나머지 순서를 연속 번호로 다시 매긴다.
export function reorderCaptains(teams: BoardTeam[], key: string, target: number): BoardTeam[] {
  const next = [...teams];
  const from = next.findIndex((team) => team.key === key);
  if (from < 0 || target < 1 || target > next.length) return teams;
  next.splice(target - 1, 0, next.splice(from, 1)[0]);
  return next.map((team, index) => ({ ...team, sortOrder: index + 1 }));
}

// 선택한 선수를 기존 팀에서 빼고 목표 팀에 한 번만 배정한다.
export function movePlayer(teams: BoardTeam[], playerId: string, targetKey: string | null): BoardTeam[] {
  return teams.map((team) => ({
    ...team,
    members: team.key === targetKey
      ? [...team.members.filter((id) => id !== playerId), playerId]
      : team.members.filter((id) => id !== playerId),
  }));
}

// 감독을 팀마다 한 명으로 유지하며 다른 팀에 있던 선택 감독도 함께 이동한다.
export function assignCoach(teams: BoardTeam[], targetKey: string, coachId: string | null, coachIds: Set<string>): BoardTeam[] {
  return teams.map((team) => ({
    ...team,
    members: [
      ...team.members.filter((id) => id !== coachId && (team.key !== targetKey || !coachIds.has(id))),
      ...(team.key === targetKey && coachId ? [coachId] : []),
    ],
  }));
}
