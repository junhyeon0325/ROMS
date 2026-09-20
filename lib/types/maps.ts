// File: lib/types/maps.ts
// Page/Component: 맵 도메인 타입
// Purpose: 맵 관리와 OverFast 가져오기에 필요한 데이터 형식을 정의한다.

import type { ContentSource } from "@/lib/types/content";

export interface MapItem {
  id: string;
  nameKr: string;
  nameEn: string;
  mode: string;
  location: string;
  countryCode?: string;
  imageUrl?: string;
  isActive: boolean;
  source?: ContentSource;
  sourceKey?: string;
  desc?: string;
}

export interface ExternalMap {
  sourceKey: string;
  nameEn: string;
  gamemodes: string[];
  location: string;
  countryCode: string;
  imageUrl: string;
  source: "OVERFAST";
}

export interface MapFormData {
  nameKr: string;
  nameEn: string;
  mode: string;
  location: string;
  countryCode: string;
  imageUrl: string;
  isActive: boolean;
  source: ContentSource;
  sourceKey: string;
  desc: string;
}
