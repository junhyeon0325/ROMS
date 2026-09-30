// File: lib/maps/mapSubareaService.ts
// Page/Component: mapSubareaService
// Purpose: 맵별 세부 지역을 조회·정렬·저장하고 경기 기록 참조를 보호한다.
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { MapSubareaItem } from "@/lib/types/maps";

export class MapSubareaError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

type MapSubareaInput = { id?: string; name: string; nameEn: string; sortOrder: number };
const idPattern = /^[1-9]\d*$/;

// DB 식별자와 nullable 영문명을 화면용 문자열 형식으로 바꾼다.
function toItem(row: { id: bigint; mapId: bigint; name: string; nameEn: string | null; sortOrder: number }): MapSubareaItem {
  return { id: String(row.id), mapId: String(row.mapId), name: row.name, nameEn: row.nameEn ?? "", sortOrder: row.sortOrder };
}

// 선택 맵에 등록된 세부 지역을 순서대로 조회한다.
export async function findMapSubareas(mapId: bigint): Promise<MapSubareaItem[]> {
  const rows = await prisma.mapSubarea.findMany({ where: { mapId }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
  return rows.map(toItem);
}

// 세부 지역 전체를 원자적으로 저장하고 사용 중인 지역 삭제는 막는다.
export async function saveMapSubareas(mapId: bigint, value: unknown): Promise<MapSubareaItem[]> {
  if (!Array.isArray(value) || value.length > 50) throw new MapSubareaError("세부 지역은 50개 이하로 입력해주세요.");
  const items = value.map((raw, index): MapSubareaInput => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new MapSubareaError("세부 지역 입력 형식이 올바르지 않습니다.");
    const input = raw as Record<string, unknown>;
    const id = input.id === undefined ? undefined : String(input.id);
    const name = typeof input.name === "string" ? input.name.trim() : "";
    const nameEn = typeof input.nameEn === "string" ? input.nameEn.trim() : "";
    const sortOrder = input.sortOrder === undefined ? index + 1 : input.sortOrder;
    if ((id !== undefined && !idPattern.test(id)) || !name || name.length > 100 || nameEn.length > 100 || typeof sortOrder !== "number" || !Number.isSafeInteger(sortOrder) || sortOrder < 1 || sortOrder > 50) throw new MapSubareaError("세부 지역 한글명·영문명·순서를 확인해주세요.");
    return { ...(id ? { id } : {}), name, nameEn, sortOrder: Number(sortOrder) };
  });
  if (new Set(items.map((item) => item.sortOrder)).size !== items.length) throw new MapSubareaError("세부 지역 순서는 중복될 수 없습니다.");
  const normalize = (text: string) => text.normalize("NFKC").toLocaleLowerCase("ko-KR");
  const koreanNames = items.map((item) => normalize(item.name));
  const englishNames = items.map((item) => normalize(item.nameEn)).filter(Boolean);
  if (new Set(koreanNames).size !== koreanNames.length || new Set(englishNames).size !== englishNames.length) throw new MapSubareaError("같은 언어의 세부 지역 이름은 서로 중복될 수 없습니다.");

  try {
    await prisma.$transaction(async (tx) => {
      const map = await tx.mapItem.findUnique({ where: { id: mapId }, select: { id: true } });
      if (!map) throw new MapSubareaError("맵을 찾을 수 없습니다.", 404);
      const existing = await tx.mapSubarea.findMany({ where: { mapId }, select: { id: true } });
      const existingById = new Set(existing.map((item) => String(item.id)));
      if (items.some((item) => item.id && !existingById.has(item.id))) throw new MapSubareaError("다른 맵의 세부 지역은 수정할 수 없습니다.");
      const keepIds = new Set(items.flatMap((item) => item.id ? [item.id] : []));
      const removed = existing.filter((item) => !keepIds.has(String(item.id))).map((item) => item.id);
      if (removed.length && await tx.matchSet.count({ where: { mapSubareaId: { in: removed } } })) throw new MapSubareaError("경기 기록에서 사용 중인 세부 지역은 삭제할 수 없습니다.", 409);
      if (removed.length) await tx.mapSubarea.deleteMany({ where: { id: { in: removed }, mapId } });
      for (const item of items) {
        if (item.id) await tx.mapSubarea.update({ where: { id: BigInt(item.id) }, data: { name: item.name, nameEn: item.nameEn || null, sortOrder: item.sortOrder } });
        else await tx.mapSubarea.create({ data: { mapId, name: item.name, nameEn: item.nameEn || null, sortOrder: item.sortOrder } });
      }
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") throw new MapSubareaError("동시에 변경된 세부 지역이 있습니다. 다시 조회한 뒤 저장해주세요.", 409);
    throw error;
  }
  return findMapSubareas(mapId);
}
