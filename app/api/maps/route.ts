// File: app/api/maps/route.ts
// Page/Component: maps API route
// Purpose: 지도 HTTP 요청을 인증 후 서비스와 검증 모듈로 전달한다.
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdminApi } from "@/lib/auth-guards";
import { createMap, findMaps, updateMap } from "@/lib/maps/mapService";
import {
  normalizeMapPayload,
  validateMapPayload,
} from "@/lib/maps/mapValidator";

function errorResponse(error: unknown, action: "create" | "update") {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  )
    return NextResponse.json(
      { success: false, message: "수정할 맵을 찾을 수 없습니다." },
      { status: 404 },
    );
  const duplicate =
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002";
  return NextResponse.json(
    {
      success: false,
      message: duplicate
        ? "이미 등록된 외부 맵 데이터입니다."
        : action === "create"
          ? "맵을 등록하지 못했습니다."
          : "맵 정보를 수정하지 못했습니다.",
    },
    { status: duplicate ? 409 : 500 },
  );
}

export async function GET() {
  const authError = await requireAdminApi();
  if (authError) return authError;
  try {
    return NextResponse.json({ success: true, data: await findMaps() });
  } catch (error) {
    console.error("GET /api/maps error:", error);
    return NextResponse.json(
      { success: false, message: "맵 목록을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAdminApi();
  if (authError) return authError;
  try {
    const payload = normalizeMapPayload(await request.json());
    const message = await validateMapPayload(payload);
    if (message)
      return NextResponse.json({ success: false, message }, { status: 400 });
    return NextResponse.json({ success: true, data: await createMap(payload) });
  } catch (error) {
    console.error("POST /api/maps error:", error);
    return errorResponse(error, "create");
  }
}

export async function PUT(request: NextRequest) {
  const authError = await requireAdminApi();
  if (authError) return authError;
  try {
    const body = await request.json();
    const id = String(body.id || "").trim();
    if (!/^[1-9]\d*$/.test(id))
      return NextResponse.json(
        { success: false, message: "수정할 맵 ID가 올바르지 않습니다." },
        { status: 400 },
      );
    const payload = normalizeMapPayload(body);
    const message = await validateMapPayload(payload, id);
    if (message)
      return NextResponse.json({ success: false, message }, { status: 400 });
    return NextResponse.json({
      success: true,
      data: await updateMap(id, payload),
    });
  } catch (error) {
    console.error("PUT /api/maps error:", error);
    return errorResponse(error, "update");
  }
}
