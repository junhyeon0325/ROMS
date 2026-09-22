// File: app/api/heroes/route.ts
// Page/Component: heroes API route
// Purpose: 영웅 HTTP 요청을 인증 후 서비스와 검증 모듈로 전달한다.
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdminApi } from "@/lib/auth-guards";
import { createHero, findHeroes, updateHero } from "@/lib/heroes/heroService";
import {
  normalizeHeroPayload,
  validateHeroPayload,
} from "@/lib/heroes/heroValidator";

function errorResponse(error: unknown, action: "create" | "update") {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  )
    return NextResponse.json(
      { success: false, message: "수정할 영웅을 찾을 수 없습니다." },
      { status: 404 },
    );
  const duplicate =
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002";
  return NextResponse.json(
    {
      success: false,
      message: duplicate
        ? "이미 등록된 영문명입니다."
        : action === "create"
          ? "영웅을 등록하지 못했습니다."
          : "영웅 정보를 수정하지 못했습니다.",
    },
    { status: duplicate ? 409 : 500 },
  );
}

export async function GET() {
  const authError = await requireAdminApi();
  if (authError) return authError;
  try {
    return NextResponse.json({ success: true, data: await findHeroes() });
  } catch (error) {
    console.error("GET /api/heroes error:", error);
    return NextResponse.json(
      { success: false, message: "영웅 목록을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAdminApi();
  if (authError) return authError;
  try {
    const payload = normalizeHeroPayload(await request.json());
    const message = await validateHeroPayload(payload);
    if (message)
      return NextResponse.json({ success: false, message }, { status: 400 });
    return NextResponse.json({
      success: true,
      data: await createHero(payload),
    });
  } catch (error) {
    console.error("POST /api/heroes error:", error);
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
        { success: false, message: "수정할 영웅 ID가 올바르지 않습니다." },
        { status: 400 },
      );
    const payload = normalizeHeroPayload(body);
    const message = await validateHeroPayload(payload);
    if (message)
      return NextResponse.json({ success: false, message }, { status: 400 });
    return NextResponse.json({
      success: true,
      data: await updateHero(id, payload, body),
    });
  } catch (error) {
    console.error("PUT /api/heroes error:", error);
    return errorResponse(error, "update");
  }
}
