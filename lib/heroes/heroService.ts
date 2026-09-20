// File: lib/heroes/heroService.ts
// Page/Component: heroService
// Purpose: 영웅 조회와 저장 Prisma 접근을 캡슐화한다.
import { Prisma } from "@prisma/client";
import { HERO_ROLE_GROUP_CODE } from "@/lib/constants/commonCodes";
import { prisma } from "@/lib/prisma";
import { formatHeroDto } from "@/lib/heroes/heroDto";
import { normalizeHeroPayload } from "@/lib/heroes/heroValidator";

export class HeroImportValidationError extends Error {}
interface ImportHeroPayload { nameEn: string; role: string; subrole: string; imageUrl: string; sourceKey: string; }

export async function findHeroes() {
  return (
    await prisma.hero.findMany({ orderBy: [{ role: "asc" }, { name: "asc" }] })
  ).map(formatHeroDto);
}
function toHeroData(payload: ReturnType<typeof normalizeHeroPayload>) {
  return {
    name: payload.name,
    nameEn: payload.nameEn,
    role: payload.role,
    isPickable: payload.isPickable,
    imageUrl: payload.imageUrl || null,
    source: payload.source,
    sourceKey: payload.sourceKey,
    remarks: payload.remarks || null,
  };
}
export async function createHero(
  payload: ReturnType<typeof normalizeHeroPayload>,
) {
  return formatHeroDto(await prisma.hero.create({ data: toHeroData(payload) }));
}
export async function updateHero(
  id: string,
  payload: ReturnType<typeof normalizeHeroPayload>,
  body: Record<string, unknown>,
) {
  const data = toHeroData(payload);
  return formatHeroDto(
    await prisma.hero.update({
      where: { id: BigInt(id) },
      data: {
        ...data,
        ...(typeof body.imageUrl === "string" ? {} : { imageUrl: undefined }),
        ...(typeof body.source === "string" ? {} : { source: undefined }),
        ...(typeof body.sourceKey === "string" ? {} : { sourceKey: undefined }),
      },
    }),
  );
}

// OverFast 원본 값을 저장 가능한 영웅 데이터로 정규화한다.
function normalizeImportHero(value: Record<string, unknown>): ImportHeroPayload {
  return { nameEn: String(value.nameEn || "").trim(), role: String(value.role || "").trim().toUpperCase(), subrole: String(value.subrole || "").trim(), imageUrl: String(value.imageUrl || "").trim(), sourceKey: String(value.sourceKey || "").trim() };
}

// 선택한 OverFast 영웅을 역할·중복 조건과 함께 트랜잭션으로 등록한다.
export async function importHeroes(values: unknown[]) {
  if (!values.length) throw new HeroImportValidationError("등록할 신규 영웅을 선택해 주세요.");
  const heroes = values.map((value) => normalizeImportHero((value ?? {}) as Record<string, unknown>));
  const activeRoles = new Set((await prisma.commonCode.findMany({ where: { groupCode: HERO_ROLE_GROUP_CODE, isUse: true }, select: { code: true } })).map((role) => role.code));
  if (heroes.some((hero) => !hero.nameEn || !hero.sourceKey || !activeRoles.has(hero.role))) throw new HeroImportValidationError("신규 영웅의 이름, 역할군 또는 식별자 정보가 올바르지 않습니다.");
  const sourceKeys = heroes.map((hero) => hero.sourceKey);
  const namesEn = heroes.map((hero) => hero.nameEn);
  if (new Set(sourceKeys).size !== sourceKeys.length) throw new HeroImportValidationError("같은 신규 영웅이 중복 선택되었습니다.");
  if (new Set(namesEn).size !== namesEn.length) throw new HeroImportValidationError("같은 영문명의 신규 영웅이 중복 선택되었습니다.");
  try {
    const created = await prisma.$transaction(async (tx) => {
      const existing = await tx.hero.findMany({ where: { OR: [{ sourceKey: { in: sourceKeys } }, { nameEn: { in: namesEn } }] }, select: { sourceKey: true, nameEn: true } });
      if (existing.length) throw new HeroImportValidationError("이미 등록된 신규 영웅이 포함되어 있습니다.");
      return Promise.all(heroes.map((hero) => tx.hero.create({ data: { name: hero.nameEn, nameEn: hero.nameEn, role: hero.role, isPickable: true, imageUrl: hero.imageUrl || null, source: "OVERFAST", sourceKey: hero.sourceKey, remarks: hero.subrole || null } })));
    });
    return created.map(formatHeroDto);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new HeroImportValidationError("다른 요청으로 이미 등록된 신규 영웅이 포함되어 있습니다.");
    throw error;
  }
}
