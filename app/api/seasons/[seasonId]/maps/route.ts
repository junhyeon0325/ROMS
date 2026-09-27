// File: app/api/seasons/[seasonId]/maps/route.ts
// Page/Component: 대회 맵 구성 API
// Purpose: 관리자 인증과 입력 검증을 거쳐 시즌 맵 구성을 조회·저장한다.
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-guards";
import { findSeasonMaps, saveSeasonMaps } from "@/lib/seasons/mapPoolService";

type Context = { params: Promise<{ seasonId: string }> };

// 경로 ID를 양의 정수 BigInt로 검증한다.
async function parseSeasonId(context: Context) {
  const value = (await context.params).seasonId;
  return /^[1-9]\d*$/.test(value) ? BigInt(value) : null;
}

// 시즌에 저장된 맵과 사용 순서를 조회한다.
export async function GET(_request: NextRequest, context: Context) {
  const auth = await requireAdminApi(); if (auth) return auth;
  const seasonId = await parseSeasonId(context);
  if (!seasonId) return NextResponse.json({ success: false, message: "대회 ID가 올바르지 않습니다." }, { status: 400 });
  try { return NextResponse.json({ success: true, data: await findSeasonMaps(seasonId) }); }
  catch (error) { console.error("GET /api/seasons/[seasonId]/maps", error); return NextResponse.json({ success: false, message: "대회 맵 구성을 불러오지 못했습니다." }, { status: 500 }); }
}

// 기존 활성 맵 ID의 유일한 배열을 검증하고 순서 구성 전체를 저장한다.
export async function PUT(request: NextRequest, context: Context) {
  const auth = await requireAdminApi(); if (auth) return auth;
  const seasonId = await parseSeasonId(context);
  if (!seasonId) return NextResponse.json({ success: false, message: "대회 ID가 올바르지 않습니다." }, { status: 400 });
  try {
    const body: unknown = await request.json();
    const mapIds = (body as { mapIds?: unknown } | null)?.mapIds;
    if (!Array.isArray(mapIds) || mapIds.some((id) => typeof id !== "string" || !/^[1-9]\d*$/.test(id)) || new Set(mapIds).size !== mapIds.length)
      return NextResponse.json({ success: false, message: "맵 ID 목록이 올바르지 않거나 중복되었습니다." }, { status: 400 });
    const data = await saveSeasonMaps(seasonId, mapIds.map(BigInt));
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "대회 맵 구성을 저장하지 못했습니다.";
    const status = message === "대회를 찾을 수 없습니다." ? 404 : message.includes("맵") ? 400 : 500;
    if (status === 500) console.error("PUT /api/seasons/[seasonId]/maps", error);
    return NextResponse.json({ success: false, message: status === 500 ? "대회 맵 구성을 저장하지 못했습니다." : message }, { status });
  }
}
