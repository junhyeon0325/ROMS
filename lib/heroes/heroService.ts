// File: lib/heroes/heroService.ts
// Page/Component: heroService
// Purpose: 영웅 조회와 저장 Prisma 접근을 캡슐화한다.
import { prisma } from "@/lib/prisma";
import { formatHeroDto } from "@/lib/heroes/heroDto";
import { normalizeHeroPayload } from "@/lib/heroes/heroValidator";

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
