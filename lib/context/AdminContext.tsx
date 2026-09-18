// lib/context/AdminContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { MemberItem, TournamentItem, MapItem, CodeGroupItem, TournamentParticipant } from "@/lib/types/admin";
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

export function AdminProvider({ children }: { children: ReactNode }) {
  const [members, setMembers] = useState<MemberItem[]>(initialMembers);
  const [tournaments, setTournaments] = useState<TournamentItem[]>(initialTournaments);
  const [participants, setParticipants] = useState<TournamentParticipant[]>(initialParticipants);
  const [maps, setMaps] = useState<MapItem[]>(initialMaps);
  const [codeGroups, setCodeGroups] = useState<CodeGroupItem[]>(initialCodeGroups);

  const [isMembersLoading, setIsMembersLoading] = useState<boolean>(true);
  const [isCodesLoading, setIsCodesLoading] = useState<boolean>(true);

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

  useEffect(() => {
    refreshMembers();
    refreshCodes();
  }, []);

  // 마운트 시 현재 <html> 태그의 dark 클래스 상태 동기화
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setIsDarkMode(isDark);
  }, []);

  const showFeedback = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

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

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
