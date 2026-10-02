// File: app/api/match-statistics/route.ts
// Page/Component: 경기 통계 조회 API
// Purpose: 관리자에게 시즌별 선수·맵·영웅 집계와 해당 경기 목록을 읽기 전용으로 제공한다.
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-guards";
import { browseStatisticMatches, browseStatistics, findStatisticsFilters, type StatisticsQuery, type StatisticsTab } from "@/lib/matches/statisticsService";

// 양의 정수만 DB ID와 페이지 번호로 허용한다.
function positiveId(value: string | null): bigint | undefined {
  return value && /^[1-9]\d*$/.test(value) ? BigInt(value) : undefined;
}

// 필터·목록·행별 경기를 요청할 때 권한과 입력을 먼저 검증한다.
export async function GET(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth) return auth;
  const params = request.nextUrl.searchParams;
  const seasonId = positiveId(params.get("seasonId"));
  const page = Number(params.get("page") ?? "1");
  const tab = params.get("tab") ?? "players";
  const view = params.get("view") ?? "list";
  const sort = params.get("sort") ?? "sets";
  const allowedSort = ["name", "matches", "sets", "wins", "rate", "uses"] as const;
  const ids = ["teamId", "mapId", "playerId", "heroId", "detailId"] as const;
  if (!seasonId || !Number.isSafeInteger(page) || page < 1 || page > 100000 ||
      !["players", "maps", "heroes"].includes(tab) || !["list", "filters", "matches"].includes(view) ||
      !allowedSort.some((item) => item === sort) ||
      ids.some((name) => params.get(name) && !positiveId(params.get(name))) ||
      (view === "matches" && !positiveId(params.get("detailId")))) {
    return NextResponse.json({ success: false, message: "조회 조건이 올바르지 않습니다." }, { status: 400 });
  }
  try {
    if (view === "filters") return NextResponse.json({ success: true, data: await findStatisticsFilters(seasonId) });
    const query: StatisticsQuery = {
      seasonId, page, tab: tab as StatisticsTab, sort: sort as StatisticsQuery["sort"],
      search: (params.get("search") ?? "").trim().slice(0, 100),
      teamId: positiveId(params.get("teamId")), mapId: positiveId(params.get("mapId")),
      playerId: positiveId(params.get("playerId")), heroId: positiveId(params.get("heroId")),
      detailId: positiveId(params.get("detailId")),
    };
    const data = view === "matches" ? await browseStatisticMatches(query) : await browseStatistics(query);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("GET /api/match-statistics", error);
    return NextResponse.json({ success: false, message: "경기 통계를 불러오지 못했습니다." }, { status: 500 });
  }
}
