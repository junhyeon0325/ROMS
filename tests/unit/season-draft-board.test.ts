// 보드에서 선수를 옮기거나 감독을 교체할 때 시즌 팀 소속이 중복되지 않는지 확인한다.
import { describe, expect, it } from "vitest";
import { assignCoach, boardDraftOrders, draftPickNumber, movePlayer, placePlayerInSlot, prepareCaptainTeams, prepareDraftSlots, removeLastPick, reorderCaptains, resetPlayerPicks, swapDraftPlayers, unassignPlayer, type BoardTeam } from "@/lib/seasons/draftBoard";

const teams: BoardTeam[] = [
  { key: "a", name: "A", sortOrder: 1, members: ["player-1", "coach-1"] },
  { key: "b", name: "B", sortOrder: 2, members: ["player-2", "coach-2"] },
];

describe("수동 드래프트 보드", () => {
  it("등록 팀장마다 팀을 미리 만들고 기존 팀 소속은 보존한다", () => {
    const data = {
      participants: [
        { streamerId: "10", name: "팀장 A", roles: ["CAPTAIN"] },
        { streamerId: "20", name: "팀장 B", roles: ["CAPTAIN"] },
      ],
      teams: [{ id: "1", name: "기존 팀", sortOrder: 1, members: ["10", "30"] }],
    } as Parameters<typeof prepareCaptainTeams>[0];
    expect(prepareCaptainTeams(data)).toEqual([
      { key: "1", id: "1", name: "기존 팀", sortOrder: 1, members: ["10", "30"] },
      { key: "captain-20", name: "팀장 B 팀", sortOrder: 2, members: ["20"] },
    ]);
  });

  it("동명이인 팀장은 저장용 임시 팀 이름을 중복 없이 만든다", () => {
    const data = { participants: [
      { streamerId: "10", name: "동명", roles: ["CAPTAIN"] },
      { streamerId: "20", name: "동명", roles: ["CAPTAIN"] },
    ], teams: [] } as unknown as Parameters<typeof prepareCaptainTeams>[0];
    expect(prepareCaptainTeams(data).map((team) => team.name)).toEqual(["동명 팀", "동명 팀 (20)"]);
  });

  it("팀장 순서를 바꾸면 나머지 팀을 밀고 1부터 다시 번호를 매긴다", () => {
    expect(reorderCaptains(teams, "b", 1).map((team) => [team.key, team.sortOrder])).toEqual([["b", 1], ["a", 2]]);
  });

  it("선수를 다른 팀으로 옮겨도 한 팀에만 남긴다", () => {
    expect(movePlayer(teams, "player-1", "b").map((team) => team.members)).toEqual([["coach-1"], ["player-2", "coach-2", "player-1"]]);
  });

  it("선수를 미배정 상태로 돌린다", () => {
    expect(movePlayer(teams, "player-1", null)[0].members).toEqual(["coach-1"]);
  });

  it("감독 교체 시 기존 감독을 해제하고 선택 감독을 이전 팀에서도 제거한다", () => {
    expect(assignCoach(teams, "a", "coach-2", new Set(["coach-1", "coach-2"])).map((team) => team.members)).toEqual([["player-1", "coach-2"], ["player-2"]]);
  });

  it("첫 열의 다섯 팀에 1~5번을 배정하고 다음 열은 6번부터 시작한다", () => {
    expect(Array.from({ length: 5 }, (_, index) => draftPickNumber(index, 0, 5))).toEqual([1, 2, 3, 4, 5]);
    expect(draftPickNumber(0, 1, 5)).toBe(6);
    expect(draftPickNumber(4, 3, 5)).toBe(20);
  });

  it("저장된 칸을 복원하고 선수를 다른 팀 칸으로 이동한다", () => {
    const participants = [
      { streamerId: "player-1", roles: ["PLAYER"], draftOrder: 3 },
      { streamerId: "player-2", roles: ["PLAYER"], draftOrder: 2 },
    ] as Parameters<typeof prepareDraftSlots>[1];
    const slots = prepareDraftSlots(teams, participants);
    expect(slots).toEqual({ "player-1": 1, "player-2": 0 });
    const initial = { teams, slots };
    const moved = placePlayerInSlot(initial, "player-1", "b", 1);
    expect(moved.teams.map((team) => team.members)).toEqual([["coach-1"], ["player-2", "coach-2", "player-1"]]);
    expect(boardDraftOrders(moved.teams, moved.slots)).toEqual({ "player-2": 2, "player-1": 4 });
  });

  it("가장 큰 지명 번호부터 한 명씩 취소한다", () => {
    const allTeams: BoardTeam[] = Array.from({ length: 5 }, (_, index) => ({ key: String(index), name: String(index), sortOrder: index + 1, members: [`captain-${index}`, `player-${index}`] }));
    const slots = Object.fromEntries(allTeams.map((_, index) => [`player-${index}`, 3]));
    const board = { teams: allTeams, slots };
    const afterTwenty = removeLastPick(board);
    expect(afterTwenty.teams[4].members).toEqual(["captain-4"]);
    expect(boardDraftOrders(afterTwenty.teams, afterTwenty.slots)["player-4"]).toBeUndefined();
    expect(removeLastPick(afterTwenty).teams[3].members).toEqual(["captain-3"]);
  });

  it("선택한 선수만 제외하면 해당 지명 칸과 팀 소속이 함께 비워진다", () => {
    const board = { teams, slots: { "player-1": 0, "player-2": 1 } };
    const next = unassignPlayer(board, "player-1");
    expect(next.teams.map((team) => team.members)).toEqual([["coach-1"], ["player-2", "coach-2"]]);
    expect(next.slots).toEqual({ "player-2": 1 });
    expect(unassignPlayer(next, "player-1")).toBe(next);
  });

  it("두 지명 선수를 교환하면 팀 소속과 칸 번호가 함께 바뀐다", () => {
    const board = { teams, slots: { "player-1": 0, "player-2": 1 } };
    const next = swapDraftPlayers(board, "player-1", "player-2");
    expect(next.teams.map((team) => team.members)).toEqual([["player-2", "coach-1"], ["player-1", "coach-2"]]);
    expect(next.slots).toEqual({ "player-1": 1, "player-2": 0 });
    expect(boardDraftOrders(next.teams, next.slots)).toEqual({ "player-2": 1, "player-1": 4 });
    expect(swapDraftPlayers(board, "player-1", "player-1")).toBe(board);
  });

  it("전체 초기화는 지명 선수만 빼고 팀장과 감독을 보존한다", () => {
    const withCaptains = teams.map((team, index) => ({ ...team, members: [`captain-${index}`, ...team.members] }));
    const cleared = resetPlayerPicks({ teams: withCaptains, slots: { "player-1": 0, "player-2": 0 } });
    expect(cleared.teams.map((team) => team.members)).toEqual([["captain-0", "coach-1"], ["captain-1", "coach-2"]]);
    expect(cleared.slots).toEqual({});
  });

  it("이전 자유 입력 번호가 보드 네 칸 밖이면 첫 칸부터 다시 배치한다", () => {
    const participants = [{ streamerId: "player-1", roles: ["PLAYER"], draftOrder: 101 }] as Parameters<typeof prepareDraftSlots>[1];
    expect(prepareDraftSlots(teams, participants)["player-1"]).toBe(0);
  });
});
