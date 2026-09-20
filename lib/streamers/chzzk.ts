// File: lib/streamers/chzzk.ts
// Page/Component: Chzzk 연동 상수
// Purpose: 스트리머의 Chzzk 채널 URL을 일관되게 생성한다.

export const CHZZK_BASE_URL = "https://chzzk.naver.com";

// 채널 ID가 있을 때만 유효한 Chzzk 채널 주소를 반환한다.
export function getChzzkChannelUrl(channelId?: string | null): string {
  return channelId ? `${CHZZK_BASE_URL}/${channelId}` : "";
}
