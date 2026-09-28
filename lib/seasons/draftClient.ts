// 관리자 팀 편성 화면의 시즌별 조회·저장 요청을 처리한다.
import type { DraftSaveInput, SeasonDraft } from "@/lib/types/seasonDraft";

type Result = { success: boolean; data?: SeasonDraft; message?: string };
const url = (seasonId: string) => `/api/seasons/${encodeURIComponent(seasonId)}/draft`;

// 등록 참가자와 저장된 팀 편성을 불러온다.
export async function fetchSeasonDraft(seasonId: string): Promise<Result> {
  return (await fetch(url(seasonId))).json();
}

// 팀과 지명 순서의 전체 변경 사항을 저장한다.
export async function saveSeasonDraftClient(seasonId: string, input: DraftSaveInput): Promise<Result> {
  return (await fetch(url(seasonId), { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) })).json();
}
