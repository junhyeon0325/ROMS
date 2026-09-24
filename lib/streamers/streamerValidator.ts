// File: lib/streamers/streamerValidator.ts
// Page/Component: 스트리머 요청 검증
// Purpose: 스트리머 등록·수정 요청을 정규화하고 Chzzk 채널 ID를 검증한다.

import { validateHttpsImageUrl } from "@/lib/validation/imageUrlValidator";

export interface StreamerPayload {
  id?: string;
  name: string;
  isChzzk: boolean;
  chzzkChannelId: string | null;
  profileImg: string;
  hasValidProfileImg: boolean;
  memo: string;
  isUse?: boolean;
}

// URL 또는 원본 채널 ID에서 Chzzk 채널 식별자만 안전하게 추출한다.
export function extractChzzkChannelId(input?: string | null): string | null {
  if (!input?.trim()) return null;
  const channelId = input
    .trim()
    .replace(/^(https?:\/\/)?(www\.)?(m\.)?chzzk\.naver\.com\/(live\/)?/i, "")
    .split("?")[0]
    .replace(/\/$/, "")
    .trim();
  return channelId || null;
}

// 기존 API의 요청 필드를 보존한 채 서비스가 사용할 입력 형식으로 정규화한다.
export function normalizeStreamerPayload(body: Record<string, unknown>): StreamerPayload {
  const isChzzk = Boolean(body.isChzzk ?? (body.channelId || body.channelUrl));
  const hasValidProfileImg = body.profileImg === undefined || body.profileImg === null || typeof body.profileImg === "string";
  return {
    id: typeof body.id === "string" ? body.id : undefined,
    name: typeof body.name === "string" ? body.name.trim() : "",
    isChzzk,
    chzzkChannelId: isChzzk
      ? extractChzzkChannelId(
          typeof body.channelId === "string"
            ? body.channelId
            : typeof body.channelUrl === "string"
              ? body.channelUrl
              : null,
        )
      : null,
    profileImg: typeof body.profileImg === "string" ? body.profileImg.trim() : "",
    hasValidProfileImg,
    memo: typeof body.memo === "string" ? body.memo.trim() : "",
    isUse: typeof body.isUse === "boolean" ? body.isUse : undefined,
  };
}

// 등록 또는 수정에 필요한 이름·연동 채널 값을 확인하고 오류 메시지를 반환한다.
export function validateStreamerPayload(payload: StreamerPayload, isUpdate = false): string | null {
  if (isUpdate && !payload.id) return "수정할 스트리머 ID가 누락되었습니다.";
  if (!payload.name) return "스트리머 이름 또는 채널명을 입력해주세요.";
  if (!payload.hasValidProfileImg) return "프로필 이미지 URL은 문자열 또는 빈 값이어야 합니다.";
  const profileImgError = validateHttpsImageUrl(payload.profileImg);
  if (profileImgError) return profileImgError;
  if (payload.isChzzk && !payload.chzzkChannelId) {
    return "치지직 연동 등록은 [스트리머 조회]를 통해 연동할 채널을 선택해야 합니다.";
  }
  return null;
}
