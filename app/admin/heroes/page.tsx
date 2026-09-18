// File: app/admin/heroes/page.tsx
// Page/Component: AdminHeroesPage
// Purpose: 영웅 마스터 데이터를 검색·필터하고 등록 또는 수정하는 관리자 페이지다.
"use client";

import { useMemo, useState } from "react";
import AdminBadge from "@/components/admin/AdminBadge";
import AdminCard from "@/components/admin/AdminCard";
import AdminFilterPanel from "@/components/admin/AdminFilterPanel";
import AdminFilterTabs from "@/components/admin/AdminFilterTabs";
import AdminFormActions from "@/components/admin/AdminFormActions";
import AdminFormField from "@/components/admin/AdminFormField";
import AdminSearchInput from "@/components/admin/AdminSearchInput";
import AdminStatusRadio from "@/components/admin/AdminStatusRadio";
import AdminTable, { AdminTableColumn } from "@/components/admin/AdminTable";
import { useAdmin } from "@/lib/context/AdminContext";
import { useAdminMutation } from "@/lib/hooks/useAdminMutation";
import { ExternalHero, HeroItem, HeroRole } from "@/lib/types/admin";
import OverFastHeroModal from "./components/OverFastHeroModal";

const EMPTY_HERO_FORM = { nameKr: "", nameEn: "", role: "DAMAGE" as HeroRole, isPickable: true, imageUrl: "", desc: "" };
const ROLE_LABEL: Record<HeroRole, string> = { TANK: "돌격", DAMAGE: "공격", SUPPORT: "지원" };

