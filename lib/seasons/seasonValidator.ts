// 대회와 세부 일정·등수별 상금 요청을 정규화하고 검증한다.
import type { SeasonItem, SeasonRankPrize } from "@/lib/types/seasons";
import { isValidMoneyAmount } from "@/lib/seasons/money";
import { SEASON_STATUSES } from "@/lib/seasons/seasonStatus";

export type SeasonPayload = Pick<SeasonItem, "name" | "status" | "startDate" | "endDate" | "remarks"> & {
  prizeAmount: string;
  schedules: { id?: string; name: string; startDate: string | null; endDate: string | null }[];
  rankPrizes: SeasonRankPrize[];
};

// YYYY-MM-DD의 형식과 실제 달력 날짜를 함께 확인한다.
export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

// API 요청에서 화면 입력 필드만 선별하고 금액을 문자열 그대로 유지한다.
export function normalizeSeasonPayload(body: Record<string, unknown>): SeasonPayload {
  const schedules = Array.isArray(body.schedules) ? body.schedules : [];
  const rankPrizes = Array.isArray(body.rankPrizes) ? body.rankPrizes : [];
  return {
    name: typeof body.name === "string" ? body.name.trim() : "",
    status: typeof body.status === "string" ? body.status as SeasonPayload["status"] : "개최 예정",
    startDate: typeof body.startDate === "string" ? body.startDate : "",
    endDate: typeof body.endDate === "string" ? body.endDate : "",
    prizeAmount: typeof body.prizeAmount === "string" ? body.prizeAmount.trim() : "",
    remarks: typeof body.remarks === "string" ? body.remarks.trim() : "",
    schedules: schedules.map((entry: unknown) => {
      const item = entry && typeof entry === "object" ? entry as Record<string, unknown> : {};
      return {
        id: typeof item.id === "string" ? item.id : undefined,
        name: typeof item.name === "string" ? item.name.trim() : "",
        startDate: typeof item.startDate === "string" && item.startDate ? item.startDate : null,
        endDate: typeof item.endDate === "string" && item.endDate ? item.endDate : null,
      };
    }),
    rankPrizes: rankPrizes.map((entry: unknown) => {
      const item = entry && typeof entry === "object" ? entry as Record<string, unknown> : {};
      return { rank: item.rank as number, amount: typeof item.amount === "string" ? item.amount.trim() : "" };
    }),
  };
}

// 등록·수정 요청 모두 허용된 세 가지 진행 상태로 제한한다.
export function validateSeasonPayload(payload: SeasonPayload): string | null {
  if (!payload.name) return "대회명을 입력해주세요.";
  if (!(SEASON_STATUSES as readonly string[]).includes(payload.status)) return "진행 상태가 올바르지 않습니다.";
  if (!isValidDate(payload.startDate) || !isValidDate(payload.endDate)) return "진행 기간의 시작일과 종료일을 선택해주세요.";
  if (payload.endDate < payload.startDate) return "진행 기간의 종료일은 시작일보다 빠를 수 없습니다.";
  if (!isValidMoneyAmount(payload.prizeAmount)) return "총 상금은 1원 이상, 18자리 이하의 숫자로 입력해주세요.";
  for (const [index, schedule] of payload.schedules.entries()) {
    if (!schedule.name) return `${index + 1}번째 세부 일정의 이름을 입력해주세요.`;
    if (schedule.id && !/^[1-9]\d*$/.test(schedule.id)) return `${index + 1}번째 세부 일정 ID가 올바르지 않습니다.`;
    if (schedule.endDate && !schedule.startDate) return `${index + 1}번째 세부 일정의 시작일을 선택해주세요.`;
    if (schedule.startDate && !isValidDate(schedule.startDate)) return `${index + 1}번째 세부 일정의 시작일이 올바르지 않습니다.`;
    if (schedule.endDate && !isValidDate(schedule.endDate)) return `${index + 1}번째 세부 일정의 종료일이 올바르지 않습니다.`;
    if (schedule.startDate && (schedule.startDate < payload.startDate || schedule.startDate > payload.endDate)) return `${index + 1}번째 세부 일정은 대회 진행 기간 안에 있어야 합니다.`;
    if (schedule.endDate && (schedule.endDate < payload.startDate || schedule.endDate > payload.endDate)) return `${index + 1}번째 세부 일정은 대회 진행 기간 안에 있어야 합니다.`;
    if (schedule.startDate && schedule.endDate && schedule.endDate < schedule.startDate) return `${index + 1}번째 세부 일정의 종료일은 시작일보다 빠를 수 없습니다.`;
  }
  const ranks = new Set<number>();
  for (const [index, prize] of payload.rankPrizes.entries()) {
    if (!Number.isSafeInteger(prize.rank) || prize.rank < 1 || prize.rank > 2147483647) return `${index + 1}번째 등수를 올바르게 입력해주세요.`;
    if (ranks.has(prize.rank)) return "등수는 중복할 수 없습니다.";
    ranks.add(prize.rank);
    if (!isValidMoneyAmount(prize.amount)) return `${prize.rank}위 상금은 1원 이상, 18자리 이하의 숫자로 입력해주세요.`;
  }
  return null;
}
