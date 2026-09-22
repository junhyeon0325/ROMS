// File: lib/types/heroes.ts
// Page/Component: 영웅 도메인 타입
// Purpose: 영웅 관리와 OverFast 가져오기에 필요한 데이터 형식을 정의한다.

import type { ContentSource } from "@/lib/types/content";

// HERO_ROLE 공통코드의 code 값을 저장하므로 신규 활성 코드도 수용한다.
export type HeroRole = string;

export interface HeroItem {
  id: string;
  nameKr: string;
  nameEn: string;
  role: HeroRole;
  isPickable: boolean;
  imageUrl?: string;
  source?: ContentSource;
  sourceKey?: string;
  desc: string;
}

export interface ExternalHero {
  sourceKey: string;
  nameEn: string;
  role: HeroRole;
  subrole: string;
  imageUrl: string;
  source: "OVERFAST";
}
