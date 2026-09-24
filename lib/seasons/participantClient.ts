// 대회 참가자 화면의 조회·등록·역할 변경·제외 요청을 모아 둔다.
import type { SeasonParticipantRecord } from "@/lib/types/seasonParticipants";

type Result<T> = { success: boolean; data?: T; message?: string };
const url = (seasonId: string) => `/api/seasons/${encodeURIComponent(seasonId)}/participants`;

// 선택한 대회의 저장된 참가자를 불러온다.
export async function fetchParticipants(seasonId: string): Promise<Result<SeasonParticipantRecord[]>> {
  return (await fetch(url(seasonId))).json();
}

// 검색 모달에서 선택한 스트리머들을 한 번에 등록한다.
export async function addSeasonParticipants(seasonId: string, streamerIds: string[], roles: string[], positions: Record<string, string | null>): Promise<Result<SeasonParticipantRecord[]>> {
  return (await fetch(url(seasonId), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ streamerIds, roles, positions }) })).json();
}

// 수정된 참가자들의 역할·포지션을 한 번의 요청으로 저장한다.
export async function saveParticipantRoles(seasonId: string, participants: Array<{ streamerId: string; roles: string[]; position?: string | null }>): Promise<Result<SeasonParticipantRecord[]>> {
  return (await fetch(url(seasonId), { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ participants }) })).json();
}

// 참가자 한 명을 선택한 대회에서 제외한다.
export async function deleteSeasonParticipant(seasonId: string, streamerId: string): Promise<Result<undefined>> {
  return (await fetch(`${url(seasonId)}?streamerId=${encodeURIComponent(streamerId)}`, { method: "DELETE" })).json();
}
