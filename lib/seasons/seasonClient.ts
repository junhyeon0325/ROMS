// 대회 등록 화면의 서버 저장 요청을 모아 둔다.
import type { SeasonItem } from "@/lib/types/seasons";
import type { SeasonPayload } from "@/lib/seasons/seasonValidator";

type Result<T> = { success: boolean; data?: T; message?: string };

// 등록된 대회를 조회한다.
export async function fetchSeasons(): Promise<Result<SeasonItem[]>> {
  return (await fetch("/api/seasons")).json();
}

// 신규 등록 또는 기존 대회 수정을 요청한다.
export async function saveSeason(payload: SeasonPayload, id?: string): Promise<Result<SeasonItem>> {
  return (await fetch("/api/seasons", { method: id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, id }) })).json();
}

// 선택된 대회의 삭제를 요청한다.
export async function removeSeason(id: string): Promise<Result<undefined>> {
  return (await fetch(`/api/seasons?id=${encodeURIComponent(id)}&confirmId=${encodeURIComponent(id)}`, { method: "DELETE" })).json();
}
