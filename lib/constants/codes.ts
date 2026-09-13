// lib/constants/codes.ts
/**
 * [공통코드 마스터 그룹 및 주요 세부 코드 식별자 상수]
 * - DB common_code_groups / common_codes 테이블과 동기화되는 시스템 표준 코드 정의
 */

// 1. 공통코드 그룹 ID (group_code)
export const CODE_GROUPS = {
  STREAMER_REGISTRATION: "STREAMER_REGISTRATION_METHOD", // 스트리머 등록 방식
} as const;

// 2. 스트리머 등록 방식 세부 코드 (code)
export const STREAMER_REG_CODES = {
  CHZZK: "CONNECT_TO_CHZZK", // 치지직 연동
  STANDARD: "STANDARD_REGISTRATION", // 일반 등록
} as const;

// 3. 외부 서비스 관련 기본 URL
export const CHZZK_BASE_URL = "https://chzzk.naver.com";

