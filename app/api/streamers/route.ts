// app/api/streamers/route.ts
/**
 * [스트리머(선수) Supabase DB CRUD API 엔드포인트]
 * - Prisma Client를 통해 Supabase PostgreSQL 데이터베이스와 직접 연동
 * - 스트리머 목록 조회(GET), 신규 등록(POST), 정보 수정(PUT), 삭제(DELETE) 처리
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// BigInt 및 필드 직렬화 헬퍼 함수
function formatStreamer(s: any) {
  const channelUrl = s.chzzkChannelUrl || "";
  let channelId = "";
  if (channelUrl) {
    channelId = channelUrl
      .replace(/^https?:\/\/(www\.)?chzzk\.naver\.com\/(live\/)?/i, "")
      .split("?")[0]
      .replace(/\/$/, "");
  }

  return {
    id: s.id.toString(),
    name: s.name,
    nickname: s.nickname || "",
    position: s.position,
    profileImg: s.profileImageUrl || "",
    channelUrl: channelUrl,
    channelId: channelId,
    type: channelUrl ? "치지직 연동" : "일반 등록",
    followers: channelUrl ? "연동됨" : "—",
    registeredDate: s.createdAt ? new Date(s.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    memo: s.remarks || "",
  };
}

// 1. 스트리머 목록 조회 (GET)
export async function GET() {
  try {
    const streamers = await prisma.streamer.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    const data = streamers.map(formatStreamer);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("GET /api/streamers error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "스트리머 목록을 불러오지 못했습니다.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// 2. 신규 스트리머 등록 (POST)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, regType, channelUrl, profileImg, memo } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, message: "스트리머 이름 또는 채널명을 입력해주세요." },
        { status: 400 }
      );
    }

    const created = await prisma.streamer.create({
      data: {
        name: name.trim(),
        profileImageUrl: profileImg?.trim() || null,
        chzzkChannelUrl: regType === "치지직 연동" ? channelUrl?.trim() || null : null,
        remarks: memo?.trim() || null,
        position: "DAMAGE",
      },
    });

    return NextResponse.json({
      success: true,
      message: `[${created.name}] 스트리머가 DB에 성공적으로 등록되었습니다.`,
      data: formatStreamer(created),
    });
  } catch (error: any) {
    console.error("POST /api/streamers error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "스트리머 등록 중 데이터베이스 오류가 발생했습니다.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// 3. 스트리머 정보 수정 (PUT)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, regType, channelUrl, profileImg, memo } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "수정할 스트리머 ID가 누락되었습니다." },
        { status: 400 }
      );
    }
    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, message: "스트리머 이름을 입력해주세요." },
        { status: 400 }
      );
    }

    const updated = await prisma.streamer.update({
      where: {
        id: BigInt(id),
      },
      data: {
        name: name.trim(),
        profileImageUrl: profileImg?.trim() || null,
        chzzkChannelUrl: regType === "치지직 연동" ? channelUrl?.trim() || null : null,
        remarks: memo?.trim() || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: `[${updated.name}] 스트리머 정보가 수정되었습니다.`,
      data: formatStreamer(updated),
    });
  } catch (error: any) {
    console.error("PUT /api/streamers error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "스트리머 수정 중 데이터베이스 오류가 발생했습니다.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// 4. 스트리머 삭제 (DELETE)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");

    if (!id) {
      const body = await request.json().catch(() => ({}));
      id = body?.id;
    }

    if (!id) {
      return NextResponse.json(
        { success: false, message: "삭제할 스트리머 ID가 필요합니다." },
        { status: 400 }
      );
    }

    await prisma.streamer.delete({
      where: {
        id: BigInt(id),
      },
    });

    return NextResponse.json({
      success: true,
      message: "스트리머가 데이터베이스에서 삭제되었습니다.",
    });
  } catch (error: any) {
    console.error("DELETE /api/streamers error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "스트리머 삭제 중 데이터베이스 오류가 발생했습니다.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
