// File: lib/codes/codeClient.ts
// Page/Component: codeClient
// Purpose: 공통코드 관리 화면의 그룹·상세 코드 HTTP 요청을 도메인별로 통일한다.
import type { CodeGroupItem, CodeItem } from "@/lib/types/codes";

type ApiResult<T> = { success: boolean; data?: T; message?: string };
type CodeGroupPayload = Omit<CodeGroupItem, "createdAt">;

// 공통코드 그룹 목록을 조회한다.
export async function fetchCodeGroups(): Promise<ApiResult<CodeGroupItem[]>> {
  return (await fetch("/api/codes/groups")).json();
}
// 선택한 그룹의 상세 코드를 조회한다.
export async function fetchCodes(
  groupCode: string,
): Promise<ApiResult<CodeItem[]>> {
  return (
    await fetch(`/api/codes?groupCode=${encodeURIComponent(groupCode)}`)
  ).json();
}
// 공통코드 그룹 생성 또는 수정 요청을 전송한다.
export async function saveCodeGroup(
  payload: CodeGroupPayload,
  isNew: boolean,
): Promise<ApiResult<CodeGroupItem>> {
  return (
    await fetch("/api/codes/groups", {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  ).json();
}
// 공통코드 그룹 삭제 요청을 전송한다.
export async function deleteCodeGroup(
  groupCode: string,
): Promise<ApiResult<undefined>> {
  return (
    await fetch(
      `/api/codes/groups?groupCode=${encodeURIComponent(groupCode)}`,
      { method: "DELETE" },
    )
  ).json();
}
// 상세 코드 생성 또는 수정 요청을 전송한다.
export async function saveCode(
  payload: CodeItem,
  isNew: boolean,
): Promise<ApiResult<CodeItem>> {
  return (
    await fetch("/api/codes", {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  ).json();
}
// 상세 코드 삭제 요청을 전송한다.
export async function deleteCode(
  groupCode: string,
  code: string,
): Promise<ApiResult<undefined>> {
  return (
    await fetch(
      `/api/codes?groupCode=${encodeURIComponent(groupCode)}&code=${encodeURIComponent(code)}`,
      { method: "DELETE" },
    )
  ).json();
}
