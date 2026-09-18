// File: app/admin/maps/components/mapForm.ts
// Page/Component: MapForm
// Purpose: 맵 관리자 폼의 초기값과 저장된 맵 데이터를 폼 입력값으로 변환하는 기능을 제공한다.

import { MapFormData, MapItem } from "@/lib/types/admin";

export const EMPTY_MAP_FORM: MapFormData = {
  nameKr: "",
  nameEn: "",
  mode: "",
  location: "",
  countryCode: "",
  imageUrl: "",
  isActive: false,
  source: "MANUAL",
  sourceKey: "",
  desc: "",
};

// 저장된 맵 데이터를 관리자 폼에서 편집 가능한 기본값으로 변환한다.
export function toMapForm(map: MapItem): MapFormData {
  return {
    nameKr: map.nameKr,
    nameEn: map.nameEn,
    mode: map.mode,
    location: map.location,
    countryCode: map.countryCode || "",
    imageUrl: map.imageUrl || "",
    isActive: map.isActive,
    source: map.source || "MANUAL",
    sourceKey: map.sourceKey || "",
    desc: map.desc || "",
  };
}
