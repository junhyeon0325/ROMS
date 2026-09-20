// File: app/admin/maps/page.tsx
// Page/Component: AdminMapsPage
// Purpose: 맵 관리 상태, API 동작 및 페이지 수준 레이아웃을 조율한다.

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useAdminFeedback,
  useAdminMaps,
} from "@/lib/context/AdminFeatureContexts";
import { useAdminMutation } from "@/lib/hooks/useAdminMutation";
import { importMaps, saveMap } from "@/lib/maps/mapClient";
import {
  getOverFastModeCodes,
  MAP_MODE_GROUP_CODE,
} from "@/lib/constants/maps";
import type { CodeItem } from "@/lib/types/codes";
import type { ExternalMap, MapFormData, MapItem } from "@/lib/types/maps";
import MapFormSection from "./components/MapFormSection";
import MapListSection from "./components/MapListSection";
import OverFastMapModal from "./components/OverFastMapModal";
import { EMPTY_MAP_FORM, toMapForm } from "./components/mapForm";

// 맵 관리 상태와 저장 동작, 세 개의 맵 관리 영역을 조율한다.
export default function AdminMapsPage() {
  const {
    items: maps,
    setItems: setMaps,
    isLoading: isMapsLoading,
  } = useAdminMaps();
  const { showFeedback } = useAdminFeedback();
  const { execute: mutateMap, isPending: isSaving } = useAdminMutation();
  const [mapModes, setMapModes] = useState<CodeItem[]>([]);
  const [isModesLoading, setIsModesLoading] = useState(true);
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [form, setForm] = useState<MapFormData>(EMPTY_MAP_FORM);

  const [isOverFastModalOpen, setIsOverFastModalOpen] = useState(false);
  const [externalMaps, setExternalMaps] = useState<ExternalMap[]>([]);
  const [isExternalLoading, setIsExternalLoading] = useState(false);
  const [selectedExternalKeys, setSelectedExternalKeys] = useState<string[]>(
    [],
  );

  useEffect(() => {
    // 맵 목록 필터와 편집 폼에서 사용하는 활성 MAP_MODE 공통코드를 불러온다.
    const loadMapModes = async () => {
      try {
        const response = await fetch(
          `/api/codes?groupCode=${MAP_MODE_GROUP_CODE}`,
        );
        const json = await response.json().catch(() => null);
        if (!response.ok || !json?.success || !Array.isArray(json.data)) {
          throw new Error(
            json?.message || "MAP_MODE 공통코드 조회에 실패했습니다.",
          );
        }
        setMapModes(json.data.filter((code: CodeItem) => code.isUse));
      } catch {
        showFeedback("MAP_MODE 공통코드를 불러오지 못했습니다.");
      } finally {
        setIsModesLoading(false);
      }
    };
    loadMapModes();
  }, [showFeedback]);

  const modeNameByCode = useMemo(
    () => new Map(mapModes.map((mode) => [mode.code, mode.name])),
    [mapModes],
  );
  const registeredBySourceKey = useMemo(
    () =>
      new Map(
        maps.filter((map) => map.sourceKey).map((map) => [map.sourceKey!, map]),
      ),
    [maps],
  );

  // 가져오기 모달이 열릴 때 최신 외부 맵 후보를 불러온다.
  const loadOverFastMaps = async () => {
    try {
      setIsExternalLoading(true);
      const response = await fetch("/api/overwatch/maps");
      const json = await response.json();
      if (!json.success) throw new Error(json.message);
      setExternalMaps(json.data);
    } catch (error: unknown) {
      showFeedback(
        error instanceof Error
          ? error.message
          : "외부 맵 데이터를 불러오지 못했습니다.",
      );
    } finally {
      setIsExternalLoading(false);
    }
  };

  // 외부 맵 선택 상태를 초기화하고 OverFast 가져오기 모달을 연다.
  const handleOpenOverFastModal = async () => {
    setIsOverFastModalOpen(true);
    setSelectedExternalKeys([]);
    await loadOverFastMaps();
  };

  // 등록 여부와 지원 모드를 확인한 뒤 외부 맵 선택 상태를 전환한다.
  const handleSelectExternalMap = (map: ExternalMap) => {
    if (registeredBySourceKey.has(map.sourceKey)) {
      showFeedback("이미 등록된 맵입니다.");
      return;
    }
    if (
      !getOverFastModeCodes(map.gamemodes).some((code) =>
        modeNameByCode.has(code),
      )
    ) {
      showFeedback("MAP_MODE 공통코드가 없는 모드의 맵은 선택할 수 없습니다.");
      return;
    }
    const isSelected = selectedExternalKeys.includes(map.sourceKey);
    if (isSelected) {
      setSelectedExternalKeys((current) =>
        current.filter((key) => key !== map.sourceKey),
      );
      return;
    }
    setSelectedExternalKeys((current) => [...current, map.sourceKey]);
  };

  // 선택한 등록 맵의 정보를 편집 폼에 반영한다.
  const handleSelectMap = (map: MapItem) => {
    setSelectedMapId(map.id);
    setForm(toMapForm(map));
  };

  // 새 맵 등록을 위해 편집 폼을 빈 상태로 전환한다.
  const handleNew = () => {
    setSelectedMapId(null);
    setForm(EMPTY_MAP_FORM);
    showFeedback("새 맵 등록 모드로 전환했습니다.");
  };

  // 직접 입력한 맵을 저장하고 저장된 결과를 관리자 상태에 반영한다.
  const handleSave = async () => {
    if (!form.nameEn.trim() || !form.mode) {
      showFeedback("영문명과 맵 모드는 필수입니다.");
      return;
    }
    await mutateMap(() => saveMap(form, selectedMapId), {
      successMessage: selectedMapId
        ? `[${form.nameKr}] 맵 정보를 수정했습니다.`
        : `[${form.nameKr}] 맵을 등록했습니다.`,
      errorMessage: "맵 저장에 실패했습니다.",
      onSuccess: (saved?: MapItem) => saved && applySavedMap(saved),
    });
  };

  // 저장된 맵을 전역 관리자 목록에 반영하고 해당 맵을 편집 대상으로 유지한다.
  const applySavedMap = (saved: MapItem) => {
    setMaps((current) =>
      current.some((map) => map.id === saved.id)
        ? current.map((map) => (map.id === saved.id ? saved : map))
        : [saved, ...current],
    );
    setSelectedMapId(saved.id);
    setForm(toMapForm(saved));
  };

  // 선택한 외부 맵을 검증한 뒤 맵 마스터 데이터로 일괄 등록한다.
  const handleSaveExternalMaps = async () => {
    const selectedExternalMaps = externalMaps.filter((map) =>
      selectedExternalKeys.includes(map.sourceKey),
    );
    if (selectedExternalMaps.length === 0) {
      showFeedback("등록할 외부 맵을 먼저 선택해 주세요.");
      return;
    }
    const hasUnsupportedMode = selectedExternalMaps.some(
      (map) =>
        !getOverFastModeCodes(map.gamemodes).some((code) =>
          modeNameByCode.has(code),
        ),
    );
    if (hasUnsupportedMode) {
      showFeedback("MAP_MODE 공통코드가 없는 모드의 맵이 포함되어 있습니다.");
      return;
    }
    await mutateMap(() => importMaps(selectedExternalMaps, modeNameByCode), {
      successMessage: (saved?: MapItem[]) =>
        `${saved?.length || 0}건의 맵을 DB에 등록했습니다.`,
      errorMessage:
        "외부 맵 등록에 실패했습니다. 어떤 맵도 저장되지 않았습니다.",
      onSuccess: (saved?: MapItem[]) => {
        if (!saved?.length) return;
        saved.forEach(applySavedMap);
        setIsOverFastModalOpen(false);
      },
    });
  };

  return (
    <section className="h-full min-h-0 flex flex-col">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full min-h-0 flex-1">
        <MapListSection
          maps={maps}
          mapModes={mapModes}
          modeNameByCode={modeNameByCode}
          selectedMapId={selectedMapId}
          onSelectMap={handleSelectMap}
          isLoading={isMapsLoading}
        />
        <MapFormSection
          selectedMapId={selectedMapId}
          form={form}
          setForm={setForm}
          mapModes={mapModes}
          isModesLoading={isModesLoading}
          isSaving={isSaving}
          onSave={handleSave}
          onNew={handleNew}
          onOpenOverFastModal={handleOpenOverFastModal}
        />
      </div>
      <OverFastMapModal
        isOpen={isOverFastModalOpen}
        onClose={() => setIsOverFastModalOpen(false)}
        isSaving={isSaving}
        externalMaps={externalMaps}
        isExternalLoading={isExternalLoading}
        selectedExternalKeys={selectedExternalKeys}
        registeredBySourceKey={registeredBySourceKey}
        modeNameByCode={modeNameByCode}
        onSelectMap={handleSelectExternalMap}
        onSave={handleSaveExternalMaps}
      />
    </section>
  );
}
