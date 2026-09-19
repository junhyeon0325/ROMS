// File: app/api/codes/route.ts
// Page/Component: codes API route
// Purpose: 공통 코드 HTTP 요청을 인증 후 검증과 서비스 모듈로 전달한다.
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdminApi } from "@/lib/auth-guards";
import {
  createCode,
  deleteCode,
  findCodes,
  updateCode,
} from "@/lib/codes/codeService";
import {
  normalizeCodePayload,
  validateCodePayload,
} from "@/lib/codes/codeValidator";

function persistenceError(error: unknown, action: string) {
  const notFound =
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025";
  const duplicate =
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002";
  return NextResponse.json(
    {
      success: false,
      message: notFound
        ? "대상 공통 코드를 찾을 수 없습니다."
        : duplicate
          ? "동일한 코드가 이미 존재합니다."
          : `공통 코드 ${action}에 실패했습니다.`,
    },
    { status: notFound ? 404 : duplicate ? 409 : 500 },
  );
}

export async function GET(request: NextRequest) {
  const authError = await requireAdminApi();
  if (authError) return authError;
  try {
    const params = new URL(request.url).searchParams;
    const groupCode = params.get("group") || params.get("groupCode");
    return NextResponse.json({
      success: true,
      data: await findCodes(groupCode?.trim().toUpperCase()),
    });
  } catch (error) {
    console.error("GET /api/codes error:", error);
    return persistenceError(error, "조회");
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAdminApi();
  if (authError) return authError;
  try {
    const payload = normalizeCodePayload(await request.json());
    const message = validateCodePayload(payload);
    if (message)
      return NextResponse.json({ success: false, message }, { status: 400 });
    const data = await createCode(payload);
    if (!data)
      return NextResponse.json(
        { success: false, message: "존재하지 않는 상위 코드 그룹입니다." },
        { status: 404 },
      );
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("POST /api/codes error:", error);
    return persistenceError(error, "등록");
  }
}

export async function PUT(request: NextRequest) {
  const authError = await requireAdminApi();
  if (authError) return authError;
  try {
    const payload = normalizeCodePayload(await request.json());
    const message = validateCodePayload(payload);
    if (message)
      return NextResponse.json({ success: false, message }, { status: 400 });
    return NextResponse.json({
      success: true,
      data: await updateCode(payload),
    });
  } catch (error) {
    console.error("PUT /api/codes error:", error);
    return persistenceError(error, "수정");
  }
}

export async function DELETE(request: NextRequest) {
  const authError = await requireAdminApi();
  if (authError) return authError;
  try {
    const params = new URL(request.url).searchParams;
    const body =
      params.get("groupCode") || params.get("group")
        ? {}
        : await request.json().catch(() => ({}));
    const payload = normalizeCodePayload({
      groupCode:
        params.get("groupCode") ||
        params.get("group") ||
        body.groupCode ||
        body.group,
      code: params.get("code") || body.code,
    });
    const message = validateCodePayload(payload, false);
    if (message)
      return NextResponse.json({ success: false, message }, { status: 400 });
    await deleteCode(payload.groupCode, payload.code);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/codes error:", error);
    return persistenceError(error, "삭제");
  }
}
