// File: app/admin/streamers/page.tsx
// Page/Component: AdminStreamersPage
// Purpose: 스트리머 관리 UI와 useStreamerManagement의 상태·동작을 연결한다.
"use client";

import ChzzkSearchModal from "./components/ChzzkSearchModal";
import StreamerFormSection from "./components/StreamerFormSection";
import StreamerListSection from "./components/StreamerListSection";
import { useStreamerManagement } from "./hooks/useStreamerManagement";

// 스트리머 관리 화면의 표시 컴포넌트에 전용 훅의 값과 동작을 전달한다.
export default function AdminStreamersPage() {
  const streamerManagement = useStreamerManagement();
  return (
    <section className="h-full min-h-0 flex flex-col">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full min-h-0 flex-1">
        <StreamerListSection streamers={streamerManagement.streamers} selectedStreamerId={streamerManagement.selectedStreamerId} onSelectStreamer={streamerManagement.handleSelectStreamer} isLoading={streamerManagement.isStreamersLoading} />
        <StreamerFormSection selectedStreamerId={streamerManagement.selectedStreamerId} form={streamerManagement.form} setForm={streamerManagement.setForm} onSave={streamerManagement.handleSaveStreamer} onNew={streamerManagement.handleNewStreamer} onOpenStreamerModal={() => streamerManagement.setIsChzzkModalOpen(true)} isSaving={streamerManagement.isSaving} />
      </div>
      <ChzzkSearchModal isOpen={streamerManagement.isChzzkModalOpen} onClose={() => streamerManagement.setIsChzzkModalOpen(false)} onSelect={streamerManagement.handleSelectChzzkCandidate} registeredByChannelId={streamerManagement.registeredByChannelId} selectedStreamerId={streamerManagement.selectedStreamerId} showFeedback={streamerManagement.showFeedback} />
    </section>
  );
}
