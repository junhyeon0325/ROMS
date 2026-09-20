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
  const handleSelectChzzkCandidate = (candidate: ChzzkChannelCandidate) => { setForm((current) => ({ ...current, isChzzk: true, channelUrl: `${CHZZK_BASE_URL}/${candidate.channelId}`, name: candidate.channelName, profileImg: candidate.channelImageUrl || current.profileImg, memo: current.memo || candidate.channelDescription || "" })); setIsChzzkModalOpen(false); showFeedback(`치지직 [${candidate.channelName}] 채널을 연동했습니다.`); };
  const handleSaveStreamer = async () => {
    if (!form.name.trim()) { showFeedback("이름 또는 채널명을 입력해 주세요."); return; }
    if (form.isChzzk && !form.channelUrl.trim()) { showFeedback("[스트리머 조회] 버튼을 통해 연동할 스트리머를 검색하고 선택해 주세요."); return; }
    await mutateStreamer(() => saveStreamer({ ...form, channelUrl: form.isChzzk ? form.channelUrl : "" }, selectedStreamerId), { successMessage: `[${form.name}] 스트리머 정보가 DB에 저장되었습니다.`, errorMessage: "저장에 실패했습니다.", onSuccess: (saved?: StreamerItem) => { if (!saved) return; setStreamers((current) => current.some((streamer) => streamer.id === saved.id) ? current.map((streamer) => streamer.id === saved.id ? saved : streamer) : [saved, ...current]); setSelectedStreamerId(saved.id); } });
  };
  return { form, handleNewStreamer, handleSaveStreamer, handleSelectChzzkCandidate, handleSelectStreamer, isChzzkModalOpen, isSaving, isStreamersLoading, registeredByChannelId, selectedStreamerId, setForm, setIsChzzkModalOpen, showFeedback, streamers };
}
