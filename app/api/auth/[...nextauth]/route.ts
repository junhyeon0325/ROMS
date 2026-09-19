// NextAuth Credentials 로그인·세션·로그아웃 요청을 처리하는 인증 엔드포인트다.
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
