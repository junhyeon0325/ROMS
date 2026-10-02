import { describe, expect, it } from "vitest";
import { computeMatchWinner, parseMatchInput } from "@/lib/matches/matchValidator";
import type { MatchInput } from "@/lib/types/matches";
import { getEscortAttackTeamId, getEscortTurnIds } from "@/lib/matches/escortTurns";

const input: MatchInput = { seasonId: "1", tournamentStage: "결승", matchDate: "", teamAId: "10", teamBId: "20", bestOf: 3, remarks: "", sets: [] };
// 테스트에서 완료·미완료 세트를 같은 형식으로 만든다.
const set = (setNumber: number, winnerTeamId: string | null) => ({ id: undefined, setNumber, mapId: winnerTeamId ? "100" : null, winnerTeamId, gameDurationSeconds: null, vodUrl: "", bans: [], stats: [] });

describe("경기 입력 검증과 결과 계산", () => {
  it("맵과 승리팀이 없는 미완료 세트를 허용한다", () => {
    expect(parseMatchInput({ ...input, sets: [set(1, null)] }).sets[0].winnerTeamId).toBeNull();
  });

  it("Bo3에서 한 팀이 두 세트를 이겨야 경기 승리팀을 확정한다", () => {
    expect(computeMatchWinner({ ...input, sets: [set(1, "10"), set(2, "20")] })).toBeNull();
    expect(computeMatchWinner({ ...input, sets: [set(1, "10"), set(2, "20"), set(3, "10")] })).toBe("10");
  });

  it("Bo5에서 세 세트 승리 전에는 경기 승리팀을 확정하지 않는다", () => {
    expect(computeMatchWinner({ ...input, bestOf: 5, sets: [set(1, "10"), set(2, "10"), set(3, null)] })).toBeNull();
  });

  it("다른 팀 승리, 중복 세트 번호, 맵 없는 완료 세트를 거절한다", () => {
    expect(() => parseMatchInput({ ...input, sets: [set(1, "30")] })).toThrow();
    expect(() => parseMatchInput({ ...input, sets: [set(1, null), set(1, null)] })).toThrow();
    expect(() => parseMatchInput({ ...input, sets: [{ ...set(1, "10"), mapId: null }] })).toThrow();
  });

  it("선수 기록의 음수와 한 세트의 중복 POTG를 거절한다", () => {
    const stat = { streamerId: "7", kills: 0, deaths: 0, assists: 0, damage: 0, healing: 0, mitigatedDamage: 0, isPotg: true };
    expect(() => parseMatchInput({ ...input, sets: [{ ...set(1, null), stats: [{ ...stat, kills: -1 }] }] })).toThrow();
    expect(() => parseMatchInput({ ...input, sets: [{ ...set(1, null), stats: [stat, { ...stat, streamerId: "8" }] }] })).toThrow();
  });

  it("추가 턴의 연속된 번호와 공격 팀·선수 영웅 연결을 검증한다", () => {
    const stat = { streamerId: "7", kills: 0, deaths: 0, assists: 0, damage: 0, healing: 0, mitigatedDamage: 0, isPotg: false, usedHeroIds: ["2000"], usedHeroTurns: { "turn-3": ["2000"] } };
    const turn = { attackTeamId: "10", points: 2, progressPercent: 75 };
    const base = { ...set(1, null), mapId: "100", hybridFirstAttackTeamId: "10", hybridTurnResults: { "turn-3": turn }, stats: [stat] };
    expect(parseMatchInput({ ...input, sets: [base] }).sets[0].hybridTurnResults?.["turn-3"]).toEqual(turn);
    expect(() => parseMatchInput({ ...input, sets: [{ ...base, hybridTurnResults: { "turn-4": turn } }] })).toThrow();
    expect(() => parseMatchInput({ ...input, sets: [{ ...base, hybridTurnResults: { "turn-3": { ...turn, attackTeamId: "30" } } }] })).toThrow();
    expect(() => parseMatchInput({ ...input, sets: [{ ...base, stats: [{ ...stat, usedHeroTurns: { "turn-4": ["2000"] } }] }] })).toThrow();
  });

  it("혼합맵 거점 진행률과 화물 거리의 범위를 검증하고 기존 진행률을 허용한다", () => {
    const turn = { points: 1, progressPercent: 40, captureProgressPercent: 100, payloadDistanceMeters: 123.456 };
    const base = { ...set(1, null), mapId: "100", hybridFirstAttackTeamId: "10" };
    const withTurn = (result: object) => ({ ...input, sets: [{ ...base, hybridTurnResults: { "10": result } }] });
    expect(parseMatchInput(withTurn(turn)).sets[0].hybridTurnResults?.["10"]).toEqual(turn);
    expect(() => parseMatchInput(withTurn({ ...turn, captureProgressPercent: 101 }))).toThrow();
    expect(() => parseMatchInput(withTurn({ ...turn, captureProgressPercent: 1.5 }))).toThrow();
    expect(() => parseMatchInput(withTurn({ ...turn, payloadDistanceMeters: -0.1 }))).toThrow();
    expect(() => parseMatchInput(withTurn({ ...turn, payloadDistanceMeters: "10" }))).toThrow();
  });

  it("밀기 맵 팀별 거리를 음이 아닌 소수 미터로 검증하며 임의 최대값은 두지 않는다", () => {
    const pushSet = { ...set(1, null), mapId: "100", teamAPushDistanceMeters: 95.06, teamBPushDistanceMeters: 12345.678 };
    expect(parseMatchInput({ ...input, sets: [pushSet] }).sets[0]).toMatchObject({ teamAPushDistanceMeters: 95.06, teamBPushDistanceMeters: 12345.678 });
    expect(() => parseMatchInput({ ...input, sets: [{ ...pushSet, teamAPushDistanceMeters: -0.01 }] })).toThrow();
    expect(() => parseMatchInput({ ...input, sets: [{ ...pushSet, teamBPushDistanceMeters: Number.POSITIVE_INFINITY }] })).toThrow();
  });

  // 호위 선공 팀과 양 팀의 공격 점수·화물 거리를 검증한다.
  it("호위 맵의 선공 팀과 화물 결과를 허용하고 잘못된 값을 거절한다", () => {
    const escortSet = { ...set(1, null), mapId: "100", escortFirstAttackTeamId: "20", teamAEscortScore: 3, teamBEscortScore: 2, teamAEscortDistanceMeters: 95.06, teamBEscortDistanceMeters: 135.99 };
    expect(parseMatchInput({ ...input, sets: [escortSet] }).sets[0]).toMatchObject(escortSet);
    expect(() => parseMatchInput({ ...input, sets: [{ ...escortSet, escortFirstAttackTeamId: "30" }] })).toThrow();
    expect(() => parseMatchInput({ ...input, sets: [{ ...escortSet, teamAEscortScore: 1.5 }] })).toThrow();
    expect(() => parseMatchInput({ ...input, sets: [{ ...escortSet, teamBEscortDistanceMeters: -1 }] })).toThrow();
  });

  // 호위는 기본 두 턴 뒤에도 공격 팀이 바뀌는 추가 턴과 선수별 영웅 기록을 허용한다.
  it("호위 맵의 연속된 추가 턴과 턴별 사용 영웅을 검증한다", () => {
    const stat = { streamerId: "7", kills: 0, deaths: 0, assists: 0, damage: 0, healing: 0, mitigatedDamage: 0, isPotg: false, usedHeroIds: ["2000"], usedHeroTurns: { "turn-3": ["2000"] } };
    const escortSet = { ...set(1, null), mapId: "100", escortFirstAttackTeamId: "20", escortTurnResults: { "20": { points: 3, payloadDistanceMeters: 135.99 }, "10": { points: 2, payloadDistanceMeters: 95.06 }, "turn-3": { attackTeamId: "20", points: 4, payloadDistanceMeters: 151.2 } }, stats: [stat] };
    expect(parseMatchInput({ ...input, sets: [escortSet] }).sets[0].escortTurnResults).toEqual(escortSet.escortTurnResults);
    expect(() => parseMatchInput({ ...input, sets: [{ ...escortSet, escortTurnResults: { ...escortSet.escortTurnResults, "turn-5": { attackTeamId: "10", points: 5, payloadDistanceMeters: 160 } } }] })).toThrow();
    expect(() => parseMatchInput({ ...input, sets: [{ ...escortSet, escortTurnResults: { ...escortSet.escortTurnResults, "turn-3": { attackTeamId: "30", points: 4, payloadDistanceMeters: 151.2 } } }] })).toThrow();
    expect(() => parseMatchInput({ ...input, sets: [{ ...escortSet, escortFirstAttackTeamId: null }] })).toThrow();
    expect(getEscortTurnIds(escortSet, input.teamAId, input.teamBId)).toEqual(["20", "10", "turn-3"]);
    expect(getEscortAttackTeamId(escortSet, "turn-3")).toBe("20");
  });
});
