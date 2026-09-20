// File: lib/streamers/streamerService.ts
// Page/Component: 스트리머 서비스
// Purpose: 스트리머 Prisma 조회·등록·수정과 Chzzk 채널 중복 검사를 담당한다.

import { prisma } from "@/lib/prisma";
import { formatStreamerDto } from "@/lib/streamers/streamerDto";
import type { StreamerPayload } from "@/lib/streamers/streamerValidator";

// 생성일 역순으로 스트리머 목록을 조회한다.
export async function findStreamers() {
  const streamers = await prisma.streamer.findMany({ orderBy: { createdAt: "desc" } });
  return streamers.map(formatStreamerDto);
}

// 채널 ID가 다른 스트리머에 이미 연결됐는지 확인한다.
export async function findStreamerByChzzkChannelId(channelId: string) {
  return prisma.streamer.findFirst({ where: { chzzkChannelId: channelId } });
}

// 정규화된 요청으로 새 스트리머를 생성하고 API DTO를 반환한다.
export async function createStreamer(payload: StreamerPayload) {
  const streamer = await prisma.streamer.create({
    data: {
      name: payload.name,
      profileImageUrl: payload.profileImg || null,
      chzzkChannelId: payload.chzzkChannelId,
      isUse: payload.isUse !== false,
      remarks: payload.memo || null,
    },
  });
  return formatStreamerDto(streamer);
}

// 정규화된 요청으로 기존 스트리머를 수정하고 API DTO를 반환한다.
export async function updateStreamer(payload: StreamerPayload) {
  const streamer = await prisma.streamer.update({
    where: { id: BigInt(payload.id!) },
    data: {
      name: payload.name,
      profileImageUrl: payload.profileImg || null,
      chzzkChannelId: payload.chzzkChannelId,
      ...(payload.isUse !== undefined ? { isUse: payload.isUse } : {}),
      remarks: payload.memo || null,
    },
  });
  return formatStreamerDto(streamer);
}
