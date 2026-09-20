// 관리자 요청으로 OverFast 맵 데이터를 조회해 관리자 화면용 형식으로 반환한다.
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-guards";

const OVERFAST_MAPS_URL = "https://overfast-api.tekrop.fr/maps";

// 관리자 요청마다 경로를 동적으로 처리하되 외부 응답은 짧게 캐시한다.
export const dynamic = "force-dynamic";

// 인증된 관리자에게만 외부 맵 목록을 조회해 화면에서 사용할 데이터로 변환한다.
export async function GET() {
  const authError = await requireAdminApi();
  if (authError) return authError;

  try {
    const response = await fetch(OVERFAST_MAPS_URL, { next: { revalidate: 60 * 60 * 12 }, headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`OverFast responded with ${response.status}`);
    const maps = await response.json();
    const data = Array.isArray(maps) ? maps.map((map: any) => ({
      sourceKey: `OVERFAST:${String(map.name || "").trim().toLowerCase()}`,
      nameEn: map.name || "", gamemodes: Array.isArray(map.gamemodes) ? map.gamemodes : [],
      location: map.location || "", countryCode: map.country_code || "", imageUrl: map.screenshot || "", source: "OVERFAST" as const,
    })) : [];
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("GET /api/overwatch/maps error:", error);
    return NextResponse.json({ success: false, message: "외부 맵 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 502 });
  }
}
