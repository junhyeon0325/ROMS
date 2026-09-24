// File: app/admin/streamers/hooks/useStreamerManagement.ts
// Page/Component: useStreamerManagement
// Purpose: 스트리머 관리 화면의 선택, 저장 및 Chzzk 연동 상태를 조율한다.
"use client";

import { useMemo, useState } from "react";
import { useAdminFeedback, useAdminStreamers } from "@/lib/context/AdminFeatureContexts";
import { useAdminMutation } from "@/lib/hooks/useAdminMutation";
import { CHZZK_BASE_URL, getChzzkChannelUrl } from "@/lib/streamers/chzzk";
import { saveStreamer } from "@/lib/streamers/streamerClient";
import type { ChzzkChannelCandidate, StreamerFormData, StreamerItem } from "@/lib/types/streamers";

const INITIAL_STREAMER_FORM: StreamerFormData = { isChzzk: true, channelUrl: "", name: "", profileImg: "", memo: "", isUse: true };

// 스트리머 관리에 필요한 데이터와 사용자 동작을 화면에 제공한다.
export function useStreamerManagement() {
  const { items: streamers, setItems: setStreamers, isLoading: isStreamersLoading } = useAdminStreamers();
  const { showFeedback } = useAdminFeedback();
  const { execute: mutateStreamer, isPending: isSaving } = useAdminMutation();
  const [selectedStreamerId, setSelectedStreamerId] = useState<string | null>(null);
  const [form, setForm] = useState<StreamerFormData>(INITIAL_STREAMER_FORM);
  const [isChzzkModalOpen, setIsChzzkModalOpen] = useState(false);
  const registeredByChannelId = useMemo(() => new Map(streamers.filter((streamer) => streamer.channelId).map((streamer) => [streamer.channelId as string, streamer])), [streamers]);
  const handleSelectStreamer = (streamer: StreamerItem) => { setSelectedStreamerId(streamer.id); setForm({ isChzzk: Boolean(streamer.channelId), channelUrl: getChzzkChannelUrl(streamer.channelId), name: streamer.name, profileImg: streamer.profileImg || "", memo: streamer.memo || "", isUse: streamer.isUse !== false }); };
  const handleNewStreamer = () => { setSelectedStreamerId(null); setForm(INITIAL_STREAMER_FORM); showFeedback("신규 스트리머 등록 모드로 전환했습니다."); };
  // 입력값을 검증하고 DB 저장 결과를 관리 목록에 반영한다.
  const persistStreamer = async (nextForm: StreamerFormData, id: string | null) => {
    if (!nextForm.name.trim()) { showFeedback("이름 또는 채널명을 입력해 주세요."); return false; }
    if (nextForm.isChzzk && !nextForm.channelUrl.trim()) { showFeedback("[스트리머 조회] 버튼을 통해 연동할 스트리머를 검색하고 선택해 주세요."); return false; }
    let savedSuccessfully = false;
    await mutateStreamer(() => saveStreamer({ ...nextForm, channelUrl: nextForm.isChzzk ? nextForm.channelUrl : "" }, id), { successMessage: `[${nextForm.name}] 스트리머 정보가 DB에 저장되었습니다.`, errorMessage: "저장에 실패했습니다.", onSuccess: (saved?: StreamerItem) => { if (!saved) return; setStreamers((current) => current.some((streamer) => streamer.id === saved.id) ? current.map((streamer) => streamer.id === saved.id ? saved : streamer) : [saved, ...current]); setSelectedStreamerId(saved.id); setForm({ isChzzk: Boolean(saved.channelId), channelUrl: getChzzkChannelUrl(saved.channelId), name: saved.name, profileImg: saved.profileImg || "", memo: saved.memo || "", isUse: saved.isUse !== false }); savedSuccessfully = true; } });
    return savedSuccessfully;
  };
  // 치지직 검색 결과를 기존 선택 상태에 반영하고 곧바로 DB에 저장한다.
  const handleSelectChzzkCandidate = async (candidate: ChzzkChannelCandidate) => {
    const nextForm = { ...form, isChzzk: true, channelUrl: `${CHZZK_BASE_URL}/${candidate.channelId}`, name: candidate.channelName, profileImg: candidate.channelImageUrl || form.profileImg, memo: form.memo || candidate.channelDescription || "" };
    setForm(nextForm);
    if (await persistStreamer(nextForm, selectedStreamerId)) {
      setSelectedStreamerId(null);
      setForm(INITIAL_STREAMER_FORM);
      setIsChzzkModalOpen(false);
      showFeedback(`[${candidate.channelName}] 저장 후 신규 스트리머 등록 화면으로 전환했습니다.`);
    }
  };
  const handleSaveStreamer = async () => { await persistStreamer(form, selectedStreamerId); };
  return { form, handleNewStreamer, handleSaveStreamer, handleSelectChzzkCandidate, handleSelectStreamer, isChzzkModalOpen, isSaving, isStreamersLoading, registeredByChannelId, selectedStreamerId, setForm, setIsChzzkModalOpen, showFeedback, streamers };
}
