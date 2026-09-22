// File: lib/integrations/overfast/maps.ts
// Page/Component: OverFast 맵 adapter
// Purpose: OverFast 맵 API 응답을 ROMS 관리자 화면이 사용하는 ExternalMap 형식으로 조회·변환한다.
import "server-only";
import type { ExternalMap } from "@/lib/types/maps";

const OVERFAST_MAPS_URL = "https://overfast-api.tekrop.fr/maps";

// OverFast 원본 맵 값을 기존 관리자 화면의 외부 맵 데이터 계약으로 변환한다.
function toExternalMap(map: Record<string, unknown>): ExternalMap {
  return {
    sourceKey: `OVERFAST:${String(map.name || "").trim().toLowerCase()}`,
    nameEn: String(map.name || ""),
    gamemodes: Array.isArray(map.gamemodes) ? map.gamemodes : [],
    location: String(map.location || ""),
    countryCode: String(map.country_code || ""),
    imageUrl: String(map.screenshot || ""),
    source: "OVERFAST",
  };
}

// 12시간 캐시 정책으로 OverFast 맵 목록을 조회하고 배열이 아닌 응답은 빈 목록으로 반환한다.
export async function fetchOverFastMaps(): Promise<ExternalMap[]> {
  const response = await fetch(OVERFAST_MAPS_URL, {
    next: { revalidate: 60 * 60 * 12 },
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`OverFast responded with ${response.status}`);

  const payload: unknown = await response.json();
  return Array.isArray(payload)
    ? payload.map((map) => toExternalMap((map ?? {}) as Record<string, unknown>))
    : [];
}