// 영웅 관리 상태와 API 저장 동작을 조율한다.
export default function AdminHeroesPage() {
  const { heroes, setHeroes, showFeedback, isHeroesLoading } = useAdmin();
  const { execute: mutateHero, isPending: isSaving } = useAdminMutation();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | HeroRole>("ALL");
  const [usageFilter, setUsageFilter] = useState("ALL");
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_HERO_FORM);
  const [isOverFastModalOpen, setIsOverFastModalOpen] = useState(false);
  const [externalHeroes, setExternalHeroes] = useState<ExternalHero[]>([]);
  const [isExternalLoading, setIsExternalLoading] = useState(false);
  const [selectedExternalKeys, setSelectedExternalKeys] = useState<string[]>([]);

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

  const isFilterActive = Boolean(search) || roleFilter !== "ALL" || usageFilter !== "ALL";

  // 영웅 목록의 검색어와 필터를 기본값으로 되돌린다.
  const handleResetFilters = () => {
    setSearch("");
    setRoleFilter("ALL");
    setUsageFilter("ALL");
  };

  const heroColumns: AdminTableColumn<HeroItem>[] = useMemo(() => [
    { key: "nameKr", header: "영웅 이름", width: "min-w-[190px]", render: (hero) => <div className="flex items-center gap-2.5">{hero.imageUrl ? <img src={hero.imageUrl} alt="" className="h-10 w-10 rounded-full border border-slate-200 object-cover dark:border-slate-700" /> : <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800" />}<div><p className="font-bold text-slate-900 dark:text-slate-100">{hero.nameKr}</p><p className="mt-0.5 text-[10px] font-mono text-slate-400">{hero.nameEn}</p></div></div> },
    { key: "role", header: "역할군", width: "w-24", render: (hero) => <AdminBadge variant={hero.role === "TANK" ? "brand" : hero.role === "DAMAGE" ? "danger" : "success"}>{ROLE_LABEL[hero.role]}</AdminBadge> },
    { key: "isPickable", header: "사용 여부", width: "w-24", align: "center", render: (hero) => <AdminBadge variant={hero.isPickable ? "success" : "neutral"}>{hero.isPickable ? "사용" : "미사용"}</AdminBadge> },
  ], []);

  // 선택한 영웅의 값을 우측 편집 폼에 채운다.
  const handleSelectHero = (hero: HeroItem) => {
    setSelectedHeroId(hero.id);
    setForm({ nameKr: hero.nameKr, nameEn: hero.nameEn, role: hero.role, isPickable: hero.isPickable, imageUrl: hero.imageUrl || "", desc: hero.desc });
  };

  // 신규 등록을 위해 영웅 선택과 입력값을 초기화한다.
  const handleNew = () => {
    setSelectedHeroId(null);
    setForm(EMPTY_HERO_FORM);
    showFeedback("신규 영웅 등록 모드로 전환했습니다.");
  };

  // 등록 또는 수정 결과를 전역 영웅 목록과 폼에 즉시 반영한다.
  const applySavedHero = (saved: HeroItem) => {
    setHeroes((current) => current.some((hero) => hero.id === saved.id) ? current.map((hero) => hero.id === saved.id ? saved : hero) : [saved, ...current]);
    handleSelectHero(saved);
  };

  // 모달을 열 때 최신 OverFast 영웅 목록을 불러오고 선택값을 초기화한다.
  const handleOpenOverFastModal = async () => {
    setIsOverFastModalOpen(true);
    setSelectedExternalKeys([]);
    try {
      setIsExternalLoading(true);
      const response = await fetch("/api/overwatch/heroes");
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.message);
      setExternalHeroes(json.data);
    } catch (error) {
      showFeedback(error instanceof Error ? error.message : "외부 영웅 데이터를 불러오지 못했습니다.");
    } finally {
      setIsExternalLoading(false);
    }
  };

  // 출처 식별자 또는 영문명이 이미 등록된 영웅은 외부 목록에서 다시 선택하지 못하게 한다.
  const handleSelectExternalHero = (hero: ExternalHero) => {
    if (registeredBySourceKey.has(hero.sourceKey) || registeredByNameEn.has(hero.nameEn)) {
      showFeedback("이미 등록된 외부 영웅입니다.");
      return;
    }
    setSelectedExternalKeys((current) => current.includes(hero.sourceKey) ? current.filter((key) => key !== hero.sourceKey) : [...current, hero.sourceKey]);
  };

  // 현재 검색 결과의 등록 가능 영웅을 모두 선택하거나 해당 선택만 해제한다.
  const handleSelectAllExternalHeroes = (visibleHeroes: ExternalHero[]) => {
    const visibleKeys = visibleHeroes.map((hero) => hero.sourceKey);
    const isAllSelected = visibleKeys.every((key) => selectedExternalKeys.includes(key));
    setSelectedExternalKeys((current) => isAllSelected ? current.filter((key) => !visibleKeys.includes(key)) : [...new Set([...current, ...visibleKeys])]);
  };

  // 선택한 외부 영웅을 하나의 요청으로 검증·등록하고 목록에 반영한다.
  const handleSaveExternalHeroes = async () => {
    const selectedHeroes = externalHeroes.filter((hero) => selectedExternalKeys.includes(hero.sourceKey));
    if (!selectedHeroes.length) {
      showFeedback("등록할 외부 영웅을 선택해주세요.");
      return;
    }
    await mutateHero(async () => {
      const response = await fetch("/api/heroes/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ heroes: selectedHeroes }) });
      return response.json();
    }, { successMessage: (saved?: HeroItem[]) => `${saved?.length || 0}명의 영웅을 DB에 등록했습니다.`, errorMessage: "외부 영웅 등록에 실패했습니다.", onSuccess: (saved?: HeroItem[]) => { if (!saved?.length) return; saved.forEach(applySavedHero); setIsOverFastModalOpen(false); } });
  };

  // 필수 입력값을 확인한 뒤 영웅 등록 또는 수정 API를 호출한다.
  const handleSave = async () => {
    if (!form.nameKr.trim() || !form.nameEn.trim()) {
      showFeedback("영웅 국문명과 영문명을 입력해주세요.");
      return;
    }
    await mutateHero(async () => {
      const response = await fetch("/api/heroes", { method: selectedHeroId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(selectedHeroId ? { ...form, id: selectedHeroId } : form) });
      return response.json();
    }, { successMessage: selectedHeroId ? `[${form.nameKr}] 영웅 정보를 수정했습니다.` : `[${form.nameKr}] 영웅을 등록했습니다.`, errorMessage: "영웅 저장에 실패했습니다.", onSuccess: (saved?: HeroItem) => saved && applySavedHero(saved) });
  };

  return <section className="h-full min-h-0 flex flex-col">
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full min-h-0 flex-1">
      <div className="xl:col-span-7 h-full min-h-0 flex flex-col"><AdminCard title="등록된 영웅 목록" countBadge={`총 ${filteredHeroes.length}명`} className="h-full" actions={<button type="button" disabled={!isFilterActive} onClick={handleResetFilters} className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-[0.98]" title="검색 조건 초기화"><svg className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg><span>조건 초기화</span></button>}>
        <AdminFilterPanel>
          <AdminSearchInput label="영웅 이름 검색" value={search} onChange={setSearch} placeholder="예: D.Va, 트레이서, Ana" containerClassName="lg:col-span-3" />
          <AdminFilterTabs label="사용 여부" tabs={[{ code: "ALL", name: "전체" }, { code: "USE", name: "사용" }, { code: "UNUSED", name: "미사용" }]} activeTab={usageFilter} onChange={setUsageFilter} containerClassName="lg:col-span-3" />
          <AdminFilterTabs label="역할군" tabs={[{ code: "ALL", name: "전체" }, { code: "TANK", name: "돌격" }, { code: "DAMAGE", name: "공격" }, { code: "SUPPORT", name: "지원" }]} activeTab={roleFilter} onChange={(value) => setRoleFilter(value as "ALL" | HeroRole)} containerClassName="lg:col-span-6" />
        </AdminFilterPanel>
        <AdminTable columns={heroColumns} data={filteredHeroes} selectedId={selectedHeroId} onRowClick={handleSelectHero} isLoading={isHeroesLoading} emptyTitle="등록된 영웅이 없습니다." emptyDescription="우측의 신규 등록 버튼으로 영웅을 추가해주세요." />
      </AdminCard></div>
      <div className="xl:col-span-5 h-full min-h-0 flex flex-col"><AdminCard title={selectedHeroId ? "영웅 정보 수정" : "신규 영웅 등록"} className="h-full" actions={<div className="flex items-center gap-2"><button type="button" onClick={handleOpenOverFastModal} className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 transition hover:bg-sky-100 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-300">OverFast 목록 불러오기</button><AdminFormActions onSave={handleSave} onNew={handleNew} isEditing={!!selectedHeroId} saveDisabled={isSaving} saveLabel={isSaving ? "저장 중..." : "저장"} /></div>}>
        <div className="space-y-4 overflow-y-auto pr-1.5 custom-scrollbar">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AdminFormField label="영웅 이름 (국문)" required><input value={form.nameKr} onChange={(event) => setForm((current) => ({ ...current, nameKr: event.target.value }))} placeholder="예: 트레이서" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-[#f99e1a] focus:outline-none dark:border-slate-700 dark:bg-slate-800" /></AdminFormField>
            <AdminFormField label="영웅 이름 (영문)" required><input value={form.nameEn} onChange={(event) => setForm((current) => ({ ...current, nameEn: event.target.value }))} placeholder="예: Tracer" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono focus:border-[#f99e1a] focus:outline-none dark:border-slate-700 dark:bg-slate-800" /></AdminFormField>
          </div>
          <AdminFormField label="영웅 이미지 URL"><div className="flex items-center gap-3"><input value={form.imageUrl} onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value }))} placeholder="https://..." className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono focus:border-[#f99e1a] focus:outline-none dark:border-slate-700 dark:bg-slate-800" />{form.imageUrl ? <img src={form.imageUrl} alt="영웅 이미지 미리보기" className="h-10 w-10 rounded-full border border-slate-200 object-cover dark:border-slate-700" /> : <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800" />}</div></AdminFormField>
          <AdminFormField label="역할군" required><select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as HeroRole }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-[#f99e1a] focus:outline-none dark:border-slate-700 dark:bg-slate-800"><option value="TANK">돌격 (Tank)</option><option value="DAMAGE">공격 (Damage)</option><option value="SUPPORT">지원 (Support)</option></select></AdminFormField>
          <AdminStatusRadio label="사용 여부" name="heroIsPickable" value={form.isPickable} onChange={(isPickable) => setForm((current) => ({ ...current, isPickable }))} inactiveDescription="미사용 영웅은 대회 밴픽과 선수 기록 입력의 선택 목록에서 제외되며, 기존 기록은 유지됩니다." />
          <AdminFormField label="설명 / 비고"><textarea rows={4} value={form.desc} onChange={(event) => setForm((current) => ({ ...current, desc: event.target.value }))} placeholder="플레이 스타일이나 대회 운영 참고사항을 입력하세요." className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-[#f99e1a] focus:outline-none dark:border-slate-700 dark:bg-slate-800" /></AdminFormField>
        </div>
      </AdminCard></div>
    </div>
    <OverFastHeroModal isOpen={isOverFastModalOpen} isSaving={isSaving} isExternalLoading={isExternalLoading} externalHeroes={externalHeroes} selectedExternalKeys={selectedExternalKeys} registeredBySourceKey={registeredBySourceKey} registeredByNameEn={registeredByNameEn} onClose={() => setIsOverFastModalOpen(false)} onSelectHero={handleSelectExternalHero} onSelectAllHeroes={handleSelectAllExternalHeroes} onSave={handleSaveExternalHeroes} />
  </section>;
}
