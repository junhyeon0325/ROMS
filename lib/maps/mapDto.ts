// Prisma 맵 모델을 관리자 화면이 사용하는 맵 DTO로 변환한다.
import type { MapItem as PrismaMapItem } from "@prisma/client";
import type { MapItem as AdminMapItem } from "@/lib/types/admin";

// DB의 BigInt와 nullable 필드를 클라이언트 전송용 맵 DTO로 정규화한다.
export function formatMapDto(map: PrismaMapItem): AdminMapItem {
  return {
    id: map.id.toString(),
    nameKr: map.name,
    nameEn: map.nameEn || "",
    mode: map.mapType,
    location: map.location || "",
    countryCode: map.countryCode || "",
    imageUrl: map.imageUrl || "",
    isActive: map.isActive,
    source: map.source === "OVERFAST" ? "OVERFAST" : "MANUAL",
    sourceKey: map.sourceKey || "",
    desc: map.remarks || "",
  };
}
