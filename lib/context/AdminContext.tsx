// File: lib/context/AdminContext.tsx
// Page/Component: AdminProvider
// Purpose: 분리된 관리자 기능 Provider를 조합하고 토너먼트 호환 상태를 제공한다.
"use client";

import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { TournamentItem, TournamentParticipant } from "@/lib/types/admin";
import {
  AdminFeatureProviders,
  useAdminFeedback,
  useAdminStreamers,
} from "@/lib/context/AdminFeatureContexts";
import type { StreamerItem } from "@/lib/types/streamers";

interface AdminContextType {
  /** 수정 범위 밖 토너먼트 화면의 기존 소비를 위한 호환 데이터다. */
  members: StreamerItem[];
  showFeedback: (message: string) => void;
  tournaments: TournamentItem[];
  setTournaments: Dispatch<SetStateAction<TournamentItem[]>>;
  participants: TournamentParticipant[];
  setParticipants: Dispatch<SetStateAction<TournamentParticipant[]>>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

// 기존 useAdmin 소비자를 유지하면서 분리된 상태를 하나의 호환 인터페이스로 제공한다.
function AdminTournamentProvider({ children }: { children: ReactNode }) {
  const { items: members } = useAdminStreamers();
  const { showFeedback } = useAdminFeedback();
  const [tournaments, setTournaments] = useState<TournamentItem[]>([]);
  const [participants, setParticipants] = useState<TournamentParticipant[]>([]);
  return (
    <AdminContext.Provider
      value={{
        members,
        showFeedback,
        tournaments,
        setTournaments,
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
      <AdminTournamentProvider>{children}</AdminTournamentProvider>
    </AdminFeatureProviders>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context)
    throw new Error("useAdmin must be used within an AdminProvider");
  return context;
}
