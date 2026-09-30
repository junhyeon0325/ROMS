// 경기 시간의 화면 표시 형식과 초 단위 저장 형식을 변환한다.

// 저장된 초를 분:초 문자열로 표시한다.
export function formatGameDuration(seconds: number | null): string {
  if (seconds === null) return "";
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

// 입력 중인 분:초 문자열을 초로 변환하고 잘못된 형식은 undefined로 구분한다.
export function parseGameDuration(value: string): number | null | undefined {
  if (!value.trim()) return null;
  const match = /^(\d+):([0-5]?\d)$/.exec(value.trim());
  if (!match) return undefined;
  const seconds = Number(match[1]) * 60 + Number(match[2]);
  return Number.isSafeInteger(seconds) && seconds > 0 ? seconds : undefined;
}
