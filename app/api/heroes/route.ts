// 영웅 마스터 데이터의 조회·등록·수정 API를 제공한다.
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { formatHeroDto } from "@/lib/heroes/heroDto";
import { prisma } from "@/lib/prisma";

const HERO_ROLES = ["TANK", "DAMAGE", "SUPPORT"] as const;

// 요청 본문을 DB 저장에 필요한 영웅 필드로 정규화한다.
function normalizePayload(body: Record<string, unknown>) {
  return {
    name: String(body.nameKr || "").trim(),
    nameEn: String(body.nameEn || "").trim(),
    role: String(body.role || "")
      .trim()
      .toUpperCase(),
    isPickable: body.isPickable === true,
    hasValidIsPickable: typeof body.isPickable === "boolean",
    imageUrl: String(body.imageUrl || "").trim(),
    source: body.source === "OVERFAST" ? "OVERFAST" : "MANUAL",
    sourceKey: String(body.sourceKey || "").trim() || null,
    remarks: String(body.desc || "").trim(),
  };
}

// 필수값과 허용된 영웅 분류값을 확인한다.
function validateHero(payload: ReturnType<typeof normalizePayload>) {
  if (!payload.name || !payload.nameEn)
    return "영웅 국문명과 영문명을 입력해주세요.";
  if (!HERO_ROLES.includes(payload.role as (typeof HERO_ROLES)[number]))
    return "올바른 역할군을 선택해주세요.";
  if (!payload.hasValidIsPickable) return "픽 가능 여부를 선택해주세요.";
  return null;
}

export async function GET() {
  try {
    const heroes = await prisma.hero.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });
    return NextResponse.json({
      success: true,
      data: heroes.map(formatHeroDto),
    });
  } catch (error) {
    console.error("GET /api/heroes error:", error);
    return NextResponse.json(
      { success: false, message: "영웅 목록을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = normalizePayload(await request.json());
    const errorMessage = validateHero(payload);
    if (errorMessage)
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: 400 },
      );
    const created = await prisma.hero.create({
      data: {
        name: payload.name,
        nameEn: payload.nameEn,
        role: payload.role,
        isPickable: payload.isPickable,
        imageUrl: payload.imageUrl || null,
        source: payload.source,
        sourceKey: payload.sourceKey,
        remarks: payload.remarks || null,
      },
    });
    return NextResponse.json({ success: true, data: formatHeroDto(created) });
  } catch (error) {
    console.error("POST /api/heroes error:", error);
    const duplicated =
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002";
    return NextResponse.json(
      {
        success: false,
        message: duplicated
          ? "이미 등록된 영문명입니다."
          : "영웅을 등록하지 못했습니다.",
      },
      { status: duplicated ? 409 : 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const id = String(body.id || "").trim();
    if (!/^[1-9]\d*$/.test(id))
      return NextResponse.json(
        { success: false, message: "수정할 영웅 ID가 올바르지 않습니다." },
        { status: 400 },
      );
    const payload = normalizePayload(body);
    const errorMessage = validateHero(payload);
    if (errorMessage)
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: 400 },
      );
    const updated = await prisma.hero.update({
      where: { id: BigInt(id) },
      data: {
        name: payload.name,
        nameEn: payload.nameEn,
        role: payload.role,
        isPickable: payload.isPickable,
        remarks: payload.remarks || null,
        ...(typeof body.imageUrl === "string"
          ? { imageUrl: payload.imageUrl || null }
          : {}),
        ...(typeof body.source === "string" ? { source: payload.source } : {}),
        ...(typeof body.sourceKey === "string"
          ? { sourceKey: payload.sourceKey }
          : {}),
      },
    });
    return NextResponse.json({ success: true, data: formatHeroDto(updated) });
  } catch (error) {
    console.error("PUT /api/heroes error:", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    )
      return NextResponse.json(
        { success: false, message: "수정할 영웅을 찾을 수 없습니다." },
        { status: 404 },
      );
    const duplicated =
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002";
    return NextResponse.json(
      {
        success: false,
        message: duplicated
          ? "이미 등록된 영문명입니다."
          : "영웅 정보를 수정하지 못했습니다.",
      },
      { status: duplicated ? 409 : 500 },
    );
  }
}
