// OverFast 영웅 목록을 관리자 가져오기 모달의 데이터 형식으로 변환한다.
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-guards";
import { fetchOverFastHeroes } from "@/lib/integrations/overfast/heroes";

export const dynamic = "force-dynamic";

// 최신 OverFast 영웅 데이터 중 관리 가능한 역할군만 반환한다.
// OverFast 역할 값을 ROMS 영웅 역할군으로 변환해 반환한다.
export async function GET() {
  const authError = await requireAdminApi();
  if (authError) return authError;

  try {
    return NextResponse.json({ success: true, data: await fetchOverFastHeroes() });
  } catch (error) {
    console.error("GET /api/overwatch/heroes error:", error);
    return NextResponse.json({ success: false, message: "외부 영웅 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요." }, { status: 502 });
  }
}
