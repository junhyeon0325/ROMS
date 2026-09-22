// File: lib/integrations/chzzk/channels.ts
// Page/Component: Chzzk 채널 adapter
// Purpose: Chzzk 채널 조회 API를 호출하고 관리자 스트리머 화면의 검색 결과 형식으로 변환한다.
import "server-only";
import type { ChzzkChannelCandidate } from "@/lib/types/streamers";

const CHZZK_API_BASE_URL = "https://api.chzzk.naver.com/service/v1";
const CHZZK_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json",
};

type ChzzkLookupResult = {
  isDirectLookup: boolean;
  channel: ChzzkChannelCandidate;
  channels: ChzzkChannelCandidate[];
};

// route가 기존 HTTP 상태 코드와 메시지를 그대로 반환할 수 있도록 조회 실패 정보를 전달한다.
export class ChzzkChannelLookupError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

// 팔로워 수를 기존 스트리머 검색 화면의 표시 문자열로 변환한다.
function formatFollowers(count?: number): string {
  if (!count && count !== 0) return "—";
  if (count >= 10000) return `${(count / 10000).toFixed(1)}만`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return String(count);
}

// Chzzk 채널 원본 값을 기존 스트리머 선택 후보 데이터 형식으로 변환한다.
function toChzzkChannelCandidate(channel: any): ChzzkChannelCandidate {
  return {
    channelId: channel.channelId,
    channelName: channel.channelName,
    channelImageUrl: channel.channelImageUrl || null,
    followerCount: channel.followerCount || 0,
    followerText: formatFollowers(channel.followerCount),
    channelDescription: channel.channelDescription || "",
    openLive: channel.openLive || false,
    verifiedMark: channel.verifiedMark || false,
  };
}

// 채널명 일치·팔로워 수 기준으로 기존 검색 결과 우선순위를 적용한다.
function sortChzzkChannels(channels: ChzzkChannelCandidate[], searchTarget: string) {
  channels.sort((a, b) => {
    const aLower = a.channelName.toLowerCase();
    const bLower = b.channelName.toLowerCase();
    const targetLower = searchTarget.toLowerCase();
    const aExact = aLower === targetLower;
    const bExact = bLower === targetLower;

    if (aExact !== bExact) {
      if (aExact && (a.followerCount > 100 || a.verifiedMark)) return -1;
      if (bExact && (b.followerCount > 100 || b.verifiedMark)) return 1;
    }
    return (b.followerCount || 0) - (a.followerCount || 0);
  });
}

// URL·채널 ID·검색어를 처리해 상세 조회 또는 채널 검색 결과를 반환한다.
export async function lookupChzzkChannels(query: string): Promise<ChzzkLookupResult> {
  let cleaned = query.trim();
  cleaned = cleaned.replace(/^https?:\/\/(www\.)?chzzk\.naver\.com\/(live\/)?/i, "");
  cleaned = cleaned.split("?")[0].replace(/\/$/, "").trim();

  if (/^[0-9a-f]{32}$/i.test(cleaned)) {
    try {
      const detailResponse = await fetch(`${CHZZK_API_BASE_URL}/channels/${cleaned}`, {
        headers: CHZZK_HEADERS,
        next: { revalidate: 60 },
      });
      if (detailResponse.ok) {
        const detailData = await detailResponse.json();
        if (detailData.code === 200 && detailData.content) {
          const channel = toChzzkChannelCandidate(detailData.content);
          return { isDirectLookup: true, channel, channels: [channel] };
        }
      }
    } catch {
      // 상세 조회 실패는 기존 동작과 같이 채널명 검색으로 폴백한다.
    }
  }

  const searchTarget = cleaned || query.trim();
  const searchResponse = await fetch(
    `${CHZZK_API_BASE_URL}/search/channels?keyword=${encodeURIComponent(searchTarget)}&offset=0&size=15`,
    { headers: CHZZK_HEADERS, next: { revalidate: 60 } },
  );
  if (!searchResponse.ok) {
    throw new ChzzkChannelLookupError(`치지직 API 호출 실패 (${searchResponse.status})`, 502);
  }

  const searchData = await searchResponse.json();
  const channelList = searchData.content?.data;
  if (!channelList || channelList.length === 0) {
    throw new ChzzkChannelLookupError(`치지직에서 [${searchTarget}] 채널을 찾을 수 없습니다.`, 404);
  }

  const channels = channelList
    .map((item: any) => (item.channel ? toChzzkChannelCandidate(item.channel) : null))
    .filter((channel: ChzzkChannelCandidate | null): channel is ChzzkChannelCandidate => Boolean(channel));
  sortChzzkChannels(channels, searchTarget);
  return { isDirectLookup: false, channel: channels[0], channels };
}
