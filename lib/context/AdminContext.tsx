// File: lib/context/AdminContext.tsx
// Page/Component: AdminProvider
// Purpose: 분리된 관리자 기능 Provider를 조합하고 토너먼트 호환 상태를 제공한다.
"use client";

import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { TournamentItem, TournamentParticipant } from "@/lib/types/admin";
import { AdminCodesProvider, AdminFeedbackProvider, AdminHeroesProvider, AdminMapsProvider, AdminMembersProvider, AdminUiProvider, useAdminCodes, useAdminFeedback, useAdminHeroes, useAdminMaps, useAdminMembers, useAdminUi } from "@/lib/context/AdminFeatureContexts";

interface AdminContextType {
  members: ReturnType<typeof useAdminMembers>["items"];
  setMembers: ReturnType<typeof useAdminMembers>["setItems"];
  refreshMembers: ReturnType<typeof useAdminMembers>["refresh"];
  isMembersLoading: boolean;
  maps: ReturnType<typeof useAdminMaps>["items"];
  setMaps: ReturnType<typeof useAdminMaps>["setItems"];
  refreshMaps: ReturnType<typeof useAdminMaps>["refresh"];
  isMapsLoading: boolean;
  heroes: ReturnType<typeof useAdminHeroes>["items"];
  setHeroes: ReturnType<typeof useAdminHeroes>["setItems"];
  refreshHeroes: ReturnType<typeof useAdminHeroes>["refresh"];
  isHeroesLoading: boolean;
  codeGroups: ReturnType<typeof useAdminCodes>["items"];
  setCodeGroups: ReturnType<typeof useAdminCodes>["setItems"];
  refreshCodes: ReturnType<typeof useAdminCodes>["refresh"];
  isCodesLoading: boolean;
  toastMessage: string | null;
  showFeedback: (message: string) => void;
  menuSearchQuery: string;
  setMenuSearchQuery: (query: string) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  tournaments: TournamentItem[];
  setTournaments: Dispatch<SetStateAction<TournamentItem[]>>;
  participants: TournamentParticipant[];
  setParticipants: Dispatch<SetStateAction<TournamentParticipant[]>>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

// 기존 useAdmin 소비자를 유지하면서 분리된 상태를 하나의 호환 인터페이스로 제공한다.
function AdminCompatibilityProvider({ children }: { children: ReactNode }) {
  const memberState = useAdminMembers();
  const mapState = useAdminMaps();
  const heroState = useAdminHeroes();
  const codeState = useAdminCodes();
  const feedback = useAdminFeedback();
  const ui = useAdminUi();
  const [tournaments, setTournaments] = useState<TournamentItem[]>([]);
  const [participants, setParticipants] = useState<TournamentParticipant[]>([]);
  return <AdminContext.Provider value={{ members: memberState.items, setMembers: memberState.setItems, refreshMembers: memberState.refresh, isMembersLoading: memberState.isLoading, maps: mapState.items, setMaps: mapState.setItems, refreshMaps: mapState.refresh, isMapsLoading: mapState.isLoading, heroes: heroState.items, setHeroes: heroState.setItems, refreshHeroes: heroState.refresh, isHeroesLoading: heroState.isLoading, codeGroups: codeState.items, setCodeGroups: codeState.setItems, refreshCodes: codeState.refresh, isCodesLoading: codeState.isLoading, ...feedback, ...ui, tournaments, setTournaments, participants, setParticipants }}>{children}</AdminContext.Provider>;
}

// 관리자 기능별 Provider를 조합해 기존 레이아웃의 진입점을 유지한다.
export function AdminProvider({ children }: { children: ReactNode }) {
  return <AdminFeedbackProvider><AdminUiProvider><AdminMembersProvider><AdminMapsProvider><AdminHeroesProvider><AdminCodesProvider><AdminCompatibilityProvider>{children}</AdminCompatibilityProvider></AdminCodesProvider></AdminHeroesProvider></AdminMapsProvider></AdminMembersProvider></AdminUiProvider></AdminFeedbackProvider>;
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) throw new Error("useAdmin must be used within an AdminProvider");
  return context;
}
