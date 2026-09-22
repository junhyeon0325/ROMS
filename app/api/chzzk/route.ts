// app/api/chzzk/route.ts
/**
 * [치지직 채널 정보 조회 API 엔드포인트]
 * - 네이버 치지직 공식/서비스 API를 서버사이드에서 프록시 조회하여 브라우저 CORS 문제 해결
 * - 치지직 채널 URL, 32자리 채널 ID 해시, 또는 스트리머 이름 검색 지원
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-guards";
import { ChzzkChannelLookupError, lookupChzzkChannels } from "@/lib/integrations/chzzk/channels";

export async function GET(request: NextRequest) {
  const authError = await requireAdminApi();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query || !query.trim()) {
    return NextResponse.json(
      { success: false, message: "조회할 치지직 채널 주소, ID 또는 스트리머 이름을 입력해주세요." },
      { status: 400 }
    );
  }

  try {
    const result = await lookupChzzkChannels(query);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof ChzzkChannelLookupError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    }
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "치지직 채널 조회 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
