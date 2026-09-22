// File: app/admin/streamers/components/StreamerFormSection.tsx
// Page/Component: StreamerFormSection
// Purpose: 스트리머 정보를 직접 입력하거나 채널 연동으로 편집하는 관리 영역이다.
"use client";

import React from "react";
import AdminCard from "@/components/admin/AdminCard";
import AdminFormActions from "@/components/admin/AdminFormActions";
import AdminAvatar from "@/components/admin/AdminAvatar";
import AdminFormField from "@/components/admin/AdminFormField";
import AdminStatusRadio from "@/components/admin/AdminStatusRadio";
import type { StreamerFormData } from "@/lib/types/streamers";

interface StreamerFormSectionProps {
  selectedStreamerId: string | null;
  form: StreamerFormData;
  setForm: React.Dispatch<React.SetStateAction<StreamerFormData>>;
  onSave: () => void;
  onNew: () => void;
  onOpenStreamerModal: () => void;
  isSaving: boolean;
}

// 선택한 스트리머의 입력값을 편집하고 저장 또는 신규 등록 동작을 연결한다.
export default function StreamerFormSection({
  selectedStreamerId,
  form,
  setForm,
  onSave,
  onNew,
  onOpenStreamerModal,
  isSaving,
}: StreamerFormSectionProps) {
  const isChzzkType = form.isChzzk;

  return (
    <div className="xl:col-span-5 h-full min-h-0 flex flex-col">
      <AdminCard
        title={selectedStreamerId ? "스트리머 정보 수정" : "스트리머 신규 등록"}
        className="h-full"
        actions={
          <AdminFormActions
            onSave={onSave}
            onNew={onNew}
            isEditing={!!selectedStreamerId}
            saveDisabled={isSaving}
            saveLabel={isSaving ? "저장중..." : "저장"}
          />
        }
      >
        <div className="space-y-4 max-w-xl">
          {/* 1. 등록 및 연동 방식 */}
          <AdminFormField label="등록 및 연동 방식">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setForm((p) => ({
                    ...p,
                    isChzzk: true,
                  }))
                }
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isChzzkType
                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold shadow-2xs"
                    : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    isChzzkType ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                  }`}
                />
                <span>치지직 연동 등록</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setForm((p) => ({
                    ...p,
                    isChzzk: false,
                    channelUrl: "",
                  }))
                }
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  !isChzzkType
                    ? "bg-[#f99e1a]/10 border-[#f99e1a] text-[#f99e1a] font-bold shadow-2xs"
                    : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    !isChzzkType ? "bg-[#f99e1a]" : "bg-slate-300 dark:bg-slate-600"
                  }`}
                />
                <span>일반 직접 등록</span>
              </button>
            </div>
          </AdminFormField>

          {/* 2. 치지직 채널 연동 (치지직 타입일 때만) */}
          {isChzzkType && (
            <AdminFormField
              label="치지직 채널 연동"
              required
              helperText="직접 입력할 수 없으며, 반드시 [스트리머 조회] 버튼을 통해 검색된 스트리머만 등록됩니다."
            >
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    readOnly
                    onClick={onOpenStreamerModal}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 cursor-pointer font-mono select-none"
                    placeholder="우측 [스트리머 조회] 버튼을 눌러 연동하세요"
                    value={form.channelUrl}
                    title="치지직 채널 주소는 직접 입력할 수 없으며, 스트리머 조회를 통해 연동됩니다. 클릭하면 검색창이 열립니다."
                  />
                </div>
                <button
                  type="button"
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white transition-all shrink-0 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  onClick={onOpenStreamerModal}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <span>{form.channelUrl ? "스트리머 재조회" : "스트리머 조회"}</span>
                </button>
              </div>
            </AdminFormField>
          )}

          {/* 3. 이름 / 표시명 */}
          <AdminFormField
            label={isChzzkType ? "표시 이름" : "이름"}
            required
            helperText={
              isChzzkType && !form.channelUrl
                ? "💡 [스트리머 조회]로 선택 시 채널명이 자동 입력되며, 이후 대회용 표시 이름으로 자유롭게 수정할 수 있습니다."
                : undefined
            }
          >
            <input
              type="text"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f99e1a]/20 focus:border-[#f99e1a] transition-all"
              placeholder={
                isChzzkType
                  ? form.channelUrl
                    ? "치지직 채널명 (수정 가능)"
                    : "[스트리머 조회] 시 자동 입력됩니다"
                  : "선수 또는 스트리머 이름을 입력하세요"
              }
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
          </AdminFormField>

          {/* 4. 프로필 이미지 URL */}
          <AdminFormField label="프로필 이미지 URL">
            <div className="flex items-center gap-2.5">
              <input
                type="text"
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f99e1a]/20 focus:border-[#f99e1a] transition-all font-mono"
                placeholder="치지직 조회 시 자동 연동되거나 직접 이미지 URL 입력"
                value={form.profileImg}
                onChange={(e) => setForm((p) => ({ ...p, profileImg: e.target.value }))}
              />
              {form.profileImg && (
                <div className="shrink-0" title="프로필 이미지 미리보기">
                  <AdminAvatar name={form.name || "미리보기"} profileImg={form.profileImg} />
                </div>
              )}
            </div>
          </AdminFormField>

          {/* 5. 메모 및 특이사항 */}
          <AdminFormField label="메모 / 주 포지션 및 특이사항">
            <textarea
              rows={4}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f99e1a]/20 focus:border-[#f99e1a] transition-all resize-none"
              placeholder="스트리머의 주 포지션(탱커/딜러/힐러), 모스트 영웅, 티어 또는 특이사항을 기록하세요."
              value={form.memo}
              onChange={(e) => setForm((p) => ({ ...p, memo: e.target.value }))}
            />
          </AdminFormField>

          {/* 6. 사용 여부 (공통 AdminStatusRadio 적용) */}
          <AdminStatusRadio
            label="사용 여부"
            name="streamerIsUse"
            value={form.isUse}
            onChange={(nextVal) => setForm((p) => ({ ...p, isUse: nextVal }))}
            inactiveDescription="미사용 스트리머는 신규 대회 팀 배정 시 추천에서 제외되며, 과거 대회 전적 및 경기 기록은 안전하게 보존됩니다."
          />
        </div>
      </AdminCard>
    </div>
  );
}
