// File: app/admin/heroes/components/HeroFormSection.tsx
// Page/Component: HeroFormSection
// Purpose: 영웅 신규 등록·수정 입력 폼과 OverFast 가져오기 진입점을 제공한다.
"use client";

import type { Dispatch, SetStateAction } from "react";
import AdminCard from "@/components/admin/AdminCard";
import AdminFormActions from "@/components/admin/AdminFormActions";
import AdminFormField from "@/components/admin/AdminFormField";
import AdminStatusRadio from "@/components/admin/AdminStatusRadio";
import type { CodeItem } from "@/lib/types/codes";
import type { HeroRole } from "@/lib/types/heroes";
import type { HeroFormData } from "@/lib/heroes/heroClient";

interface HeroFormSectionProps {
  selectedHeroId: string | null;
  form: HeroFormData;
  setForm: Dispatch<SetStateAction<HeroFormData>>;
  heroRoles: CodeItem[];
  isHeroRolesLoading: boolean;
  isSaving: boolean;
  onNew: () => void;
  onOpenOverFastModal: () => void;
  onSave: () => void;
}

// 영웅 입력 폼의 값 변경은 상위 기능 hook에서 관리한다.
export default function HeroFormSection({
  selectedHeroId,
  form,
  setForm,
  heroRoles,
  isHeroRolesLoading,
  isSaving,
  onNew,
  onOpenOverFastModal,
  onSave,
}: HeroFormSectionProps) {
  return (
    <div className="xl:col-span-5 h-full min-h-0 flex flex-col">
      <AdminCard
        title={selectedHeroId ? "영웅 정보 수정" : "신규 영웅 등록"}
        className="h-full"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenOverFastModal}
              className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 transition hover:bg-sky-100 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-300"
            >
              OverFast 목록 불러오기
            </button>
            <AdminFormActions
              onSave={onSave}
              onNew={onNew}
              isEditing={!!selectedHeroId}
              saveDisabled={isSaving || isHeroRolesLoading || !heroRoles.length}
              saveLabel={isSaving ? "저장 중..." : "저장"}
            />
          </div>
        }
      >
        <div className="space-y-4 overflow-y-auto pr-1.5 custom-scrollbar">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AdminFormField label="영웅 이름 (국문)" required>
              <input
                value={form.nameKr}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    nameKr: event.target.value,
                  }))
                }
                placeholder="예: 트레이서"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-[#f99e1a] focus:outline-none dark:border-slate-700 dark:bg-slate-800"
              />
            </AdminFormField>
            <AdminFormField label="영웅 이름 (영문)" required>
              <input
                value={form.nameEn}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    nameEn: event.target.value,
                  }))
                }
                placeholder="예: Tracer"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono focus:border-[#f99e1a] focus:outline-none dark:border-slate-700 dark:bg-slate-800"
              />
            </AdminFormField>
          </div>
          <AdminFormField label="영웅 이미지 URL">
            <div className="flex items-center gap-3">
              <input
                value={form.imageUrl}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    imageUrl: event.target.value,
                  }))
                }
                placeholder="https://..."
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono focus:border-[#f99e1a] focus:outline-none dark:border-slate-700 dark:bg-slate-800"
              />
              {form.imageUrl ? (
                <img
                  src={form.imageUrl}
                  alt="영웅 이미지 미리보기"
                  className="h-10 w-10 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800" />
              )}
            </div>
          </AdminFormField>
          <AdminFormField label="역할군" required>
            <select
              value={form.role}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  role: event.target.value as HeroRole,
                }))
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-[#f99e1a] focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="">영웅 역할을 선택하세요</option>
              {heroRoles.map((role) => (
                <option key={role.code} value={role.code}>
                  {role.name} ({role.code})
                </option>
              ))}
            </select>
          </AdminFormField>
          <AdminStatusRadio
            label="사용 여부"
            name="heroIsPickable"
            value={form.isPickable}
            onChange={(isPickable) =>
              setForm((current) => ({ ...current, isPickable }))
            }
            inactiveDescription="미사용 영웅은 대회 밴픽과 선수 기록 입력의 선택 목록에서 제외되며, 기존 기록은 유지됩니다."
          />
          <AdminFormField label="설명 / 비고">
            <textarea
              rows={4}
              value={form.desc}
              onChange={(event) =>
                setForm((current) => ({ ...current, desc: event.target.value }))
              }
              placeholder="플레이 스타일이나 대회 운영 참고사항을 입력하세요."
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-[#f99e1a] focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            />
          </AdminFormField>
        </div>
      </AdminCard>
    </div>
  );
}
