// File: lib/context/AdminFeatureContexts.tsx
// Page/Component: 관리자 기능별 상태 Provider
// Purpose: 관리자 화면의 도메인 데이터와 피드백·화면 상태를 독립적으로 제공한다.
"use client";

import { createContext, useCallback, useContext, useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { CodeGroupItem, HeroItem, MapItem, MemberItem } from "@/lib/types/admin";

type DataState<T> = { items: T[]; setItems: Dispatch<SetStateAction<T[]>>; refresh: () => Promise<void>; isLoading: boolean };

// 관리자 API 목록을 조회하고 각 도메인 상태로 보관한다.
function createDataContext<T>(name: string, endpoint: string) {
  const Context = createContext<DataState<T> | undefined>(undefined);
  function Provider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<T[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const refresh = useCallback(async () => {
      try {
        setIsLoading(true);
        const response = await fetch(endpoint);
        const json = await response.json();
        if (json.success && Array.isArray(json.data)) setItems(json.data);
      } catch (error) {
        console.error(`Failed to load ${name}:`, error);
      } finally {
        setIsLoading(false);
      }
    }, []);
    useEffect(() => { void refresh(); }, [refresh]);
    return <Context.Provider value={{ items, setItems, refresh, isLoading }}>{children}</Context.Provider>;
  }
  function useData() {
    const value = useContext(Context);
    if (!value) throw new Error(`${name} must be used within its provider`);
    return value;
  }
  return { Provider, useData };
}

const members = createDataContext<MemberItem>("members", "/api/members");
const maps = createDataContext<MapItem>("maps", "/api/maps");
const heroes = createDataContext<HeroItem>("heroes", "/api/heroes");
const codeGroups = createDataContext<CodeGroupItem>("code groups", "/api/codes/groups");

export const AdminMembersProvider = members.Provider;
export const AdminMapsProvider = maps.Provider;
export const AdminHeroesProvider = heroes.Provider;
export const AdminCodesProvider = codeGroups.Provider;
export const useAdminMembers = members.useData;
export const useAdminMaps = maps.useData;
export const useAdminHeroes = heroes.useData;
export const useAdminCodes = codeGroups.useData;

interface FeedbackState { toastMessage: string | null; showFeedback: (message: string) => void; }
const FeedbackContext = createContext<FeedbackState | undefined>(undefined);

// 전역 알림을 도메인 데이터와 분리해 제공한다.
export function AdminFeedbackProvider({ children }: { children: ReactNode }) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showFeedback = useCallback((message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 2800);
  }, []);
  return <FeedbackContext.Provider value={{ toastMessage, showFeedback }}>{children}</FeedbackContext.Provider>;
}

export function useAdminFeedback() {
  const value = useContext(FeedbackContext);
  if (!value) throw new Error("useAdminFeedback must be used within an AdminFeedbackProvider");
  return value;
}

interface UiState { menuSearchQuery: string; setMenuSearchQuery: (query: string) => void; isDarkMode: boolean; toggleDarkMode: () => void; }
const UiContext = createContext<UiState | undefined>(undefined);

// 관리자 탐색과 테마 상태를 도메인 데이터와 분리해 제공한다.
export function AdminUiProvider({ children }: { children: ReactNode }) {
  const [menuSearchQuery, setMenuSearchQuery] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  useEffect(() => setIsDarkMode(document.documentElement.classList.contains("dark")), []);
  const toggleDarkMode = () => setIsDarkMode((current) => {
    const next = !current;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("roms_theme", next ? "dark" : "light");
    return next;
  });
  return <UiContext.Provider value={{ menuSearchQuery, setMenuSearchQuery, isDarkMode, toggleDarkMode }}>{children}</UiContext.Provider>;
}

export function useAdminUi() {
  const value = useContext(UiContext);
  if (!value) throw new Error("useAdminUi must be used within an AdminUiProvider");
  return value;
}
