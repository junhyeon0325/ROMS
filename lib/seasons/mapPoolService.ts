// File: lib/seasons/mapPoolService.ts
// Page/Component: mapPoolService
// Purpose: 시즌별 맵 구성의 조회와 순서 저장을 처리한다.
import { prisma } from "@/lib/prisma";

// 선택한 시즌의 기존 맵 마스터와 순서를 함께 조회한다.
export async function findSeasonMaps(seasonId: bigint) {
  const rows = await prisma.seasonMap.findMany({
    where: { seasonId },
    include: { map: true },
    orderBy: { sortOrder: "asc" },
  });
  return rows.map(({ map, sortOrder }) => ({
    id: map.id.toString(), nameKr: map.name, nameEn: map.nameEn,
    mode: map.mapType, location: map.location, imageUrl: map.imageUrl,
    isActive: map.isActive, sortOrder,
  }));
}

// 시즌과 맵의 존재 여부를 확인하고 전체 순서를 원자적으로 교체한다.
export async function saveSeasonMaps(seasonId: bigint, mapIds: bigint[]) {
  return prisma.$transaction(async (tx) => {
    const season = await tx.season.findUnique({ where: { id: seasonId }, select: { id: true } });
    if (!season) throw new Error("대회를 찾을 수 없습니다.");
    const maps = await tx.mapItem.findMany({ where: { id: { in: mapIds }, isActive: true }, select: { id: true } });
    if (maps.length !== mapIds.length) throw new Error("선택한 맵 중 사용할 수 없는 맵이 있습니다.");
    await tx.seasonMap.deleteMany({ where: { seasonId } });
    if (mapIds.length) await tx.seasonMap.createMany({ data: mapIds.map((mapId, sortOrder) => ({ seasonId, mapId, sortOrder })) });
    return findSeasonMapsInTransaction(tx, seasonId);
  });
}

// 같은 트랜잭션 안에서 저장한 맵 구성을 순서대로 반환한다.
async function findSeasonMapsInTransaction(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0], seasonId: bigint) {
  const rows = await tx.seasonMap.findMany({ where: { seasonId }, include: { map: true }, orderBy: { sortOrder: "asc" } });
  return rows.map(({ map, sortOrder }) => ({ id: map.id.toString(), nameKr: map.name, nameEn: map.nameEn, mode: map.mapType, location: map.location, imageUrl: map.imageUrl, isActive: map.isActive, sortOrder }));
}
