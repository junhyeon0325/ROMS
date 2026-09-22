// File: lib/context/AdminFeatureContexts.tsx
// Page/Component: 관리자 기능별 상태 Provider
// Purpose: 관리자 화면의 도메인 데이터와 피드백·화면 상태를 독립적으로 제공한다.
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { usePathname } from "next/navigation";
import type { CodeGroupItem } from "@/lib/types/codes";
import type { HeroItem } from "@/lib/types/heroes";
import type { MapItem } from "@/lib/types/maps";
import type { StreamerItem } from "@/lib/types/streamers";
import { fetchCodeGroups } from "@/lib/codes/codeClient";
import { fetchHeroes } from "@/lib/heroes/heroClient";
import { fetchMaps } from "@/lib/maps/mapClient";
import { fetchStreamers } from "@/lib/streamers/streamerClient";

type DataState<T> = {
  items: T[];
  setItems: Dispatch<SetStateAction<T[]>>;
  refresh: () => Promise<void>;
  isLoading: boolean;
  error: Error | null;
};

// 관리자 API 목록을 조회하고 각 도메인 상태로 보관한다.
function createDataContext<T>(
  name: string,
  loadItems: () => Promise<{ success: boolean; data?: T[]; message?: string }>,
  shouldLoad: (pathname: string) => boolean,
) {
  const Context = createContext<DataState<T> | undefined>(undefined);
  function Provider({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const [items, setItems] = useState<T[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const refresh = useCallback(async () => {
      try {
        setError(null);
        setIsLoading(true);
        const json = await loadItems();
        if (json.success && Array.isArray(json.data)) {
          setItems(json.data);
        } else {
          setError(new Error(json.message || `${name}을(를) 불러오지 못했습니다.`));
        }
      } catch (cause) {
        console.error(`Failed to load ${name}:`, cause);
        setError(cause instanceof Error ? cause : new Error(`${name}을(를) 불러오지 못했습니다.`));
      } finally {
        setIsLoading(false);
      }
    }, [loadItems]);
    // 현재 페이지가 이 도메인 데이터를 필요로 할 때만 API 목록을 요청한다.
    useEffect(() => {
      if (shouldLoad(pathname)) void refresh();
    }, [pathname, refresh]);
    return (
      <Context.Provider value={{ items, setItems, refresh, isLoading, error }}>
        {children}
      </Context.Provider>
    );
  }
  function useData() {
    const value = useContext(Context);
    if (!value) throw new Error(`${name} must be used within its provider`);
    return value;
  }
  return { Provider, useData };
}

const isDashboard = (pathname: string) => pathname === "/admin";
const streamers = createDataContext<StreamerItem>(
  "streamers",
  fetchStreamers,
  (pathname) => isDashboard(pathname) || pathname.startsWith("/admin/streamers") || pathname.startsWith("/admin/members") || pathname.startsWith("/admin/tournaments"),
);
const maps = createDataContext<MapItem>("maps", fetchMaps, (pathname) => isDashboard(pathname) || pathname.startsWith("/admin/maps"));
const heroes = createDataContext<HeroItem>("heroes", fetchHeroes, (pathname) => isDashboard(pathname) || pathname.startsWith("/admin/heroes"));
const codeGroups = createDataContext<CodeGroupItem>(
  "code groups",
  fetchCodeGroups,
  (pathname) => isDashboard(pathname) || pathname.startsWith("/admin/codes"),
);

export const AdminStreamersProvider = streamers.Provider;
export const AdminMapsProvider = maps.Provider;
export const AdminHeroesProvider = heroes.Provider;
export const AdminCodesProvider = codeGroups.Provider;
export const useAdminStreamers = streamers.useData;
export const useAdminMaps = maps.useData;
export const useAdminHeroes = heroes.useData;
export const useAdminCodes = codeGroups.useData;

// 실제 목록 데이터를 사용하는 네 도메인 Context만 조합해 data 책임을 한 곳에 모은다.
export function AdminDataProvider({ children }: { children: ReactNode }) {
  return (
    <AdminStreamersProvider>
      <AdminMapsProvider>
        <AdminHeroesProvider>
          <AdminCodesProvider>{children}</AdminCodesProvider>
        </AdminHeroesProvider>
      </AdminMapsProvider>
    </AdminStreamersProvider>
  );
}

interface FeedbackState {
  toastMessage: string | null;
  showFeedback: (message: string) => void;
}
const FeedbackContext = createContext<FeedbackState | undefined>(undefined);

// 전역 알림을 도메인 데이터와 분리해 제공한다.
export function AdminFeedbackProvider({ children }: { children: ReactNode }) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showFeedback = useCallback((message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 2800);
  }, []);
  return (
    <FeedbackContext.Provider value={{ toastMessage, showFeedback }}>
      {children}
    </FeedbackContext.Provider>
  );
}

export function useAdminFeedback() {
  const value = useContext(FeedbackContext);
  if (!value)
    throw new Error(
      "useAdminFeedback must be used within an AdminFeedbackProvider",
    );
  return value;
}

interface UiState {
  menuSearchQuery: string;
  setMenuSearchQuery: (query: string) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}
const UiContext = createContext<UiState | undefined>(undefined);

// 관리자 탐색과 테마 상태를 도메인 데이터와 분리해 제공한다.
export function AdminUiProvider({ children }: { children: ReactNode }) {
  const [menuSearchQuery, setMenuSearchQuery] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  useEffect(
    () => setIsDarkMode(document.documentElement.classList.contains("dark")),
    [],
  );
  const toggleDarkMode = () =>
    setIsDarkMode((current) => {
      const next = !current;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("roms_theme", next ? "dark" : "light");
      return next;
    });
  return (
    <UiContext.Provider
      value={{
        menuSearchQuery,
        setMenuSearchQuery,
        isDarkMode,
        toggleDarkMode,
      }}
    >
      {children}
    </UiContext.Provider>
  );
}

export function useAdminUi() {
  const value = useContext(UiContext);
  if (!value)
    throw new Error("useAdminUi must be used within an AdminUiProvider");
  return value;
}

// 기존 개별 Provider export를 보존하면서 관리자 레이아웃용 책임별 조합 진입점을 제공한다.
export function AdminFeatureProviders({ children }: { children: ReactNode }) {
  return (
    <AdminFeedbackProvider>
      <AdminUiProvider>
        <AdminDataProvider>{children}</AdminDataProvider>
      </AdminUiProvider>
    </AdminFeedbackProvider>
  );
}
