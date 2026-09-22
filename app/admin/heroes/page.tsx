// File: app/admin/heroes/page.tsx
// Page/Component: AdminHeroesPage
// Purpose: 영웅 관리 기능의 목록·입력 UI와 OverFast 가져오기 모달을 조합한다.
"use client";

import HeroFormSection from "./components/HeroFormSection";
import HeroListSection from "./components/HeroListSection";
import OverFastHeroModal from "./components/OverFastHeroModal";
import { useHeroManagement } from "./hooks/useHeroManagement";

// 영웅 관리 기능 hook의 상태를 각 화면 구성요소에 연결한다.
export default function AdminHeroesPage() {
  const heroManagement = useHeroManagement();

  return (
    <section className="h-full min-h-0 flex flex-col">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full min-h-0 flex-1">
        <HeroListSection heroes={heroManagement.filteredHeroes} heroRoles={heroManagement.heroRoles} heroRoleNameByCode={heroManagement.heroRoleNameByCode} isFilterActive={heroManagement.isFilterActive} isLoading={heroManagement.isHeroesLoading} roleFilter={heroManagement.roleFilter} search={heroManagement.search} selectedHeroId={heroManagement.selectedHeroId} usageFilter={heroManagement.usageFilter} onResetFilters={heroManagement.handleResetFilters} onSelectHero={heroManagement.handleSelectHero} setRoleFilter={heroManagement.setRoleFilter} setSearch={heroManagement.setSearch} setUsageFilter={heroManagement.setUsageFilter} />
        <HeroFormSection selectedHeroId={heroManagement.selectedHeroId} form={heroManagement.form} setForm={heroManagement.setForm} heroRoles={heroManagement.heroRoles} isHeroRolesLoading={heroManagement.isHeroRolesLoading} isSaving={heroManagement.isSaving} onNew={heroManagement.handleNew} onOpenOverFastModal={heroManagement.handleOpenOverFastModal} onSave={heroManagement.handleSave} />
      </div>
      <OverFastHeroModal isOpen={heroManagement.isOverFastModalOpen} isSaving={heroManagement.isSaving} isExternalLoading={heroManagement.isExternalLoading} externalHeroes={heroManagement.externalHeroes} selectedExternalKeys={heroManagement.selectedExternalKeys} registeredBySourceKey={heroManagement.registeredBySourceKey} registeredByNameEn={heroManagement.registeredByNameEn} onClose={() => heroManagement.setIsOverFastModalOpen(false)} onSelectHero={heroManagement.handleSelectExternalHero} onSelectAllHeroes={heroManagement.handleSelectAllExternalHeroes} onSave={heroManagement.handleSaveExternalHeroes} heroRoleNameByCode={heroManagement.heroRoleNameByCode} />
    </section>
  );
}
