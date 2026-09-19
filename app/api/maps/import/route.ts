// OverFast 맵을 모두 검증한 뒤 하나의 트랜잭션으로 등록하는 관리자용 API다.
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { MAP_MODE_GROUP_CODE } from "@/lib/constants/maps";
import { formatMapDto } from "@/lib/maps/mapDto";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth-guards";

class ImportValidationError extends Error {}

interface ImportMapPayload {
  nameEn: string;
  mode: string;
  location: string;
  countryCode: string;
  imageUrl: string;
  sourceKey: string;
}

// 외부 응답에서 필요한 필드만 추출하고 서버가 허용하는 형태로 정규화한다.
function normalizeImportMap(value: any): ImportMapPayload {
  return {
    nameEn: String(value.nameEn || "").trim(),
    mode: String(value.mode || "")
      .trim()
      .toUpperCase(),
    location: String(value.location || "").trim(),
    countryCode: String(value.countryCode || "")
      .trim()
      .toUpperCase(),
    imageUrl: String(value.imageUrl || "").trim(),
    sourceKey: String(value.sourceKey || "").trim(),
  };
}

// 선택한 모든 맵이 유효할 때만 트랜잭션으로 저장해 부분 성공을 방지한다.
export async function POST(request: NextRequest) {
  const authError = await requireAdminApi();
  if (authError) return authError;

  try {
    const body = await request.json();
    if (!Array.isArray(body.maps) || body.maps.length === 0) {
      return NextResponse.json(
        { success: false, message: "등록할 외부 맵을 선택해 주세요." },
        { status: 400 },
      );
    }

    const maps: ImportMapPayload[] = body.maps.map(normalizeImportMap);
    if (maps.some((map) => !map.nameEn || !map.mode || !map.sourceKey)) {
      return NextResponse.json(
        {
          success: false,
          message: "외부 맵의 이름, 모드, 식별자 정보가 올바르지 않습니다.",
        },
        { status: 400 },
      );
    }

    const sourceKeys = maps.map((map) => map.sourceKey);
    if (new Set(sourceKeys).size !== sourceKeys.length) {
      return NextResponse.json(
        { success: false, message: "동일한 외부 맵이 중복 선택되었습니다." },
        { status: 400 },
      );
    }

    const modes = [...new Set(maps.map((map) => map.mode))];
    const availableModes = await prisma.commonCode.findMany({
      where: {
        groupCode: MAP_MODE_GROUP_CODE,
        code: { in: modes },
        isUse: true,
      },
      select: { code: true },
    });
    if (availableModes.length !== modes.length) {
      return NextResponse.json(
        {
          success: false,
          message: "MAP_MODE 공통코드에 없는 맵 모드가 포함되어 있습니다.",
        },
        { status: 400 },
      );
    }

    const created = await prisma.$transaction(async (tx) => {
      const existing = await tx.mapItem.findMany({
        where: { sourceKey: { in: sourceKeys } },
        select: { sourceKey: true },
      });
      if (existing.length > 0) {
        throw new ImportValidationError(
          "이미 등록된 외부 맵이 포함되어 있습니다.",
        );
      }

      return Promise.all(
        maps.map((map) =>
          tx.mapItem.create({
            data: {
              name: map.nameEn,
              nameEn: map.nameEn,
              mapType: map.mode,
              location: map.location || null,
              countryCode: map.countryCode || null,
              imageUrl: map.imageUrl || null,
              isActive: false,
              source: "OVERFAST",
              sourceKey: map.sourceKey,
            },
          }),
        ),
      );
    });

    return NextResponse.json({
      success: true,
      data: created.map(formatMapDto),
    });
  } catch (error) {
    console.error("POST /api/maps/import error:", error);
    if (error instanceof ImportValidationError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 409 },
      );
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "다른 요청으로 이미 등록된 외부 맵이 포함되어 있습니다.",
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { success: false, message: "외부 맵을 등록하지 못했습니다." },
      { status: 500 },
    );
  }
}
