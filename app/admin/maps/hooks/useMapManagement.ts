// File: app/admin/maps/hooks/useMapManagement.ts
// Page/Component: useMapManagement
// Purpose: 맵 관리 화면의 조회, 필터, 저장 및 OverFast 일괄 등록 상태를 조율한다.
"use client";

import { useEffect, useMemo, useState } from "react";
import { getOverFastModeCodes, MAP_MODE_GROUP_CODE } from "@/lib/constants/maps";
import { useAdminFeedback, useAdminMaps } from "@/lib/context/AdminFeatureContexts";
import { useAdminMutation } from "@/lib/hooks/useAdminMutation";
import { useCommonCodes } from "@/lib/hooks/useCommonCodes";
import { importMaps, saveMap } from "@/lib/maps/mapClient";
import type { ExternalMap, MapFormData, MapItem } from "@/lib/types/maps";
import { EMPTY_MAP_FORM, toMapForm } from "../components/mapForm";

// 맵 관리 화면에서 필요한 데이터와 사용자 동작을 제공한다.
export function useMapManagement() {
  const { items: maps, setItems: setMaps, isLoading: isMapsLoading } = useAdminMaps();
  const { showFeedback } = useAdminFeedback();
  const { execute: mutateMap, isPending: isSaving } = useAdminMutation();
  const { codes: mapModes, isLoading: isModesLoading, error: mapModesError } = useCommonCodes(MAP_MODE_GROUP_CODE);
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState("ALL");
  const [poolFilter, setPoolFilter] = useState("ALL");
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [form, setForm] = useState<MapFormData>(EMPTY_MAP_FORM);
  const [isOverFastModalOpen, setIsOverFastModalOpen] = useState(false);
  const [externalMaps, setExternalMaps] = useState<ExternalMap[]>([]);
  const [isExternalLoading, setIsExternalLoading] = useState(false);
  const [selectedExternalKeys, setSelectedExternalKeys] = useState<string[]>([]);

  const modeNameByCode = useMemo(() => new Map(mapModes.map((mode) => [mode.code, mode.name])), [mapModes]);
  const registeredBySourceKey = useMemo(() => new Map(maps.filter((map) => map.sourceKey).map((map) => [map.sourceKey!, map])), [maps]);
  const filteredMaps = useMemo(() => {
    const query = search.trim().toLowerCase();
    return maps.filter((map) => {
      const matchesText = !query || [map.nameKr, map.nameEn, map.location].some((value) => value.toLowerCase().includes(query));
      const matchesMode = modeFilter === "ALL" || map.mode === modeFilter;
      const matchesPool = poolFilter === "ALL" || (poolFilter === "ACTIVE" ? map.isActive : !map.isActive);
      return matchesText && matchesMode && matchesPool;
    });
  }, [maps, modeFilter, poolFilter, search]);

  useEffect(() => { if (mapModesError) showFeedback("MAP_MODE 공통코드를 불러오지 못했습니다."); }, [mapModesError, showFeedback]);

  // 목록 검색과 필터를 초기 상태로 되돌린다.
  const handleResetFilters = () => { setSearch(""); setModeFilter("ALL"); setPoolFilter("ALL"); };
  const handleSelectMap = (map: MapItem) => { setSelectedMapId(map.id); setForm(toMapForm(map)); };
  const handleNew = () => { setSelectedMapId(null); setForm(EMPTY_MAP_FORM); showFeedback("신규 맵 등록 모드로 전환했습니다."); };
  const applySavedMap = (saved: MapItem) => {
    setMaps((current) => current.some((map) => map.id === saved.id) ? current.map((map) => map.id === saved.id ? saved : map) : [saved, ...current]);
    handleSelectMap(saved);
  };
  const handleSave = async () => {
    if (!form.nameEn.trim() || !form.mode) { showFeedback("영문명과 맵 모드는 필수입니다."); return; }
    await mutateMap(() => saveMap(form, selectedMapId), {
      successMessage: selectedMapId ? `[${form.nameKr}] 맵 정보를 수정했습니다.` : `[${form.nameKr}] 맵을 등록했습니다.`,
      errorMessage: "맵 저장에 실패했습니다.",
      onSuccess: (saved?: MapItem) => saved && applySavedMap(saved),
    });
  };
  const loadOverFastMaps = async () => {
    try {
      setIsExternalLoading(true);
      const response = await fetch("/api/overwatch/maps");
      const json = await response.json();
      if (!json.success) throw new Error(json.message);
      setExternalMaps(json.data);
    } catch (error: unknown) {
      showFeedback(error instanceof Error ? error.message : "외부 맵 데이터를 불러오지 못했습니다.");
    } finally { setIsExternalLoading(false); }
  };
  const handleOpenOverFastModal = async () => { setIsOverFastModalOpen(true); setSelectedExternalKeys([]); await loadOverFastMaps(); };
  const handleSelectExternalMap = (map: ExternalMap) => {
    if (registeredBySourceKey.has(map.sourceKey)) { showFeedback("이미 등록된 맵입니다."); return; }
    if (!getOverFastModeCodes(map.gamemodes).some((code) => modeNameByCode.has(code))) { showFeedback("MAP_MODE 공통코드가 없는 모드의 맵은 선택할 수 없습니다."); return; }
    setSelectedExternalKeys((current) => current.includes(map.sourceKey) ? current.filter((key) => key !== map.sourceKey) : [...current, map.sourceKey]);
  };
  const handleSaveExternalMaps = async () => {
    const selectedExternalMaps = externalMaps.filter((map) => selectedExternalKeys.includes(map.sourceKey));
    if (!selectedExternalMaps.length) { showFeedback("등록할 외부 맵을 먼저 선택해 주세요."); return; }
    if (selectedExternalMaps.some((map) => !getOverFastModeCodes(map.gamemodes).some((code) => modeNameByCode.has(code)))) { showFeedback("MAP_MODE 공통코드가 없는 모드의 맵이 포함되어 있습니다."); return; }
    await mutateMap(() => importMaps(selectedExternalMaps, modeNameByCode), {
      successMessage: (saved?: MapItem[]) => `${saved?.length || 0}건의 맵을 DB에 등록했습니다.`,
      errorMessage: "외부 맵 등록에 실패했습니다. 어떤 맵도 등록되지 않습니다.",
      onSuccess: (saved?: MapItem[]) => { if (!saved?.length) return; saved.forEach(applySavedMap); setIsOverFastModalOpen(false); },
    });
  };

  return { externalMaps, filteredMaps, form, handleNew, handleOpenOverFastModal, handleResetFilters, handleSave, handleSaveExternalMaps, handleSelectExternalMap, handleSelectMap, isExternalLoading, isFilterActive: Boolean(search) || modeFilter !== "ALL" || poolFilter !== "ALL", isMapsLoading, isModesLoading, isOverFastModalOpen, isSaving, mapModes, modeFilter, modeNameByCode, poolFilter, registeredBySourceKey, search, selectedExternalKeys, selectedMapId, setForm, setIsOverFastModalOpen, setModeFilter, setPoolFilter, setSearch };
}
