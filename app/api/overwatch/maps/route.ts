// 관리자 요청으로 OverFast 맵 데이터를 조회해 관리자 화면용 형식으로 반환한다.
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-guards";
import { fetchOverFastMaps } from "@/lib/integrations/overfast/maps";

// 관리자 요청마다 경로를 동적으로 처리하되 외부 응답은 짧게 캐시한다.
export const dynamic = "force-dynamic";

// 인증된 관리자 요청을 확인하고 OverFast 맵 adapter 결과를 기존 응답 계약으로 반환한다.
export async function GET() {
  const authError = await requireAdminApi();
  if (authError) return authError;

  try {
    return NextResponse.json({ success: true, data: await fetchOverFastMaps() });
  } catch (error) {
    console.error("GET /api/overwatch/maps error:", error);
    return NextResponse.json({ success: false, message: "외부 맵 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 502 });
  }
}
