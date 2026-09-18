// 영웅 Prisma 모델을 관리자 화면에서 사용하는 DTO로 변환한다.
import type { Hero as PrismaHero } from "@prisma/client";
import type { HeroItem } from "@/lib/types/admin";

// BigInt와 nullable 필드를 직렬화 가능한 영웅 DTO로 정규화한다.
export function formatHeroDto(hero: PrismaHero): HeroItem {
  return {
    id: hero.id.toString(),
    nameKr: hero.name,
    nameEn: hero.nameEn,
    role: hero.role as HeroItem["role"],
    isPickable: hero.isPickable,
    imageUrl: hero.imageUrl || "",
    source: hero.source === "OVERFAST" ? "OVERFAST" : "MANUAL",
    sourceKey: hero.sourceKey || "",
    desc: hero.remarks || "",
  };
}
