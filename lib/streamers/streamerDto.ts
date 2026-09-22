// File: lib/streamers/streamerDto.ts
// Page/Component: 스트리머 DTO
// Purpose: Prisma Streamer 모델을 기존 관리자 API 응답 형식으로 변환한다.

import type { Streamer } from "@prisma/client";
import { CHZZK_BASE_URL } from "@/lib/streamers/chzzk";
import type { StreamerItem } from "@/lib/types/streamers";

// DB의 BigInt와 nullable 필드를 화면에서 사용하는 스트리머 형식으로 직렬화한다.
export function formatStreamerDto(streamer: Streamer): StreamerItem {
  const channelId = streamer.chzzkChannelId || "";
  const isChzzk = Boolean(channelId);

  return {
    id: streamer.id.toString(),
    name: streamer.name,
    profileImg: streamer.profileImageUrl || "",
    channelUrl: channelId ? `${CHZZK_BASE_URL}/${channelId}` : "",
    channelId,
    isChzzk,
    type: isChzzk ? "치지직 연동" : "일반 등록",
    followers: isChzzk ? "연동됨" : "—",
    registeredDate: streamer.createdAt.toISOString().split("T")[0],
    memo: streamer.remarks || "",
    isUse: streamer.isUse ?? true,
  };
}
