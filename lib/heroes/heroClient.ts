// File: lib/heroes/heroClient.ts
// Page/Component: heroClient
// Purpose: 영웅 관리 화면의 HTTP 요청 형식과 응답 타입을 일관되게 유지한다.
import type { ExternalHero, HeroItem } from "@/lib/types/heroes";

// 영웅 목록 API를 호출한다.
export async function fetchHeroes(): Promise<{ success: boolean; data?: HeroItem[]; message?: string }> {
  return (await fetch("/api/heroes")).json();
}

// OverFast 영웅 목록 API를 호출한다.
export async function fetchOverFastHeroes(): Promise<{ success: boolean; data?: ExternalHero[]; message?: string }> {
  return (await fetch("/api/overwatch/heroes")).json();
}

export type HeroFormData = Pick<
  HeroItem,
  "nameKr" | "nameEn" | "role" | "isPickable" | "imageUrl" | "desc"
>;

// 영웅 저장 요청을 생성 또는 수정 흐름에 맞춰 전송한다.
export async function saveHero(
  form: HeroFormData,
  id?: string | null,
): Promise<{ success: boolean; data?: HeroItem; message?: string }> {
  const response = await fetch("/api/heroes", {
    method: id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(id ? { ...form, id } : form),
  });
  return response.json();
}

// 외부 영웅 일괄 등록 요청의 기존 API 형식을 보존한다.
export async function importHeroes(
  heroes: ExternalHero[],
): Promise<{ success: boolean; data?: HeroItem[]; message?: string }> {
  const response = await fetch("/api/heroes/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ heroes }),
  });
  return response.json();
}
