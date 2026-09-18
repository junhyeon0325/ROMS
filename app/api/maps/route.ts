import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { MAP_MODE_GROUP_CODE } from "@/lib/constants/maps";
import { formatMapDto } from "@/lib/maps/mapDto";
import { prisma } from "@/lib/prisma";

function normalizePayload(body: any) {
  const nameKr = String(body.nameKr || "").trim();
  const nameEn = String(body.nameEn || "").trim();
  return {
    // OverFast only supplies the English name. Use it as the display name
    // until an operator optionally enters a Korean name later.
    name: nameKr || nameEn, nameEn,
    mapType: String(body.mode || "").trim().toUpperCase(), location: String(body.location || "").trim(),
    countryCode: String(body.countryCode || "").trim().toUpperCase(), imageUrl: String(body.imageUrl || "").trim(),
    isActive: body.isActive === true,
    hasValidIsActive: typeof body.isActive === "boolean",
    source: body.source === "OVERFAST" ? "OVERFAST" : "MANUAL",
    sourceKey: String(body.sourceKey || "").trim() || null, remarks: String(body.desc || "").trim(),
  };
}

async function validateMap(payload: ReturnType<typeof normalizePayload>, id?: string) {
  if (!payload.nameEn || !payload.mapType) return "영문명과 맵 모드는 필수입니다.";
  if (!payload.hasValidIsActive) return "활성 여부는 true 또는 false 값으로 입력해 주세요.";
  const mode = await prisma.commonCode.findFirst({ where: { groupCode: MAP_MODE_GROUP_CODE, code: payload.mapType, isUse: true } });
  if (!mode) return "MAP_MODE 공통코드에 등록된 사용 가능 맵 모드를 선택해 주세요.";
  if (payload.sourceKey) {
    const duplicated = await prisma.mapItem.findUnique({ where: { sourceKey: payload.sourceKey } });
    if (duplicated && duplicated.id.toString() !== id) return "이미 등록된 외부 맵 데이터입니다.";
  }
  return null;
}

export async function GET() {
  try {
    const maps = await prisma.mapItem.findMany({ orderBy: [{ isActive: "desc" }, { name: "asc" }] });
    return NextResponse.json({ success: true, data: maps.map(formatMapDto) });
  } catch (error: any) {
    console.error("GET /api/maps error:", error);
    return NextResponse.json({ success: false, message: "맵 목록을 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = normalizePayload(await request.json());
    const errorMessage = await validateMap(payload);
    if (errorMessage) return NextResponse.json({ success: false, message: errorMessage }, { status: 400 });
    const created = await prisma.mapItem.create({ data: {
      name: payload.name, nameEn: payload.nameEn, mapType: payload.mapType, location: payload.location || null,
      countryCode: payload.countryCode || null, imageUrl: payload.imageUrl || null, isActive: payload.isActive,
      source: payload.source, sourceKey: payload.sourceKey, remarks: payload.remarks || null,
    } });
    return NextResponse.json({ success: true, data: formatMapDto(created) });
  } catch (error: any) {
    const duplicate = error.code === "P2002";
    console.error("POST /api/maps error:", error);
    return NextResponse.json({ success: false, message: duplicate ? "이미 등록된 외부 맵 데이터입니다." : "맵을 등록하지 못했습니다." }, { status: duplicate ? 409 : 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const idText = String(body.id || "").trim();
    if (!/^[1-9]\d*$/.test(idText)) {
      return NextResponse.json({ success: false, message: "수정할 맵 ID는 양의 정수여야 합니다." }, { status: 400 });
    }
    const payload = normalizePayload(body);
    const errorMessage = await validateMap(payload, idText);
    if (errorMessage) return NextResponse.json({ success: false, message: errorMessage }, { status: 400 });
    const updated = await prisma.mapItem.update({ where: { id: BigInt(idText) }, data: {
      name: payload.name, nameEn: payload.nameEn, mapType: payload.mapType, location: payload.location || null,
      countryCode: payload.countryCode || null, imageUrl: payload.imageUrl || null, isActive: payload.isActive,
      source: payload.source, sourceKey: payload.sourceKey, remarks: payload.remarks || null,
    } });
    return NextResponse.json({ success: true, data: formatMapDto(updated) });
  } catch (error: any) {
    console.error("PUT /api/maps error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ success: false, message: "수정할 맵을 찾을 수 없습니다." }, { status: 404 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ success: false, message: "이미 등록된 외부 맵 데이터입니다." }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: "맵 정보를 수정하지 못했습니다." }, { status: 500 });
  }
}
