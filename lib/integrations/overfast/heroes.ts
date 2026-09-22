// File: lib/integrations/overfast/heroes.ts
// Page/Component: OverFast 영웅 어댑터
// Purpose: OverFast 영웅 응답을 ROMS 외부 영웅 형식으로 조회·변환한다.
import "server-only";
import type { ExternalHero } from "@/lib/types/heroes";

const OVERFAST_HEROES_URL = "https://overfast-api.tekrop.fr/heroes";
const ROLE_BY_OVERFAST: Record<string, ExternalHero["role"]> = {
  tank: "TANK",
  damage: "DAMAGE",
  support: "SUPPORT",
};

// OverFast 원본 응답에서 ROMS가 지원하는 역할의 영웅만 안전하게 변환한다.
function toExternalHero(value: Record<string, unknown>): ExternalHero | null {
  const role = ROLE_BY_OVERFAST[String(value.role || "").toLowerCase()];
  const key = String(value.key || "").trim();
  const nameEn = String(value.name || "").trim();

  if (!role || !key || !nameEn) return null;

  return {
    sourceKey: `OVERFAST:${key}`,
    nameEn,
    role,
    subrole: String(value.subrole || "").trim(),
    imageUrl: String(value.portrait || "").trim(),
    source: "OVERFAST",
  };
}

// 최신 OverFast 영웅 목록을 조회해 API 계층에서 사용할 형식으로 반환한다.
export async function fetchOverFastHeroes(): Promise<ExternalHero[]> {
  const response = await fetch(OVERFAST_HEROES_URL, {
    next: { revalidate: 60 * 60 * 12 },
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`OverFast responded with ${response.status}`);
  }

  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) return [];

  return payload.flatMap((hero) => {
    if (!hero || typeof hero !== "object") return [];
    const converted = toExternalHero(hero as Record<string, unknown>);
    return converted ? [converted] : [];
  });
}
