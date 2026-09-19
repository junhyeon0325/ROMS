// File: lib/maps/mapService.ts
// Page/Component: mapService
// Purpose: 지도 조회와 저장을 Prisma 접근으로 캡슐화한다.
import { prisma } from "@/lib/prisma";
import { formatMapDto } from "@/lib/maps/mapDto";
import { normalizeMapPayload } from "@/lib/maps/mapValidator";

export async function findMaps() { return (await prisma.mapItem.findMany({ orderBy: [{ isActive: "desc" }, { name: "asc" }] })).map(formatMapDto); }

// 정규화된 지도 값을 생성 또는 수정 가능한 Prisma 데이터로 변환한다.
function toMapData(payload: ReturnType<typeof normalizeMapPayload>) {
  return { name: payload.name, nameEn: payload.nameEn, mapType: payload.mapType, location: payload.location || null, countryCode: payload.countryCode || null, imageUrl: payload.imageUrl || null, isActive: payload.isActive, source: payload.source, sourceKey: payload.sourceKey, remarks: payload.remarks || null };
}

export async function createMap(payload: ReturnType<typeof normalizeMapPayload>) { return formatMapDto(await prisma.mapItem.create({ data: toMapData(payload) })); }
export async function updateMap(id: string, payload: ReturnType<typeof normalizeMapPayload>) { return formatMapDto(await prisma.mapItem.update({ where: { id: BigInt(id) }, data: toMapData(payload) })); }
