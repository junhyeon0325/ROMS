// File: app/api/player-pair-statistics/route.ts
// Page/Component: 선수별 맵·영웅 개별 통계 API
// Purpose: 관리자에게 선수·맵 또는 선수·영웅 조합의 읽기 전용 집계를 제공한다.
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-guards";
import { browsePlayerPairStatistics, findPlayerPairFilters, type PairKind, type PairQuery } from "@/lib/matches/playerPairStatisticsService";

// 양의 정수만 DB ID로 변환한다.
function positiveId(value: string | null): bigint | undefined {
  return value && /^[1-9]\d*$/.test(value) ? BigInt(value) : undefined;
}

// 관리자 권한과 조회 조건을 검증한 뒤 필요한 페이지 또는 필터만 조회한다.
export async function GET(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth) return auth;
  const params = request.nextUrl.searchParams;
  const kind = params.get("kind");
  const seasonId = positiveId(params.get("seasonId"));
  const page = Number(params.get("page") ?? "1");
  const sort = params.get("sort") ?? "uses";
  const sorts: PairQuery["sort"][] = ["uses", "matches", "wins", "rate", "player", "item"];
  if ((kind !== "map" && kind !== "hero") || !seasonId ||
    !Number.isSafeInteger(page) || page < 1 || page > 100000 ||
    !sorts.includes(sort as PairQuery["sort"]) ||
    ["playerId", "itemId"].some((key) => params.get(key) && !positiveId(params.get(key))) ||
    (params.get("view") && params.get("view") !== "filters")) {
    return NextResponse.json({ success: false, message: "조회 조건이 올바르지 않습니다." }, { status: 400 });
  }
  try {
    const data = params.get("view") === "filters"
      ? await findPlayerPairFilters(kind as PairKind, seasonId)
      : await browsePlayerPairStatistics({ kind: kind as PairKind, seasonId, page,
        sort: sort as PairQuery["sort"], playerId: positiveId(params.get("playerId")),
        itemId: positiveId(params.get("itemId")), search: (params.get("search") ?? "").trim().slice(0, 100) });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("GET /api/player-pair-statistics", error);
    return NextResponse.json({ success: false, message: "선수별 통계를 불러오지 못했습니다." }, { status: 500 });
  }
}
