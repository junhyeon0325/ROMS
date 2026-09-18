// 관리자 화면 여러 곳에서 함께 사용하는 데이터·UI 상태와 상태 변경 함수를 제공하는 Context 파일이다.
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { MemberItem, TournamentItem, MapItem, HeroItem, CodeGroupItem, TournamentParticipant } from "@/lib/types/admin";
import {
  initialMembers,
  initialTournaments,
  initialParticipants,
  initialMaps,
  initialCodeGroups,
} from "@/lib/mock/adminData";

interface AdminContextType {
  members: MemberItem[];
  setMembers: React.Dispatch<React.SetStateAction<MemberItem[]>>;
  refreshMembers: () => Promise<void>;
  isMembersLoading: boolean;
  tournaments: TournamentItem[];
  setTournaments: React.Dispatch<React.SetStateAction<TournamentItem[]>>;
  participants: TournamentParticipant[];
  setParticipants: React.Dispatch<React.SetStateAction<TournamentParticipant[]>>;
  maps: MapItem[];
  setMaps: React.Dispatch<React.SetStateAction<MapItem[]>>;
  refreshMaps: () => Promise<void>;
  isMapsLoading: boolean;
  heroes: HeroItem[];
  setHeroes: React.Dispatch<React.SetStateAction<HeroItem[]>>;
  refreshHeroes: () => Promise<void>;
  isHeroesLoading: boolean;
  codeGroups: CodeGroupItem[];
  setCodeGroups: React.Dispatch<React.SetStateAction<CodeGroupItem[]>>;
  refreshCodes: () => Promise<void>;
  isCodesLoading: boolean;
  toastMessage: string | null;
  showFeedback: (msg: string) => void;
  menuSearchQuery: string;
  setMenuSearchQuery: (query: string) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

// 관리자 하위 화면이 공통 상태와 데이터 새로고침 함수를 사용할 수 있도록 Provider를 구성한다.
export function AdminProvider({ children }: { children: ReactNode }) {
  const [members, setMembers] = useState<MemberItem[]>(initialMembers);
  const [tournaments, setTournaments] = useState<TournamentItem[]>(initialTournaments);
  const [participants, setParticipants] = useState<TournamentParticipant[]>(initialParticipants);
  const [maps, setMaps] = useState<MapItem[]>(initialMaps);
  const [heroes, setHeroes] = useState<HeroItem[]>([]);
  const [codeGroups, setCodeGroups] = useState<CodeGroupItem[]>(initialCodeGroups);

  const [isMembersLoading, setIsMembersLoading] = useState<boolean>(true);
  const [isCodesLoading, setIsCodesLoading] = useState<boolean>(true);
  const [isMapsLoading, setIsMapsLoading] = useState<boolean>(true);
  const [isHeroesLoading, setIsHeroesLoading] = useState<boolean>(true);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [menuSearchQuery, setMenuSearchQuery] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);

  // DB에서 스트리머 목록 실시간 동기화
  const refreshMembers = async () => {
    try {
      setIsMembersLoading(true);
      const res = await fetch("/api/streamers");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setMembers(json.data);
      }
    } catch (e) {
      console.error("Failed to load streamers from DB:", e);
    } finally {
      setIsMembersLoading(false);
    }
  };

  // DB에서 공통코드 그룹 실시간 동기화 (세부코드는 온디맨드 조회)
  const refreshCodes = async () => {
    try {
      setIsCodesLoading(true);
      const groupsRes = await fetch("/api/codes/groups");
      const groupsJson = await groupsRes.json();

      if (groupsJson.success && Array.isArray(groupsJson.data)) {
        setCodeGroups(groupsJson.data);
      }
    } catch (e) {
      console.error("Failed to load code groups from DB:", e);
    } finally {
      setIsCodesLoading(false);
    }
  };

  const refreshMaps = async () => {
    try {
      setIsMapsLoading(true);
      const res = await fetch("/api/maps");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) setMaps(json.data);
    } catch (e) {
      console.error("Failed to load maps from DB:", e);
    } finally {
      setIsMapsLoading(false);
    }
  };

  // DB에서 영웅 마스터 목록을 불러와 관리 화면의 최신 상태를 유지한다.
  const refreshHeroes = async () => {
    try {
      setIsHeroesLoading(true);
      const res = await fetch("/api/heroes");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) setHeroes(json.data);
    } catch (e) {
      console.error("Failed to load heroes from DB:", e);
    } finally {
      setIsHeroesLoading(false);
    }
  };

  useEffect(() => {
    refreshMembers();
    refreshCodes();
    refreshMaps();
    refreshHeroes();
  }, []);

  // 마운트 시 현재 <html> 태그의 dark 클래스 상태 동기화
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setIsDarkMode(isDark);
  }, []);

  // 동일한 함수 참조를 유지해 이를 의존하는 화면의 데이터 조회 효과가 불필요하게 재실행되지 않게 한다.
  const showFeedback = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (typeof document !== "undefined") {
        if (next) {
          document.documentElement.classList.add("dark");
          try {
            localStorage.setItem("roms_theme", "dark");
          } catch (e) {}
        } else {
          document.documentElement.classList.remove("dark");
          try {
            localStorage.setItem("roms_theme", "light");
          } catch (e) {}
        }
      }
      showFeedback(next ? "다크 모드가 활성화되었습니다." : "라이트 모드로 전환되었습니다.");
      return next;
    });
  };

  return (
    <AdminContext.Provider
      value={{
        members,
        setMembers,
        refreshMembers,
        isMembersLoading,
        tournaments,
        setTournaments,
        participants,
        setParticipants,
        maps,
        setMaps,
        refreshMaps,
        isMapsLoading,
        heroes,
        setHeroes,
        refreshHeroes,
        isHeroesLoading,
        codeGroups,
        setCodeGroups,
        refreshCodes,
        isCodesLoading,
        toastMessage,
        showFeedback,
        menuSearchQuery,
        setMenuSearchQuery,
        isDarkMode,
        toggleDarkMode,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

// Provider 내부 컴포넌트가 관리자 공통 상태에 안전하게 접근하도록 한다.
export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
