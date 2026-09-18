// lib/constants/codes.ts
// 공통 코드와 외부 채널 URL 생성에 함께 사용하는 고정값·보조 함수를 모아 둔 상수 파일이다.
/**
 * [공통코드 마스터 그룹 및 주요 세부 코드 식별자 상수]
 * - DB common_code_groups / common_codes 테이블과 동기화되는 시스템 표준 코드 정의
 */

// 1. 외부 서비스 관련 기본 URL
export const CHZZK_BASE_URL = "https://chzzk.naver.com";

// 2. 치지직 채널 고유 URL 생성 헬퍼 함수
export function getChzzkChannelUrl(channelId?: string | null): string {
  if (!channelId) return "";
  return channelId.startsWith("http") ? channelId : `${CHZZK_BASE_URL}/${channelId}`;
}

