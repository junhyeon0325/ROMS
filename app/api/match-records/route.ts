// File: app/api/match-records/route.ts
// Page/Component: 경기 기록 조회 API
// Purpose: 관리자에게 필터·페이지 단위 경기 목록과 선택 경기의 전체 저장 기록을 제공한다.
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-guards";
import { browseMatchRecords, findRecordDetail, findRecordFilters } from "@/lib/matches/recordBrowserService";

// 양의 정수 ID만 DB 조회 조건으로 허용한다.
function positiveId(value: string | null): bigint | null {
  return value && /^[1-9]\d*$/.test(value) ? BigInt(value) : null;
}

// 목록·선택지·상세 요청을 각각 필요한 범위로 조회한다.
export async function GET(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth) return auth;
  const params = request.nextUrl.searchParams;
  const seasonId = positiveId(params.get("seasonId"));
  if (!seasonId) return NextResponse.json({ success: false, message: "대회를 선택해주세요." }, { status: 400 });
  try {
    if (params.get("view") === "filters") {
      return NextResponse.json({ success: true, data: await findRecordFilters(seasonId) });
    }
    if (params.get("view") === "detail") {
      const matchId = positiveId(params.get("matchId"));
      if (!matchId) return NextResponse.json({ success: false, message: "경기 ID가 올바르지 않습니다." }, { status: 400 });
      const row = await findRecordDetail(seasonId, matchId);
      return row
        ? NextResponse.json({ success: true, data: row })
        : NextResponse.json({ success: false, message: "경기를 찾을 수 없습니다." }, { status: 404 });
    }
    const pageText = params.get("page") ?? "1";
    const page = Number(pageText);
    const setText = params.get("setNumber");
    const setNumber = setText ? Number(setText) : undefined;
    const teamText = params.get("teamId");
    const mapText = params.get("mapId");
    const matchText = params.get("matchId");
    if (!Number.isSafeInteger(page) || page < 1 || page > 100000 ||
      (setText && (!Number.isSafeInteger(setNumber) || setNumber! < 1)) ||
      (teamText && !positiveId(teamText)) || (mapText && !positiveId(mapText)) ||
      (matchText && !positiveId(matchText))) {
      return NextResponse.json({ success: false, message: "조회 조건이 올바르지 않습니다." }, { status: 400 });
    }
    const sortParam = params.get("sort");
    const sort = sortParam === "dateAsc" || sortParam === "stage" || sortParam === "idDesc" ? sortParam : "dateDesc";
    const data = await browseMatchRecords({
      seasonId, page, sort, search: (params.get("search") ?? "").trim().slice(0, 100),
      teamId: positiveId(teamText) ?? undefined, mapId: positiveId(mapText) ?? undefined,
      matchId: positiveId(matchText) ?? undefined, setNumber,
    });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("GET /api/match-records", error);
    return NextResponse.json({ success: false, message: "경기 기록을 불러오지 못했습니다." }, { status: 500 });
  }
}
