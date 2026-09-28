// 팀 편성과 단일 지명 순서의 공통 입력 검증을 담당한다.
import type { DraftSaveInput } from "@/lib/types/seasonDraft";

export class DraftError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

// 요청의 ID, 팀명, 단일 소속과 지명 번호를 저장 전에 검증한다.
export function validateDraftInput(input: DraftSaveInput) {
  const ids = input.teams.flatMap((team) => team.members);
  const teamIds = input.teams.map((team) => team.id).filter((id): id is string => !!id);
  const names = input.teams.map((team) => team.name.trim());
  const teamOrders = input.teams.map((team) => team.sortOrder);
  const orders = input.draftOrders.filter((item) => item.order !== null).map((item) => item.order);
  const participantIds = input.draftOrders.map((item) => item.streamerId);
  if (names.some((name) => !name || name.length > 100) || new Set(names).size !== names.length) throw new DraftError("팀 이름을 중복 없이 1~100자로 입력해주세요.", 400);
  if (teamOrders.some((order) => !Number.isSafeInteger(order) || order < 1 || order > input.teams.length) || new Set(teamOrders).size !== teamOrders.length) throw new DraftError("팀장 순서는 1번부터 중복 없이 지정해주세요.", 400);
  if (new Set(teamIds).size !== teamIds.length || teamIds.some((id) => !/^[1-9]\d*$/.test(id))) throw new DraftError("팀 ID가 올바르지 않습니다.", 400);
  if (ids.some((id) => !/^[1-9]\d*$/.test(id)) || new Set(ids).size !== ids.length) throw new DraftError("같은 참가자를 둘 이상의 팀에 배정할 수 없습니다.", 400);
  if (participantIds.some((id) => !/^[1-9]\d*$/.test(id)) || new Set(participantIds).size !== participantIds.length) throw new DraftError("지명 대상이 중복되거나 올바르지 않습니다.", 400);
  if (orders.some((order) => !Number.isSafeInteger(order) || order! < 1) || new Set(orders).size !== orders.length) throw new DraftError("지명 순서는 중복 없는 양의 정수여야 합니다.", 400);
}
