// File: lib/maps/mapService.ts
// Page/Component: mapService
// Purpose: 지도 조회와 저장을 Prisma 접근으로 캡슐화한다.
import { Prisma } from "@prisma/client";
import { MAP_MODE_GROUP_CODE } from "@/lib/constants/maps";
import { prisma } from "@/lib/prisma";
import { formatMapDto } from "@/lib/maps/mapDto";
import { normalizeMapPayload } from "@/lib/maps/mapValidator";

export class MapImportValidationError extends Error {}

interface ImportMapPayload { nameEn: string; mode: string; location: string; countryCode: string; imageUrl: string; sourceKey: string; }

export async function findMaps() { return (await prisma.mapItem.findMany({ orderBy: [{ isActive: "desc" }, { name: "asc" }] })).map(formatMapDto); }

// 정규화된 지도 값을 생성 또는 수정 가능한 Prisma 데이터로 변환한다.
function toMapData(payload: ReturnType<typeof normalizeMapPayload>) {
  return { name: payload.name, nameEn: payload.nameEn, mapType: payload.mapType, location: payload.location || null, countryCode: payload.countryCode || null, imageUrl: payload.imageUrl || null, isActive: payload.isActive, source: payload.source, sourceKey: payload.sourceKey, remarks: payload.remarks || null };
}

export async function createMap(payload: ReturnType<typeof normalizeMapPayload>) { return formatMapDto(await prisma.mapItem.create({ data: toMapData(payload) })); }
export async function updateMap(id: string, payload: ReturnType<typeof normalizeMapPayload>) { return formatMapDto(await prisma.mapItem.update({ where: { id: BigInt(id) }, data: toMapData(payload) })); }

// OverFast 원본 값을 저장 가능한 지도 데이터로 정규화한다.
function normalizeImportMap(value: Record<string, unknown>): ImportMapPayload {
  return { nameEn: String(value.nameEn || "").trim(), mode: String(value.mode || "").trim().toUpperCase(), location: String(value.location || "").trim(), countryCode: String(value.countryCode || "").trim().toUpperCase(), imageUrl: String(value.imageUrl || "").trim(), sourceKey: String(value.sourceKey || "").trim() };
}

// 선택한 OverFast 지도를 검증하고 중복 없이 하나의 트랜잭션으로 등록한다.
export async function importMaps(values: unknown[]) {
  if (!values.length) throw new MapImportValidationError("등록할 신규 맵을 선택해 주세요.");
  const maps = values.map((value) => normalizeImportMap((value ?? {}) as Record<string, unknown>));
  if (maps.some((map) => !map.nameEn || !map.mode || !map.sourceKey)) throw new MapImportValidationError("신규 맵의 이름, 모드, 식별자 정보가 올바르지 않습니다.");
  const sourceKeys = maps.map((map) => map.sourceKey);
  if (new Set(sourceKeys).size !== sourceKeys.length) throw new MapImportValidationError("동일한 신규 맵이 중복 선택되었습니다.");
  const modes = [...new Set(maps.map((map) => map.mode))];
  const availableModes = await prisma.commonCode.findMany({ where: { groupCode: MAP_MODE_GROUP_CODE, code: { in: modes }, isUse: true }, select: { code: true } });
  if (availableModes.length !== modes.length) throw new MapImportValidationError("MAP_MODE 공통코드에 없는 맵 모드가 포함되어 있습니다.");
  try {
    const created = await prisma.$transaction(async (tx) => {
      const existing = await tx.mapItem.findMany({ where: { sourceKey: { in: sourceKeys } }, select: { sourceKey: true } });
      if (existing.length) throw new MapImportValidationError("이미 등록된 신규 맵이 포함되어 있습니다.");
      return Promise.all(maps.map((map) => tx.mapItem.create({ data: { name: map.nameEn, nameEn: map.nameEn, mapType: map.mode, location: map.location || null, countryCode: map.countryCode || null, imageUrl: map.imageUrl || null, isActive: false, source: "OVERFAST", sourceKey: map.sourceKey } })));
    });
    return created.map(formatMapDto);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new MapImportValidationError("다른 요청으로 이미 등록된 신규 맵이 포함되어 있습니다.");
    throw error;
  }
}
