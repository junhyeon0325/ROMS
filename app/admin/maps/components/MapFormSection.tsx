// File: app/admin/maps/components/MapFormSection.tsx
// Page/Component: MapFormSection
// Purpose: 맵을 직접 등록하거나 수정하는 폼 UI를 제공한다.

import { Dispatch, SetStateAction } from "react";
import type { CodeItem } from "@/lib/types/codes";
import type { MapFormData } from "@/lib/types/maps";
import AdminCard from "@/components/admin/AdminCard";
import AdminFormActions from "@/components/admin/AdminFormActions";
import AdminFormField from "@/components/admin/AdminFormField";
import AdminStatusRadio from "@/components/admin/AdminStatusRadio";

interface MapFormSectionProps {
  selectedMapId: string | null;
  form: MapFormData;
  setForm: Dispatch<SetStateAction<MapFormData>>;
  mapModes: CodeItem[];
  isModesLoading: boolean;
  isSaving: boolean;
  onSave: () => void;
  onNew: () => void;
  onOpenOverFastModal: () => void;
}

// 맵 편집 폼을 표시하고 저장 동작은 페이지 조율 컴포넌트에 위임한다.
export default function MapFormSection({
  selectedMapId,
  form,
  setForm,
  mapModes,
  isModesLoading,
  isSaving,
  onSave,
  onNew,
  onOpenOverFastModal,
}: MapFormSectionProps) {
  return (
    <div className="xl:col-span-5 h-full min-h-0 flex flex-col">
      <AdminCard
        title={selectedMapId ? "맵 정보 수정" : "새 맵 등록"}
        className="h-full"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenOverFastModal}
              disabled={isModesLoading}
              className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-300"
            >
              OverFast 목록 불러오기
            </button>
            <AdminFormActions
              onSave={onSave}
              onNew={onNew}
              isEditing={!!selectedMapId}
              saveDisabled={isSaving || isModesLoading}
              saveLabel={isSaving ? "저장 중..." : "저장"}
            />
          </div>
        }
      >
        <div className="space-y-4 overflow-y-auto pr-1.5 custom-scrollbar">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AdminFormField label="맵 이름 (한글)">
              <input
                value={form.nameKr}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    nameKr: event.target.value,
                  }))
                }
                placeholder="예: 왕의 길 (선택)"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-[#f99e1a] focus:outline-none dark:border-slate-700 dark:bg-slate-800"
              />
            </AdminFormField>
            <AdminFormField label="맵 이름 (영문)" required>
              <input
                value={form.nameEn}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    nameEn: event.target.value,
                  }))
                }
                placeholder="예: King's Row"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono focus:border-[#f99e1a] focus:outline-none dark:border-slate-700 dark:bg-slate-800"
              />
            </AdminFormField>
          </div>
          <AdminFormField
            label="맵 모드"
            required
            helperText="공통코드 MAP_MODE에 사용 가능한 맵 모드만 표시됩니다."
          >
            <select
              value={form.mode}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  mode: event.target.value,
                }))
              }
              disabled={isModesLoading}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-[#f99e1a] focus:outline-none disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="">맵 모드를 선택하세요</option>
              {mapModes.map((mode) => (
                <option key={mode.code} value={mode.code}>
                  {mode.name} ({mode.code})
                </option>
              ))}
            </select>
          </AdminFormField>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AdminFormField label="배경 지역">
              <input
                value={form.location}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    location: event.target.value,
                  }))
                }
                placeholder="예: London, United Kingdom"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-[#f99e1a] focus:outline-none dark:border-slate-700 dark:bg-slate-800"
              />
            </AdminFormField>
            <AdminFormField label="국가 코드">
              <input
                value={form.countryCode}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    countryCode: event.target.value.toUpperCase(),
                  }))
                }
                maxLength={8}
                placeholder="예: UK"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono focus:border-[#f99e1a] focus:outline-none dark:border-slate-700 dark:bg-slate-800"
              />
            </AdminFormField>
          </div>
          <AdminFormField label="맵 이미지 URL">
            <div className="flex gap-2">
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
              {form.imageUrl && (
                <img
                  src={form.imageUrl}
                  alt="맵 미리보기"
                  className="h-9 w-14 rounded object-cover border border-slate-200 dark:border-slate-700"
                />
              )}
            </div>
          </AdminFormField>
          <AdminStatusRadio
            label="공식 맵 풀 포함 여부"
            name="mapIsActive"
            value={form.isActive}
            onChange={(isActive) =>
              setForm((current) => ({ ...current, isActive }))
            }
            activeDescription="대회 맵 풀과 경기 일정 입력에서 사용할 수 있습니다."
            inactiveDescription="맵 마스터에는 보관되지만 현재 공식 대회 맵에서는 제외됩니다."
          />
          <AdminFormField label="설명 / 비고">
            <textarea
              rows={3}
              value={form.desc}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  desc: event.target.value,
                }))
              }
              placeholder="맵 운영 메모 또는 특이사항을 입력하세요."
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-[#f99e1a] focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            />
          </AdminFormField>
        </div>
      </AdminCard>
    </div>
  );
}
