// File: app/admin/maps/page.tsx
// Page/Component: AdminMapsPage
// Purpose: 맵 관리 UI 섹션과 useMapManagement의 상태·동작을 연결한다.
"use client";

import MapFormSection from "./components/MapFormSection";
import MapListSection from "./components/MapListSection";
import OverFastMapModal from "./components/OverFastMapModal";
import { useMapManagement } from "./hooks/useMapManagement";

// 맵 관리 화면의 표시 컴포넌트에 전용 훅의 값과 동작을 전달한다.
export default function AdminMapsPage() {
  const mapManagement = useMapManagement();

  return (
    <section className="h-full min-h-0 flex flex-col">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full min-h-0 flex-1">
        <MapListSection maps={mapManagement.filteredMaps} mapModes={mapManagement.mapModes} modeNameByCode={mapManagement.modeNameByCode} selectedMapId={mapManagement.selectedMapId} isLoading={mapManagement.isMapsLoading} search={mapManagement.search} modeFilter={mapManagement.modeFilter} poolFilter={mapManagement.poolFilter} isFilterActive={mapManagement.isFilterActive} onSelectMap={mapManagement.handleSelectMap} onResetFilters={mapManagement.handleResetFilters} setSearch={mapManagement.setSearch} setModeFilter={mapManagement.setModeFilter} setPoolFilter={mapManagement.setPoolFilter} />
        <MapFormSection selectedMapId={mapManagement.selectedMapId} form={mapManagement.form} setForm={mapManagement.setForm} mapModes={mapManagement.mapModes} isModesLoading={mapManagement.isModesLoading} isSaving={mapManagement.isSaving} onSave={mapManagement.handleSave} onNew={mapManagement.handleNew} onOpenOverFastModal={mapManagement.handleOpenOverFastModal} />
      </div>
      <OverFastMapModal isOpen={mapManagement.isOverFastModalOpen} onClose={() => mapManagement.setIsOverFastModalOpen(false)} isSaving={mapManagement.isSaving} externalMaps={mapManagement.externalMaps} isExternalLoading={mapManagement.isExternalLoading} selectedExternalKeys={mapManagement.selectedExternalKeys} registeredBySourceKey={mapManagement.registeredBySourceKey} modeNameByCode={mapManagement.modeNameByCode} onSelectMap={mapManagement.handleSelectExternalMap} onSave={mapManagement.handleSaveExternalMaps} />
    </section>
  );
}
