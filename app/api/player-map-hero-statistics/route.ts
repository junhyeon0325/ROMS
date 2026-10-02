// File: app/api/player-map-hero-statistics/route.ts
// Page/Component: 선수별 맵·영웅 통계 API
// Purpose: 관리자 권한으로 저장 기록의 조합별 통계와 필터 선택지를 조회한다.
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-guards";
import { browsePlayerMapHeroStatistics, findPlayerMapHeroFilters, type UsageQuery } from "@/lib/matches/playerMapHeroStatisticsService";

// 양의 정수만 데이터베이스 ID로 변환한다.
function positiveId(value: string | null): bigint | undefined {
  return value && /^[1-9]\d*$/.test(value) ? BigInt(value) : undefined;
}

// 관리자 권한과 필터·페이지·정렬 입력을 검증한 뒤 읽기 전용 집계를 반환한다.
export async function GET(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth) return auth;
  const params = request.nextUrl.searchParams;
  const seasonId = positiveId(params.get("seasonId"));
  const page = Number(params.get("page") ?? "1");
  const sort = params.get("sort") ?? "uses";
  const allowedSort: UsageQuery["sort"][] = ["uses", "matches", "wins", "rate", "player", "map", "hero"];
  if (!seasonId || !Number.isSafeInteger(page) || page < 1 || page > 100000 ||
    !allowedSort.includes(sort as UsageQuery["sort"]) ||
    ["playerId", "mapId", "heroId"].some((key) => params.get(key) && !positiveId(params.get(key))) ||
    (params.get("view") && params.get("view") !== "filters")) {
    return NextResponse.json({ success: false, message: "조회 조건이 올바르지 않습니다." }, { status: 400 });
  }
  try {
    const data = params.get("view") === "filters" ? await findPlayerMapHeroFilters(seasonId) :
      await browsePlayerMapHeroStatistics({ seasonId, page, sort: sort as UsageQuery["sort"],
        playerId: positiveId(params.get("playerId")), mapId: positiveId(params.get("mapId")),
        heroId: positiveId(params.get("heroId")), search: (params.get("search") ?? "").trim().slice(0, 100) });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("GET /api/player-map-hero-statistics", error);
    return NextResponse.json({ success: false, message: "선수별 맵·영웅 통계를 불러오지 못했습니다." }, { status: 500 });
  }
}
