// File: app/admin/streamers/page.tsx
// Page/Component: AdminStreamersPage
// Purpose: 스트리머 목록과 등록·수정, Chzzk 채널 연동을 제공한다.
"use client";

import { useMemo, useState } from "react";
import {
  useAdminFeedback,
  useAdminStreamers,
} from "@/lib/context/AdminFeatureContexts";
import { useAdminMutation } from "@/lib/hooks/useAdminMutation";
import { CHZZK_BASE_URL, getChzzkChannelUrl } from "@/lib/streamers/chzzk";
import { saveStreamer } from "@/lib/streamers/streamerClient";
import type {
  ChzzkChannelCandidate,
  StreamerFormData,
  StreamerItem,
} from "@/lib/types/streamers";
import ChzzkSearchModal from "./components/ChzzkSearchModal";
import StreamerFormSection from "./components/StreamerFormSection";
import StreamerListSection from "./components/StreamerListSection";

const INITIAL_STREAMER_FORM: StreamerFormData = {
  isChzzk: true,
  channelUrl: "",
  name: "",
  profileImg: "",
  memo: "",
  isUse: true,
};

// 스트리머 목록과 폼, Chzzk 후보 선택 상태를 조율한다.
export default function AdminStreamersPage() {
  const {
    items: streamers,
    setItems: setStreamers,
    isLoading: isStreamersLoading,
  } = useAdminStreamers();
  const { showFeedback } = useAdminFeedback();
  const { execute: mutateStreamer, isPending: isSaving } = useAdminMutation();
  const [selectedStreamerId, setSelectedStreamerId] = useState<string | null>(
    null,
  );
  const [streamerForm, setStreamerForm] = useState<StreamerFormData>(
    INITIAL_STREAMER_FORM,
  );
  const [isChzzkModalOpen, setIsChzzkModalOpen] = useState(false);
  const registeredByChannelId = useMemo(
    () =>
      new Map(
        streamers
          .filter((streamer) => streamer.channelId)
          .map((streamer) => [streamer.channelId as string, streamer]),
      ),
    [streamers],
  );
  const handleSelectStreamer = (streamer: StreamerItem) => {
    setSelectedStreamerId(streamer.id);
    setStreamerForm({
      isChzzk: Boolean(streamer.channelId),
      channelUrl: getChzzkChannelUrl(streamer.channelId),
      name: streamer.name,
      profileImg: streamer.profileImg || "",
      memo: streamer.memo || "",
      isUse: streamer.isUse !== false,
    });
  };
  const handleNewStreamer = () => {
    setSelectedStreamerId(null);
    setStreamerForm(INITIAL_STREAMER_FORM);
    showFeedback("신규 스트리머 등록 모드로 전환되었습니다.");
  };
  const handleSelectChzzkCandidate = (candidate: ChzzkChannelCandidate) => {
    setStreamerForm((current) => ({
      ...current,
      isChzzk: true,
      channelUrl: `${CHZZK_BASE_URL}/${candidate.channelId}`,
      name: candidate.channelName,
      profileImg: candidate.channelImageUrl || current.profileImg,
      memo: current.memo || candidate.channelDescription || "",
    }));
    setIsChzzkModalOpen(false);
    showFeedback(`치지직 [${candidate.channelName}] 채널이 연동되었습니다.`);
  };
  const handleSaveStreamer = async () => {
    if (!streamerForm.name.trim()) {
      showFeedback("이름 또는 채널명을 입력해주세요.");
      return;
    }
    if (streamerForm.isChzzk && !streamerForm.channelUrl.trim()) {
      showFeedback(
        "[스트리머 조회] 버튼을 통해 연동할 스트리머를 검색 후 선택해주세요.",
      );
      return;
    }
    await mutateStreamer(
      () =>
        saveStreamer(
          {
            ...streamerForm,
            channelUrl: streamerForm.isChzzk ? streamerForm.channelUrl : "",
          },
          selectedStreamerId,
        ),
      {
        successMessage: `[${streamerForm.name}] 스트리머 정보가 DB에 저장되었습니다.`,
        errorMessage: "저장에 실패했습니다.",
        onSuccess: (saved?: StreamerItem) => {
          if (!saved) return;
          setStreamers((current) =>
            current.some((streamer) => streamer.id === saved.id)
              ? current.map((streamer) =>
                  streamer.id === saved.id ? saved : streamer,
                )
              : [saved, ...current],
          );
          setSelectedStreamerId(saved.id);
        },
      },
    );
  };
  return (
    <section className="h-full min-h-0 flex flex-col">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full min-h-0 flex-1">
        <StreamerListSection
          streamers={streamers}
          selectedStreamerId={selectedStreamerId}
          onSelectStreamer={handleSelectStreamer}
          isLoading={isStreamersLoading}
        />
        <StreamerFormSection
          selectedStreamerId={selectedStreamerId}
          form={streamerForm}
          setForm={setStreamerForm}
          onSave={handleSaveStreamer}
          onNew={handleNewStreamer}
          onOpenStreamerModal={() => setIsChzzkModalOpen(true)}
          isSaving={isSaving}
        />
      </div>
      <ChzzkSearchModal
        isOpen={isChzzkModalOpen}
        onClose={() => setIsChzzkModalOpen(false)}
        onSelect={handleSelectChzzkCandidate}
        registeredByChannelId={registeredByChannelId}
        selectedStreamerId={selectedStreamerId}
        showFeedback={showFeedback}
      />
    </section>
  );
}
