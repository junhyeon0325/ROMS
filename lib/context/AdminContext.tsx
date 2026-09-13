// lib/context/AdminContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { MemberItem, TournamentItem, MapItem, CodeGroupItem, CodeItem, TournamentParticipant } from "@/lib/types/admin";
import {
  initialMembers,
  initialTournaments,
  initialParticipants,
  initialMaps,
  initialCodeGroups,
  initialCodes,
} from "@/lib/mock/adminData";

interface AdminContextType {
  members: MemberItem[];
  setMembers: React.Dispatch<React.SetStateAction<MemberItem[]>>;
  refreshMembers: () => Promise<void>;
  tournaments: TournamentItem[];
  setTournaments: React.Dispatch<React.SetStateAction<TournamentItem[]>>;
  participants: TournamentParticipant[];
  setParticipants: React.Dispatch<React.SetStateAction<TournamentParticipant[]>>;
  maps: MapItem[];
  setMaps: React.Dispatch<React.SetStateAction<MapItem[]>>;
  codeGroups: CodeGroupItem[];
  setCodeGroups: React.Dispatch<React.SetStateAction<CodeGroupItem[]>>;
  codes: CodeItem[];
  setCodes: React.Dispatch<React.SetStateAction<CodeItem[]>>;
  refreshCodes: () => Promise<void>;
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
  const [codes, setCodes] = useState<CodeItem[]>(initialCodes);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [menuSearchQuery, setMenuSearchQuery] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);

  // DB에서 스트리머 목록 실시간 동기화
  const refreshMembers = async () => {
    try {
      const res = await fetch("/api/streamers");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setMembers(json.data);
      }
    } catch (e) {
      console.error("Failed to load streamers from DB:", e);
    }
  };

  // DB에서 공통코드 그룹 및 세부코드 실시간 동기화
  const refreshCodes = async () => {
    try {
      const [groupsRes, codesRes] = await Promise.all([
        fetch("/api/codes/groups"),
        fetch("/api/codes"),
      ]);
      const groupsJson = await groupsRes.json();
      const codesJson = await codesRes.json();

      if (groupsJson.success && Array.isArray(groupsJson.data)) {
        setCodeGroups(groupsJson.data);
      }
      if (codesJson.success && Array.isArray(codesJson.data)) {
        setCodes(codesJson.data);
      }
    } catch (e) {
      console.error("Failed to load codes from DB:", e);
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
        tournaments,
        setTournaments,
        participants,
        setParticipants,
        maps,
        setMaps,
        codeGroups,
        setCodeGroups,
        codes,
        setCodes,
        refreshCodes,
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
