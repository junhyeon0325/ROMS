// File: app/api/seasons/route.ts
// Page/Component: 대회 API
// Purpose: 관리자 인증 뒤 대회·세부 일정·등수별 상금의 조회·등록·수정·삭제를 처리한다.
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-guards";
import { createSeason, deleteSeason, findSeasons, updateSeason } from "@/lib/seasons/seasonService";
import { normalizeSeasonPayload, validateSeasonPayload } from "@/lib/seasons/seasonValidator";

// 숫자형 대회 ID만 허용한다.
function parseId(value: unknown): bigint | null {
  return typeof value === "string" && /^[1-9]\d*$/.test(value) ? BigInt(value) : null;
}

// 대회 목록을 조회한다.
export async function GET() {
  const auth = await requireAdminApi(); if (auth) return auth;
  try { return NextResponse.json({ success: true, data: await findSeasons() }); }
  catch (error) { console.error("GET /api/seasons", error); return NextResponse.json({ success: false, message: "대회 목록을 불러오지 못했습니다." }, { status: 500 }); }
}

// 새 대회와 세부 일정·등수별 상금을 등록한다.
export async function POST(request: NextRequest) {
  const auth = await requireAdminApi(); if (auth) return auth;
  try {
    const payload = normalizeSeasonPayload(await request.json());
    const message = validateSeasonPayload(payload);
    if (message) return NextResponse.json({ success: false, message }, { status: 400 });
    return NextResponse.json({ success: true, data: await createSeason(payload) });
  } catch (error) { console.error("POST /api/seasons", error); return NextResponse.json({ success: false, message: "대회 등록에 실패했습니다." }, { status: 500 }); }
}

// 기존 대회의 정보를 수정한다.
export async function PUT(request: NextRequest) {
  const auth = await requireAdminApi(); if (auth) return auth;
  try {
    const body = await request.json(); const id = parseId(body.id);
    if (!id) return NextResponse.json({ success: false, message: "대회 ID가 올바르지 않습니다." }, { status: 400 });
    const payload = normalizeSeasonPayload(body);
    const message = validateSeasonPayload(payload);
    if (message) return NextResponse.json({ success: false, message }, { status: 400 });
    return NextResponse.json({ success: true, data: await updateSeason(id, payload) });
  } catch (error) { console.error("PUT /api/seasons", error); return NextResponse.json({ success: false, message: "대회 수정에 실패했습니다." }, { status: 500 }); }
}

// 선택된 대회를 삭제한다.
export async function DELETE(request: NextRequest) {
  const auth = await requireAdminApi(); if (auth) return auth;
  const id = parseId(request.nextUrl.searchParams.get("id"));
  if (!id) return NextResponse.json({ success: false, message: "대회 ID가 올바르지 않습니다." }, { status: 400 });
  if (parseId(request.nextUrl.searchParams.get("confirmId")) !== id) return NextResponse.json({ success: false, message: "삭제 확인 정보가 필요합니다." }, { status: 400 });
  try { await deleteSeason(id); return NextResponse.json({ success: true }); }
  catch (error) {
    console.error("DELETE /api/seasons", error);
    return NextResponse.json({ success: false, message: "대회 삭제에 실패했습니다." }, { status: 500 });
  }
}
