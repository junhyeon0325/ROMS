// 선택한 OverFast 영웅을 중복 없이 영웅 마스터에 일괄 등록한다.
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { formatHeroDto } from "@/lib/heroes/heroDto";
import { prisma } from "@/lib/prisma";

const HERO_ROLES = ["TANK", "DAMAGE", "SUPPORT"] as const;
class ImportValidationError extends Error {}

interface ImportHeroPayload {
  nameEn: string;
  role: string;
  subrole: string;
  imageUrl: string;
  sourceKey: string;
}

// 외부 요청에서 영웅 등록에 필요한 필드만 정규화한다.
function normalizeImportHero(
  value: Record<string, unknown>,
): ImportHeroPayload {
  return {
    nameEn: String(value.nameEn || "").trim(),
    role: String(value.role || "")
      .trim()
      .toUpperCase(),
    subrole: String(value.subrole || "").trim(),
    imageUrl: String(value.imageUrl || "").trim(),
    sourceKey: String(value.sourceKey || "").trim(),
  };
}

// 선택값의 중복과 기존 등록 여부를 검증한 뒤 트랜잭션으로 일괄 저장한다.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!Array.isArray(body.heroes) || !body.heroes.length)
      return NextResponse.json(
        { success: false, message: "등록할 외부 영웅을 선택해주세요." },
        { status: 400 },
      );
    const heroes = body.heroes.map(normalizeImportHero) as ImportHeroPayload[];
    if (
      heroes.some(
        (hero) =>
          !hero.nameEn ||
          !hero.sourceKey ||
          !HERO_ROLES.includes(hero.role as (typeof HERO_ROLES)[number]),
      )
    )
      return NextResponse.json(
        {
          success: false,
          message:
            "외부 영웅의 이름, 역할군 또는 식별자 정보가 올바르지 않습니다.",
        },
        { status: 400 },
      );
    const sourceKeys = heroes.map((hero) => hero.sourceKey);
    const namesEn = heroes.map((hero) => hero.nameEn);
    if (new Set(sourceKeys).size !== sourceKeys.length)
      return NextResponse.json(
        { success: false, message: "같은 외부 영웅이 중복 선택되었습니다." },
        { status: 400 },
      );
    if (new Set(namesEn).size !== namesEn.length)
      return NextResponse.json(
        { success: false, message: "같은 영문명의 외부 영웅이 중복 선택되었습니다." },
        { status: 400 },
      );
    const created = await prisma.$transaction(async (tx) => {
      const existing = await tx.hero.findMany({
        where: { OR: [{ sourceKey: { in: sourceKeys } }, { nameEn: { in: namesEn } }] },
        select: { sourceKey: true, nameEn: true },
      });
      if (existing.length)
        throw new ImportValidationError(
          "이미 등록된 외부 영웅이 포함되어 있습니다.",
        );
      return Promise.all(
        heroes.map((hero) =>
          tx.hero.create({
            data: {
              name: hero.nameEn,
              nameEn: hero.nameEn,
              role: hero.role,
              isPickable: true,
              imageUrl: hero.imageUrl || null,
              source: "OVERFAST",
              sourceKey: hero.sourceKey,
              remarks: hero.subrole || null,
            },
          }),
        ),
      );
    });
    return NextResponse.json({
      success: true,
      data: created.map(formatHeroDto),
    });
  } catch (error) {
    console.error("POST /api/heroes/import error:", error);
    if (error instanceof ImportValidationError)
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 409 },
      );
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    )
      return NextResponse.json(
        {
          success: false,
          message: "다른 요청으로 이미 등록된 영웅이 포함되어 있습니다.",
        },
        { status: 409 },
      );
    return NextResponse.json(
      { success: false, message: "외부 영웅을 등록하지 못했습니다." },
      { status: 500 },
    );
  }
}
