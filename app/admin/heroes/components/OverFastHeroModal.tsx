// File: app/admin/heroes/components/OverFastHeroModal.tsx
// Page/Component: OverFastHeroModal
// Purpose: OverFast 영웅을 검색·선택해 영웅 마스터에 일괄 등록하는 모달을 제공한다.
"use client";

import { useEffect, useMemo, useState } from "react";
import AdminBadge from "@/components/admin/AdminBadge";
import AdminModal from "@/components/admin/AdminModal";
import AdminSearchInput from "@/components/admin/AdminSearchInput";
import AdminTable, { AdminTableColumn } from "@/components/admin/AdminTable";
import { HeroRole } from "@/lib/types/admin";
import { ExternalHero } from "@/lib/types/admin";

interface OverFastHeroModalProps {
  isOpen: boolean;
  isSaving: boolean;
  isExternalLoading: boolean;
  externalHeroes: ExternalHero[];
  selectedExternalKeys: string[];
  registeredBySourceKey: Map<string, unknown>;
  registeredByNameEn: Set<string>;
  onClose: () => void;
  onSelectHero: (hero: ExternalHero) => void;
  onSelectAllHeroes: (heroes: ExternalHero[]) => void;
  onSave: () => void;
}

const ROLE_LABEL: Record<HeroRole, string> = { TANK: "돌격", DAMAGE: "공격", SUPPORT: "지원" };

// 검색 상태를 모달 내부에 유지하며 외부 영웅 선택 목록을 표시한다.
export default function OverFastHeroModal({ isOpen, isSaving, isExternalLoading, externalHeroes, selectedExternalKeys, registeredBySourceKey, registeredByNameEn, onClose, onSelectHero, onSelectAllHeroes, onSave }: OverFastHeroModalProps) {
  const [search, setSearch] = useState("");

  useEffect(() => { if (isOpen) setSearch(""); }, [isOpen]);

  const filteredHeroes = useMemo(() => {
    const query = search.trim().toLowerCase();
    return externalHeroes.filter((hero) => !query || [hero.nameEn, hero.role, hero.subrole].some((value) => value.toLowerCase().includes(query)));
  }, [externalHeroes, search]);
  const selectedHeroes = useMemo(() => externalHeroes.filter((hero) => selectedExternalKeys.includes(hero.sourceKey)), [externalHeroes, selectedExternalKeys]);
  // 출처 식별자와 영문명 모두를 기준으로 이미 등록된 외부 영웅을 제외한다.
  const selectableHeroes = useMemo(() => filteredHeroes.filter((hero) => !registeredBySourceKey.has(hero.sourceKey) && !registeredByNameEn.has(hero.nameEn)), [filteredHeroes, registeredByNameEn, registeredBySourceKey]);
  const isAllSelectableSelected = selectableHeroes.length > 0 && selectableHeroes.every((hero) => selectedExternalKeys.includes(hero.sourceKey));

  const columns: AdminTableColumn<ExternalHero>[] = useMemo(() => [
    { key: "select", header: <input type="checkbox" checked={isAllSelectableSelected} disabled={!selectableHeroes.length} onChange={() => onSelectAllHeroes(selectableHeroes)} className="h-3.5 w-3.5 rounded border-slate-300 text-[#f99e1a] accent-[#f99e1a] disabled:cursor-not-allowed disabled:opacity-40" aria-label="검색 결과 전체 선택" />, width: "w-16", align: "center", render: (hero) => <input type="checkbox" checked={selectedExternalKeys.includes(hero.sourceKey)} disabled={registeredBySourceKey.has(hero.sourceKey) || registeredByNameEn.has(hero.nameEn)} onClick={(event) => event.stopPropagation()} onChange={() => onSelectHero(hero)} className="h-3.5 w-3.5 rounded border-slate-300 text-[#f99e1a] accent-[#f99e1a] disabled:cursor-not-allowed disabled:opacity-40" aria-label={`${hero.nameEn} 선택`} /> },
    { key: "nameEn", header: "영웅", width: "min-w-[220px]", render: (hero) => <div className="flex items-center gap-2.5">{hero.imageUrl ? <img src={hero.imageUrl} alt="" className="h-10 w-10 rounded-full border border-slate-200 object-cover dark:border-slate-700" /> : <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800" />}<div><p className="font-bold text-slate-900 dark:text-slate-100">{hero.nameEn}</p><p className="mt-0.5 text-[10px] text-slate-400">{hero.subrole || "-"}</p></div></div> },
    { key: "role", header: "역할군", width: "w-28", render: (hero) => <AdminBadge variant={hero.role === "TANK" ? "brand" : hero.role === "DAMAGE" ? "danger" : "success"}>{ROLE_LABEL[hero.role]}</AdminBadge> },
    { key: "sourceKey", header: "상태", width: "w-24", render: (hero) => <AdminBadge variant={registeredBySourceKey.has(hero.sourceKey) || registeredByNameEn.has(hero.nameEn) ? "success" : "neutral"}>{registeredBySourceKey.has(hero.sourceKey) || registeredByNameEn.has(hero.nameEn) ? "등록됨" : "미등록"}</AdminBadge> },
  ], [isAllSelectableSelected, onSelectAllHeroes, onSelectHero, registeredByNameEn, registeredBySourceKey, selectableHeroes, selectedExternalKeys]);

  return <AdminModal isOpen={isOpen} onClose={() => !isSaving && onClose()} title="OverFast 영웅 목록 불러오기" description="등록할 영웅을 여러 개 선택한 뒤 저장하면 영웅 마스터에 즉시 등록됩니다." maxWidth="4xl" bodyClassName="p-5 overflow-y-auto flex-1 min-h-0 space-y-4" footer={<div className="flex items-center justify-between gap-3"><span className="text-[11px] text-slate-400">{selectedHeroes.length ? `${selectedHeroes.length}명 선택됨` : "등록할 영웅을 선택해주세요."}</span><div className="flex gap-2"><button type="button" onClick={onClose} disabled={isSaving} className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">취소</button><button type="button" onClick={onSave} disabled={!selectedHeroes.length || isSaving} className="rounded-lg bg-[#f99e1a] px-3.5 py-1.5 text-xs font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">{isSaving ? "저장 중..." : `DB 저장 (${selectedHeroes.length}명)`}</button></div></div>}>
    <AdminSearchInput label="외부 영웅 검색" placeholder="영문 이름, 역할군 또는 하위 역할 검색..." value={search} onChange={setSearch} />
    <div className="h-[420px] shrink-0"><AdminTable columns={columns} data={filteredHeroes} keyField="sourceKey" selectedId={null} onRowClick={onSelectHero} isLoading={isExternalLoading} emptyTitle="외부 영웅 목록을 불러오는 중입니다." emptyDescription="OverFast API 응답을 기다리고 있습니다." /></div>
  </AdminModal>;
}
