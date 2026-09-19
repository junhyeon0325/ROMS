// 모든 관리자 화면 진입 전에 JWT의 로그인 여부와 관리자 역할을 확인한다.
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// /admin 경로를 로그인 화면 또는 공개 홈으로 안전하게 분기한다.
export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "callbackUrl",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(loginUrl);
  }

  if (token.role !== "ADMIN" && token.role !== "DEV") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
