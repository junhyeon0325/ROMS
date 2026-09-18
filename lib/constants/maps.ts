// 맵 관리 화면과 API가 공유하는 모드 그룹 및 OverFast 모드 변환 규칙이다.

// 지도 관리 화면과 API가 함께 사용하는 모드 그룹 식별자와 변환 규칙을 모아 둔 상수 파일이다.
export const MAP_MODE_GROUP_CODE = "MAP_MODE";

// OverFast 게임 모드명을 공통코드 조회용 대문자 ID 후보로 정규화한다.
export function getOverFastModeCodes(gamemodes: string[]): string[] {
  return gamemodes.map(
    (mode) => mode.trim().toUpperCase().replace(/[\s-]+/g, "_"),
  );
}
