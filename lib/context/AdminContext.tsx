// File: lib/context/AdminContext.tsx
// Page/Component: AdminProvider
// Purpose: 분리된 관리자 기능 Provider를 조합하고 시즌 등록 상태를 제공한다.
"use client";

import { createContext, useContext, useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { fetchSeasons } from "@/lib/seasons/seasonClient";
import type { SeasonItem, SeasonParticipant } from "@/lib/types/admin";
import {
  AdminFeatureProviders,
  useAdminFeedback,
  useAdminStreamers,
} from "@/lib/context/AdminFeatureContexts";
import type { StreamerItem } from "@/lib/types/streamers";

interface AdminContextType {
  /** 관리자 화면에서 사용하는 스트리머 데이터를 제공한다. */
  members: StreamerItem[];
  showFeedback: (message: string) => void;
  seasons: SeasonItem[];
  setSeasons: Dispatch<SetStateAction<SeasonItem[]>>;
  participants: SeasonParticipant[];
  setParticipants: Dispatch<SetStateAction<SeasonParticipant[]>>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

// 기존 useAdmin 소비자를 유지하면서 분리된 상태를 하나의 호환 인터페이스로 제공한다.
function AdminSeasonProvider({ children }: { children: ReactNode }) {
  const { items: members } = useAdminStreamers();
  const { showFeedback } = useAdminFeedback();
  const [seasons, setSeasons] = useState<SeasonItem[]>([]);
  const [participants, setParticipants] = useState<SeasonParticipant[]>([]);
  // 관리자 화면들이 공유하는 대회 목록을 서버에서 한 번 불러온다.
  useEffect(() => {
    let active = true;
    fetchSeasons().then((result) => {
      if (active && result.success && result.data) setSeasons(result.data);
      else if (active) showFeedback(result.message || "대회 목록을 불러오지 못했습니다.");
    }).catch(() => { if (active) showFeedback("대회 목록을 불러오지 못했습니다."); });
    return () => { active = false; };
  }, [showFeedback]);
  return (
    <AdminContext.Provider
      value={{
        members,
        showFeedback,
        seasons,
        setSeasons,
        participants,
        setParticipants,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

// 관리자 기능별 Provider를 조합해 기존 레이아웃의 진입점을 유지한다.
export function AdminProvider({ children }: { children: ReactNode }) {
  return (
    <AdminFeatureProviders>
      <AdminSeasonProvider>{children}</AdminSeasonProvider>
    </AdminFeatureProviders>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context)
    throw new Error("useAdmin must be used within an AdminProvider");
  return context;
}
