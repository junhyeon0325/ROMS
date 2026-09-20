// File: app/admin/heroes/hooks/useHeroManagement.ts
// Page/Component: useHeroManagement
// Purpose: 영웅 관리 화면의 조회·필터·저장과 OverFast 가져오기 상태를 조율한다.
"use client";

import { useEffect, useMemo, useState } from "react";
import { HERO_ROLE_GROUP_CODE } from "@/lib/constants/commonCodes";
import { useAdminFeedback, useAdminHeroes } from "@/lib/context/AdminFeatureContexts";
import { useAdminMutation } from "@/lib/hooks/useAdminMutation";
import { useCommonCodes } from "@/lib/hooks/useCommonCodes";
import { fetchOverFastHeroes, importHeroes, saveHero, type HeroFormData } from "@/lib/heroes/heroClient";
import type { ExternalHero, HeroItem, HeroRole } from "@/lib/types/heroes";

const EMPTY_HERO_FORM: HeroFormData = {
  nameKr: "",
  nameEn: "",
  role: "" as HeroRole,
  isPickable: true,
  imageUrl: "",
  desc: "",
};

// 영웅 관리에 필요한 상태와 이벤트 처리기를 페이지 UI에 제공한다.
export function useHeroManagement() {
  const { items: heroes, setItems: setHeroes, isLoading: isHeroesLoading } = useAdminHeroes();
  const { showFeedback } = useAdminFeedback();
  const { execute: mutateHero, isPending: isSaving } = useAdminMutation();
  const { codes: heroRoles, isLoading: isHeroRolesLoading, error: heroRolesError } = useCommonCodes(HERO_ROLE_GROUP_CODE);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | HeroRole>("ALL");
  const [usageFilter, setUsageFilter] = useState("ALL");
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);
  const [form, setForm] = useState<HeroFormData>(EMPTY_HERO_FORM);
  const [isOverFastModalOpen, setIsOverFastModalOpen] = useState(false);
  const [externalHeroes, setExternalHeroes] = useState<ExternalHero[]>([]);
  const [isExternalLoading, setIsExternalLoading] = useState(false);
  const [selectedExternalKeys, setSelectedExternalKeys] = useState<string[]>([]);

  const heroRoleNameByCode = useMemo(() => new Map(heroRoles.map((role) => [role.code, role.name])), [heroRoles]);
  const registeredBySourceKey = useMemo(() => new Map(heroes.filter((hero) => hero.sourceKey).map((hero) => [hero.sourceKey!, hero])), [heroes]);
  const registeredByNameEn = useMemo(() => new Set(heroes.map((hero) => hero.nameEn)), [heroes]);
  const filteredHeroes = useMemo(() => {
    const query = search.trim().toLowerCase();
    return heroes.filter((hero) => {
      const matchesSearch = !query || [hero.nameKr, hero.nameEn].some((value) => value.toLowerCase().includes(query));
      const matchesRole = roleFilter === "ALL" || hero.role === roleFilter;
      const matchesUsage = usageFilter === "ALL" || (usageFilter === "USE" ? hero.isPickable : !hero.isPickable);
      return matchesSearch && matchesRole && matchesUsage;
    });
  }, [heroes, roleFilter, search, usageFilter]);

  useEffect(() => { if (heroRolesError) showFeedback(heroRolesError); }, [heroRolesError, showFeedback]);
  // 신규 폼의 역할은 활성 HERO_ROLE 공통코드의 첫 항목으로 초기화한다.
  useEffect(() => {
    if (!selectedHeroId && !form.role && heroRoles[0]) {
      setForm((current) => ({ ...current, role: heroRoles[0].code }));
    }
  }, [form.role, heroRoles, selectedHeroId]);

  // 선택한 영웅의 정보를 편집 폼에 반영한다.
  const handleSelectHero = (hero: HeroItem) => {
    setSelectedHeroId(hero.id);
    setForm({ nameKr: hero.nameKr, nameEn: hero.nameEn, role: hero.role, isPickable: hero.isPickable, imageUrl: hero.imageUrl || "", desc: hero.desc });
  };
  const handleResetFilters = () => { setSearch(""); setRoleFilter("ALL"); setUsageFilter("ALL"); };
  const handleNew = () => {
    setSelectedHeroId(null);
    setForm({ ...EMPTY_HERO_FORM, role: heroRoles[0]?.code || "" });
    showFeedback("신규 영웅 등록 모드로 전환했습니다.");
  };
  const applySavedHero = (saved: HeroItem) => {
    setHeroes((current) => current.some((hero) => hero.id === saved.id) ? current.map((hero) => hero.id === saved.id ? saved : hero) : [saved, ...current]);
    handleSelectHero(saved);
  };
  // API 응답 계약을 유지한 클라이언트 함수를 통해 OverFast 목록을 불러온다.
  const handleOpenOverFastModal = async () => {
    setIsOverFastModalOpen(true);
    setSelectedExternalKeys([]);
    try {
      setIsExternalLoading(true);
      const json = await fetchOverFastHeroes();
      if (!json.success) throw new Error(json.message);
      setExternalHeroes(json.data || []);
    } catch (error) {
      showFeedback(error instanceof Error ? error.message : "외부 영웅 데이터를 불러오지 못했습니다.");
    } finally {
      setIsExternalLoading(false);
    }
  };
  const handleSelectExternalHero = (hero: ExternalHero) => {
    if (registeredBySourceKey.has(hero.sourceKey) || registeredByNameEn.has(hero.nameEn)) {
      showFeedback("이미 등록된 외부 영웅입니다.");
      return;
    }
    setSelectedExternalKeys((current) => current.includes(hero.sourceKey) ? current.filter((key) => key !== hero.sourceKey) : [...current, hero.sourceKey]);
  };
  const handleSelectAllExternalHeroes = (visibleHeroes: ExternalHero[]) => {
    const visibleKeys = visibleHeroes.map((hero) => hero.sourceKey);
    const isAllSelected = visibleKeys.every((key) => selectedExternalKeys.includes(key));
    setSelectedExternalKeys((current) => isAllSelected ? current.filter((key) => !visibleKeys.includes(key)) : [...new Set([...current, ...visibleKeys])]);
  };
  const handleSaveExternalHeroes = async () => {
    const selectedHeroes = externalHeroes.filter((hero) => selectedExternalKeys.includes(hero.sourceKey));
    if (!selectedHeroes.length) { showFeedback("등록할 외부 영웅을 선택해주세요."); return; }
    await mutateHero(() => importHeroes(selectedHeroes), {
      successMessage: (saved?: HeroItem[]) => `${saved?.length || 0}명의 영웅을 DB에 등록했습니다.`,
      errorMessage: "외부 영웅 등록에 실패했습니다.",
      onSuccess: (saved?: HeroItem[]) => { if (!saved?.length) return; saved.forEach(applySavedHero); setIsOverFastModalOpen(false); },
    });
  };
  const handleSave = async () => {
    if (!form.nameKr.trim() || !form.nameEn.trim()) { showFeedback("영웅 국문명과 영문명을 입력해주세요."); return; }
    if (!form.role) { showFeedback("영웅 역할 공통코드를 불러온 뒤 역할을 선택해주세요."); return; }
    await mutateHero(() => saveHero(form, selectedHeroId), {
      successMessage: selectedHeroId ? `[${form.nameKr}] 영웅 정보를 수정했습니다.` : `[${form.nameKr}] 영웅을 등록했습니다.`,
      errorMessage: "영웅 저장에 실패했습니다.",
      onSuccess: (saved?: HeroItem) => saved && applySavedHero(saved),
    });
  };

  return { externalHeroes, filteredHeroes, form, handleNew, handleOpenOverFastModal, handleResetFilters, handleSave, handleSaveExternalHeroes, handleSelectAllExternalHeroes, handleSelectExternalHero, handleSelectHero, heroRoleNameByCode, heroRoles, isExternalLoading, isFilterActive: Boolean(search) || roleFilter !== "ALL" || usageFilter !== "ALL", isHeroRolesLoading, isHeroesLoading, isOverFastModalOpen, isSaving, registeredByNameEn, registeredBySourceKey, roleFilter, search, selectedExternalKeys, selectedHeroId, setForm, setIsOverFastModalOpen, setRoleFilter, setSearch, setUsageFilter, usageFilter };
}
