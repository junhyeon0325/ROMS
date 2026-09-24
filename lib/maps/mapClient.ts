// File: lib/maps/mapClient.ts
// Page/Component: mapClient
// Purpose: 지도 관리 화면이 사용하는 HTTP 요청 형식을 한곳에서 유지한다.
import { getOverFastModeCodes } from "@/lib/constants/maps";
import type { ExternalMap, MapFormData, MapItem } from "@/lib/types/maps";

// 지도 목록 API를 호출한다.
export async function fetchMaps(): Promise<{
  success: boolean;
  data?: MapItem[];
  message?: string;
}> {
  return (await fetch("/api/maps")).json();
}

// 지도 저장 요청을 생성 또는 수정 흐름에 맞춰 전송한다.
export async function saveMap(
  form: MapFormData,
  id?: string | null,
): Promise<{ success: boolean; data?: MapItem; message?: string }> {
  const response = await fetch("/api/maps", {
    method: id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(id ? { ...form, id } : form),
  });
  return response.json();
}

// 외부 지도 일괄 등록 요청의 기존 API 형식을 보존한다.
export async function importMaps(
  maps: ExternalMap[],
  modeByName: Map<string, string>,
): Promise<{ success: boolean; data?: MapItem[]; message?: string }> {
  const response = await fetch("/api/maps/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      maps: maps.map((map) => ({
        nameEn: map.nameEn,
        mode:
          getOverFastModeCodes(map.gamemodes).find((code) =>
            modeByName.has(code),
          ) || "",
        location: map.location,
        countryCode: map.countryCode,
        imageUrl: map.imageUrl,
        sourceKey: map.sourceKey,
      })),
    }),
  });
  return response.json();
}
