// OverFast 영웅 목록을 관리자 가져오기 모달의 데이터 형식으로 변환한다.
import { NextResponse } from "next/server";

const OVERFAST_HEROES_URL = "https://overfast-api.tekrop.fr/heroes";
const ROLE_BY_OVERFAST: Record<string, "TANK" | "DAMAGE" | "SUPPORT"> = { tank: "TANK", damage: "DAMAGE", support: "SUPPORT" };

export const dynamic = "force-dynamic";

// 최신 OverFast 영웅 데이터 중 관리 가능한 역할군만 반환한다.
// OverFast 역할 값을 ROMS 영웅 역할군으로 변환해 반환한다.
export async function GET() {
  try {
    const response = await fetch(OVERFAST_HEROES_URL, { next: { revalidate: 60 * 60 * 12 }, headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`OverFast responded with ${response.status}`);
    const heroes = await response.json();
    const data = Array.isArray(heroes) ? heroes.flatMap((hero: Record<string, unknown>) => {
      const role = ROLE_BY_OVERFAST[String(hero.role || "").toLowerCase()];
      const key = String(hero.key || "").trim();
      const nameEn = String(hero.name || "").trim();
      return role && key && nameEn ? [{ sourceKey: `OVERFAST:${key}`, nameEn, role, subrole: String(hero.subrole || "").trim(), imageUrl: String(hero.portrait || "").trim(), source: "OVERFAST" as const }] : [];
    }) : [];
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("GET /api/overwatch/heroes error:", error);
    return NextResponse.json({ success: false, message: "외부 영웅 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요." }, { status: 502 });
  }
}
