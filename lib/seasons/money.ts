// 상금의 화면 표시 문자열과 정확한 정수 저장 문자열을 구분한다.

// 입력 중인 숫자 문자열에만 천 단위 콤마를 적용한다.
export function formatMoneyInput(value: string): string {
  if (!/^\d*$/.test(value)) return value;
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// 기존 원화 표시 문자열에서 유효한 정수 금액만 복원한다.
export function parseLegacyPrize(value: string): string | null {
  const match = value.trim().match(/^((?:\d{1,3}(?:,\d{3})+)|\d+)\s*원?$/);
  return match ? match[1].replaceAll(",", "") : null;
}

// API에서 허용하는 원화 정수 범위를 정확한 문자열로 검사한다.
export function isValidMoneyAmount(value: string): boolean {
  return /^\d{1,18}$/.test(value) && !/^0+$/.test(value);
}
