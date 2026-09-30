// File: app/api/maps/[mapId]/subareas/route.ts
// Page/Component: 맵 세부 지역 API
// Purpose: 관리자 인증 후 맵별 세부 지역을 조회하고 일괄 저장한다.
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-guards";
import { findMapSubareas, MapSubareaError, saveMapSubareas } from "@/lib/maps/mapSubareaService";

type Context = { params: Promise<{ mapId: string }> };

// 경로의 맵 ID를 양의 정수로 확인한다.
async function parseMapId(context: Context): Promise<bigint | null> {
  const value = (await context.params).mapId;
  return /^[1-9]\d*$/.test(value) ? BigInt(value) : null;
}

// 세부 지역 조회·저장 오류를 관리자 API 응답으로 변환한다.
function failure(error: unknown) {
  if (error instanceof MapSubareaError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
  console.error("map subareas API", error);
  return NextResponse.json({ success: false, message: "맵 세부 지역을 처리하지 못했습니다." }, { status: 500 });
}

// 선택한 맵의 세부 지역을 정렬 순서대로 조회한다.
export async function GET(_request: NextRequest, context: Context) {
  const auth = await requireAdminApi(); if (auth) return auth;
  const mapId = await parseMapId(context);
  if (!mapId) return NextResponse.json({ success: false, message: "맵 ID가 올바르지 않습니다." }, { status: 400 });
  try { return NextResponse.json({ success: true, data: await findMapSubareas(mapId) }); } catch (error) { return failure(error); }
}

// 선택한 맵의 세부 지역 목록을 한 번에 교체한다.
export async function PUT(request: NextRequest, context: Context) {
  const auth = await requireAdminApi(); if (auth) return auth;
  const mapId = await parseMapId(context);
  if (!mapId) return NextResponse.json({ success: false, message: "맵 ID가 올바르지 않습니다." }, { status: 400 });
  try {
    const body = await request.json() as { subareas?: unknown };
    return NextResponse.json({ success: true, data: await saveMapSubareas(mapId, body?.subareas) });
  } catch (error) { return failure(error); }
}
