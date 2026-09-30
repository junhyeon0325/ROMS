// 경기 시간 변환과 세트별 선밴 팀의 기본 규칙을 확인한다.
import { describe, expect, it } from "vitest";
import { formatGameDuration, parseGameDuration } from "@/lib/matches/duration";
import { getFirstBanTeam, swapBanTeamAssignments } from "@/lib/matches/banOrder";
import type { MatchSetInput } from "@/lib/types/matches";

// 테스트에서 직전 세트 승리팀만 필요한 최소 세트 입력을 만든다.
function previousSet(winnerTeamId: string | null): MatchSetInput {
  return { setNumber: 1, mapId: "100", winnerTeamId, gameDurationSeconds: null, vodUrl: "", bans: [], stats: [] };
}

describe("경기 기록 입력 규칙", () => {
  it("분:초 표시와 초 저장 값을 왕복 변환한다", () => {
    expect(parseGameDuration("8:56")).toBe(536);
    expect(formatGameDuration(536)).toBe("8:56");
    expect(parseGameDuration("8:99")).toBeUndefined();
  });

  it("2세트부터 직전 세트의 패배 팀이 먼저 밴한다", () => {
    expect(getFirstBanTeam("10", "20", 1, [])).toBe("20");
    expect(getFirstBanTeam("10", "20", 2, [previousSet("10")])).toBe("20");
    expect(getFirstBanTeam("10", "20", 2, [previousSet("20")])).toBe("10");
    expect(getFirstBanTeam("10", "20", 2, [previousSet(null)])).toBeNull();
  });

  it("밴 순서 변경 시 네 슬롯의 팀 배정만 맞바꾸고 영웅 선택을 유지한다", () => {
    const bans = [
      { teamId: "20", heroId: "101" },
      { teamId: "10", heroId: "102" },
      { teamId: "10", heroId: "103" },
      { teamId: "20", heroId: "104" },
    ];
    const defaults = ["20", "10", "10", "20"];

    expect(swapBanTeamAssignments(bans, defaults, "10", "20")).toEqual([
      { teamId: "10", heroId: "101" },
      { teamId: "20", heroId: "102" },
      { teamId: "20", heroId: "103" },
      { teamId: "10", heroId: "104" },
    ]);
    expect(swapBanTeamAssignments([], defaults, "10", "20").map((ban) => ban.teamId)).toEqual(["10", "20", "20", "10"]);
  });
});
