// File: app/api/streamers/route.ts
// Page/Component: streamers API route
// Purpose: 스트리머 목록 조회와 등록·수정 요청을 인증 후 서비스 계층에 전달한다.

import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-guards";
import { createStreamer, findStreamerByChzzkChannelId, findStreamers, updateStreamer } from "@/lib/streamers/streamerService";
import { normalizeStreamerPayload, validateStreamerPayload } from "@/lib/streamers/streamerValidator";

// 예외 객체에서 기존 API 응답의 error 필드에 넣을 메시지를 추출한다.
function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

// 스트리머 목록을 기존 응답 형식으로 조회한다.
export async function GET() {
  const authError = await requireAdminApi();
  if (authError) return authError;
  try {
    return NextResponse.json({ success: true, data: await findStreamers() });
  } catch (error) {
    console.error("GET /api/streamers error:", error);
    return NextResponse.json({ success: false, message: "스트리머 목록을 불러오지 못했습니다.", error: getErrorMessage(error) }, { status: 500 });
  }
}

// 신규 스트리머 요청을 검증하고 동일 Chzzk 채널 중복 없이 등록한다.
export async function POST(request: NextRequest) {
  const authError = await requireAdminApi();
  if (authError) return authError;
  try {
    const payload = normalizeStreamerPayload(await request.json());
    const validationError = validateStreamerPayload(payload);
    if (validationError) return NextResponse.json({ success: false, message: validationError }, { status: 400 });
    if (payload.chzzkChannelId) {
      const existing = await findStreamerByChzzkChannelId(payload.chzzkChannelId);
      if (existing) return NextResponse.json({ success: false, message: `이미 등록된 치지직 채널입니다. (현재 등록 스트리머: ${existing.name})` }, { status: 409 });
    }
    const data = await createStreamer(payload);
    return NextResponse.json({ success: true, message: `[${data.name}] 스트리머가 DB에 성공적으로 등록되었습니다.`, data });
  } catch (error) {
    console.error("POST /api/streamers error:", error);
    const status = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002" ? 409 : 500;
    return NextResponse.json({ success: false, message: status === 409 ? "이미 등록된 치지직 채널 ID입니다." : "스트리머 등록 중 데이터베이스 오류가 발생했습니다.", error: getErrorMessage(error) }, { status });
  }
}

// 기존 스트리머 요청을 검증하고 본인을 제외한 Chzzk 채널 중복 없이 수정한다.
export async function PUT(request: NextRequest) {
  const authError = await requireAdminApi();
  if (authError) return authError;
  try {
    const payload = normalizeStreamerPayload(await request.json());
    const validationError = validateStreamerPayload(payload, true);
    if (validationError) return NextResponse.json({ success: false, message: validationError }, { status: 400 });
    if (payload.chzzkChannelId) {
      const existing = await findStreamerByChzzkChannelId(payload.chzzkChannelId);
      if (existing && existing.id.toString() !== payload.id) return NextResponse.json({ success: false, message: `이미 다른 스트리머에게 등록된 치지직 채널입니다. (등록된 스트리머: ${existing.name})` }, { status: 409 });
    }
    const data = await updateStreamer(payload);
    return NextResponse.json({ success: true, message: `[${data.name}] 스트리머 정보가 수정되었습니다.`, data });
  } catch (error) {
    console.error("PUT /api/streamers error:", error);
    const status = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002" ? 409 : 500;
    return NextResponse.json({ success: false, message: status === 409 ? "이미 다른 스트리머에게 등록된 치지직 채널 ID입니다." : "스트리머 수정 중 데이터베이스 오류가 발생했습니다.", error: getErrorMessage(error) }, { status });
  }
}
