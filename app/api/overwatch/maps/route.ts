import { NextResponse } from "next/server";

const OVERFAST_MAPS_URL = "https://overfast-api.tekrop.fr/maps";

// The administrator explicitly refreshes this source. Keep the route dynamic
// while letting the upstream response use Next's short-lived data cache.
export const dynamic = "force-dynamic";

export async function GET() {
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
