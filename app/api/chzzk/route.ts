// app/api/chzzk/route.ts
/**
 * [치지직 채널 정보 조회 API 엔드포인트]
 * - 네이버 치지직 공식/서비스 API를 서버사이드에서 프록시 조회하여 브라우저 CORS 문제 해결
 * - 치지직 채널 URL, 32자리 채널 ID 해시, 또는 스트리머 이름 검색 지원
 */
import { NextRequest, NextResponse } from "next/server";

function formatFollowers(count?: number): string {
  if (!count && count !== 0) return "—";
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}만`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return String(count);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query || !query.trim()) {
    return NextResponse.json(
      { success: false, message: "조회할 치지직 채널 주소, ID 또는 스트리머 이름을 입력해주세요." },
      { status: 400 }
    );
  }

  // URL 및 문자열 전처리
  let cleaned = query.trim();
  cleaned = cleaned.replace(/^https?:\/\/(www\.)?chzzk\.naver\.com\/(live\/)?/i, "");
  cleaned = cleaned.split("?")[0].replace(/\/$/, "").trim();

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "application/json",
  };

  try {
    // 1) 32자리 16진수 채널 ID 패턴인 경우 상세 조회 우선 시도
    if (/^[0-9a-f]{32}$/i.test(cleaned)) {
      try {
        const detailRes = await fetch(
          `https://api.chzzk.naver.com/service/v1/channels/${cleaned}`,
          { headers, next: { revalidate: 60 } }
        );
        if (detailRes.ok) {
          const detailData = await detailRes.json();
          if (detailData.code === 200 && detailData.content) {
            const ch = detailData.content;
            const singleChannel = {
              channelId: ch.channelId,
              channelName: ch.channelName,
              channelImageUrl: ch.channelImageUrl || null,
              followerCount: ch.followerCount || 0,
              followerText: formatFollowers(ch.followerCount),
              channelDescription: ch.channelDescription || "",
              openLive: ch.openLive || false,
              verifiedMark: ch.verifiedMark || false,
            };
            return NextResponse.json({
              success: true,
              isDirectLookup: true,
              channel: singleChannel,
              channels: [singleChannel],
            });
          }
        }
      } catch (err) {
        // 상세 조회 실패 시 검색으로 폴백
      }
    }

    // 2) 채널명 검색 API 호출 (스트리머 이름, 별칭, 키워드 등)
    const searchTarget = cleaned || query.trim();
    const searchRes = await fetch(
      `https://api.chzzk.naver.com/service/v1/search/channels?keyword=${encodeURIComponent(
        searchTarget
      )}&offset=0&size=15`,
      { headers, next: { revalidate: 60 } }
    );

    if (!searchRes.ok) {
      return NextResponse.json(
        { success: false, message: `치지직 API 호출 실패 (${searchRes.status})` },
        { status: 502 }
      );
    }

    const searchData = await searchRes.json();
    const channelList = searchData.content?.data;

    if (!channelList || channelList.length === 0) {
      return NextResponse.json(
        { success: false, message: `치지직에서 [${searchTarget}] 채널을 찾을 수 없습니다.` },
        { status: 404 }
      );
    }

    // 채널 정보 목록 매핑
    const channels = channelList
      .map((item: any) => {
        const ch = item.channel;
        if (!ch) return null;
        return {
          channelId: ch.channelId,
          channelName: ch.channelName,
          channelImageUrl: ch.channelImageUrl || null,
          followerCount: ch.followerCount || 0,
          followerText: formatFollowers(ch.followerCount),
          channelDescription: ch.channelDescription || "",
          openLive: ch.openLive || false,
          verifiedMark: ch.verifiedMark || false,
        };
      })
      .filter(Boolean);

    // 스마트 정렬:
    // 1) 검색어와 채널명이 정확히 일치하면서 일정 규모 이상(또는 인증 마크)인 계정 최우선
    // 2) 그 외에는 팔로워 수(followerCount) 내림차순으로 정렬
    channels.sort((a: any, b: any) => {
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

    return NextResponse.json({
      success: true,
      isDirectLookup: false,
      channel: channels[0],
      channels: channels,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "치지직 채널 조회 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
