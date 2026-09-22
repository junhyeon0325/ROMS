// File: app/api/heroes/import/route.ts
// Page/Component: 영웅 일괄 등록 API
// Purpose: 관리자 인증 후 영웅 도메인 서비스에 일괄 등록 요청을 전달한다.
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-guards";
import { HeroImportValidationError, importHeroes } from "@/lib/heroes/heroService";

// 요청 형식을 유지하며 영웅 도메인 서비스의 결과를 HTTP 응답으로 변환한다.
export async function POST(request: NextRequest) {
  const authError = await requireAdminApi();
  if (authError) return authError;
  try {
    const body = await request.json();
    if (!Array.isArray(body.heroes) || body.heroes.length === 0) return NextResponse.json({ success: false, message: "등록할 신규 영웅을 선택해 주세요." }, { status: 400 });
    return NextResponse.json({ success: true, data: await importHeroes(body.heroes) });
  } catch (error) {
    console.error("POST /api/heroes/import error:", error);
    if (error instanceof HeroImportValidationError) return NextResponse.json({ success: false, message: error.message }, { status: 409 });
    return NextResponse.json({ success: false, message: "신규 영웅을 등록하지 못했습니다." }, { status: 500 });
  }
}
