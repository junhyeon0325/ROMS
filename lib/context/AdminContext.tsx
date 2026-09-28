// File: lib/context/AdminContext.tsx
// Page/Component: AdminProvider
// Purpose: 분리된 관리자 기능 Provider를 조합하고 시즌 등록 상태를 제공한다.
"use client";

import { createContext, useContext, useEffect, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { usePathname } from "next/navigation";
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
  seasonsStatus: "loading" | "ready" | "error";
  reloadSeasons: () => void;
  setSeasons: Dispatch<SetStateAction<SeasonItem[]>>;
  participants: SeasonParticipant[];
  setParticipants: Dispatch<SetStateAction<SeasonParticipant[]>>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

// 기존 useAdmin 소비자를 유지하면서 분리된 상태를 하나의 호환 인터페이스로 제공한다.
function AdminSeasonProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { items: members } = useAdminStreamers();
  const { showFeedback } = useAdminFeedback();
  const [seasons, setSeasons] = useState<SeasonItem[]>([]);
  const [seasonsStatus, setSeasonsStatus] = useState<"loading" | "ready" | "error">("loading");
  const [reloadToken, setReloadToken] = useState(0);
  const [participants, setParticipants] = useState<SeasonParticipant[]>([]);
  const seasonsLoaded = useRef(false);
  const seasonRequestRunning = useRef(false);
  // 조회 실패 후 다시 시도할 때 같은 경로에서도 목록 요청을 재시작한다.
  const reloadSeasons = () => { if (!seasonRequestRunning.current) setReloadToken((current) => current + 1); };
  // 대회 데이터가 필요한 메뉴에 처음 들어갈 때만 목록을 요청하고 메뉴 전환에는 캐시를 사용한다.
  useEffect(() => {
    if (seasonsLoaded.current || seasonRequestRunning.current || (pathname !== "/admin" && !pathname.startsWith("/admin/seasons"))) return;
    seasonRequestRunning.current = true;
    setSeasonsStatus("loading");
    fetchSeasons().then((result) => {
      if (result.success && result.data) { setSeasons(result.data); seasonsLoaded.current = true; setSeasonsStatus("ready"); }
      else { setSeasonsStatus("error"); showFeedback(result.message || "대회 목록을 불러오지 못했습니다."); }
    }).catch(() => { setSeasonsStatus("error"); showFeedback("대회 목록을 불러오지 못했습니다."); }).finally(() => { seasonRequestRunning.current = false; });
  }, [pathname, reloadToken, showFeedback]);
  return (
    <AdminContext.Provider
      value={{
        members,
        showFeedback,
        seasons,
        seasonsStatus,
        reloadSeasons,
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
