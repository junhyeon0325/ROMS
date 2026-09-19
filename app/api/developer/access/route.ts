// DEV 전용 Route Handler의 인증·권한 응답을 확인하는 최소 상태 API다.
import { NextResponse } from "next/server";
import { requireDeveloperApi } from "@/lib/auth-guards";

// 인증된 DEV 요청에만 개발자 API 접근 가능 상태를 반환한다.
export async function GET() {
  const authError = await requireDeveloperApi();
  if (authError) return authError;

  return NextResponse.json({ success: true, data: { role: "DEV" } });
}
