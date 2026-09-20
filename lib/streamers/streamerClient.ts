// File: lib/streamers/streamerClient.ts
// Page/Component: streamerClient
// Purpose: 스트리머 관리 화면이 사용하는 HTTP 요청 형식과 응답 타입을 한곳에서 관리한다.
import type { StreamerFormData, StreamerItem } from "@/lib/types/streamers";

type ApiResult<T> = { success: boolean; data?: T; message?: string };

// 스트리머 목록 API를 호출한다.
export async function fetchStreamers(): Promise<ApiResult<StreamerItem[]>> { return (await fetch("/api/streamers")).json(); }

// 스트리머 생성 또는 수정 요청을 기존 API 형식으로 전송한다.
export async function saveStreamer(form: StreamerFormData, id?: string | null): Promise<ApiResult<StreamerItem>> {
  return (await fetch("/api/streamers", { method: id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(id ? { ...form, id } : form) })).json();
}
