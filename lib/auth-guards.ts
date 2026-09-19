// 서버 컴포넌트와 Route Handler가 공유하는 인증·역할 권한 검사 함수다.
import "server-only";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

type SessionUser = Session["user"];

export class AuthorizationError extends Error {
  // 인증 실패와 권한 부족을 HTTP 상태로 명확히 구분한다.
  constructor(
    public readonly status: 401 | 403,
    message: string,
  ) {
    super(message);
    this.name = "AuthorizationError";
  }
}

// 로그인 세션이 있는 사용자를 반환한다.
export async function requireUser(): Promise<SessionUser> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new AuthorizationError(401, "로그인이 필요합니다.");
  }
  return session.user;
}

// 일반 관리자 기능에 ADMIN 또는 DEV 역할만 허용한다.
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.role !== "DEV") {
    throw new AuthorizationError(403, "관리자 권한이 필요합니다.");
  }
  return user;
}

// 개발자 전용 기능에는 DEV 역할만 허용한다.
export async function requireDeveloper(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "DEV") {
    throw new AuthorizationError(403, "개발자 권한이 필요합니다.");
  }
  return user;
}

// 관리자 Route Handler가 401과 403을 일관된 JSON 응답으로 반환하게 한다.
export async function requireAdminApi(): Promise<NextResponse | null> {
  try {
    await requireAdmin();
    return null;
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.status },
      );
    }
    throw error;
  }
}

// 개발자 Route Handler가 ADMIN을 포함한 비개발자 요청을 거부하게 한다.
export async function requireDeveloperApi(): Promise<NextResponse | null> {
  try {
    await requireDeveloper();
    return null;
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.status },
      );
    }
    throw error;
  }
}
